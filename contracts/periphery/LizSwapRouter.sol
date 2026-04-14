// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// LizSwapRouter.sol — Task 2.6: LizSwapRouter (Periphery)
// Giải quyết:
//   [UC-03]   Hoán đổi Token (Swap) — swapExactTokensForTokens
//   [UC-04]   Thêm Thanh khoản (Add Liquidity) — addLiquidity
//   [UC-05]   Rút Thanh khoản (Remove Liquidity) — removeLiquidity
//   [FR-01.3] Tính toán output theo x*y=k (qua LizSwapLibrary)
//   [FR-01.4] Slippage check: amountOutMin, amountAMin, amountBMin
//   [FR-01.5] Gửi giao dịch swap lên on-chain
//   [FR-02.4] Mint LP Token cho người cung cấp thanh khoản
//   [FR-03.2] Burn LP Token để rút thanh khoản về
//   C4-Component (Router): "Lớp ngoại vi. Logic xử lý lệnh Swap [FR-01.5],
//                           Add Liquidity [FR-02.4] và Remove Liquidity [FR-03.3]."
//
// Router là entry point DUY NHẤT mà Frontend (swapService.ts) gọi vào.
// Mọi luồng [UC-03..05] đều được Router điều phối:
//   - Tính toán lượng token qua LizSwapLibrary
//   - Transfer token từ user → Pair
//   - Gọi Pair.mint() / Pair.burn() / Pair.swap()
//   - Kiểm tra slippage và deadline trước mỗi thao tác
//
// Khác biệt so với Uniswap V2 Router gốc:
//   - Solidity ^0.8.20 (SafeMath mặc định)
//   - Không hỗ trợ ETH/WETH native swap (token-to-token only, MVP scope)
//   - pairFor() dùng Factory.getPair() thay vì tính CREATE2 inline
// ============================================================================

import "../interfaces/ILizSwapFactory.sol";
import "../interfaces/ILizSwapPair.sol";
import "../interfaces/ILizSwapRouter.sol";
import "./libraries/LizSwapLibrary.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LizSwapRouter
 * @notice Periphery entry point cho toàn bộ user-facing operations của LizSwapSimple DEX.
 *         Frontend (swapService.ts) gọi trực tiếp contract này để thực hiện:
 *         - Swap token [UC-03]
 *         - Thêm thanh khoản [UC-04]
 *         - Rút thanh khoản [UC-05]
 *
 * @dev Implement ILizSwapRouter interface (Task 2.1).
 *      Sử dụng LizSwapLibrary để tính toán amounts và tra cứu reserves.
 *      Tất cả hàm mutating đều có modifier ensure(deadline) để chống hết hạn TX.
 *
 *      Luồng hoạt động tổng quát:
 *      Frontend → Router → [Library tính toán] → Transfer Token → Pair (mint/burn/swap)
 *
 *      Yêu cầu từ caller trước mỗi thao tác [UC-02]:
 *      - addLiquidity: approve tokenA + tokenB cho Router
 *      - removeLiquidity: approve LP Token cho Router
 *      - swapExactTokensForTokens: approve path[0] cho Router
 */
contract LizSwapRouter is ILizSwapRouter {
    // =========================================================================
    // State Variables — Immutable
    // =========================================================================

    /// @notice Địa chỉ LizSwapFactory contract
    /// @dev [C4-Component - Router: "Lấy địa chỉ Pool (getPair)"]
    ///      Immutable — set một lần trong constructor, không thể thay đổi
    address public immutable override factory;

    /// @notice Địa chỉ Wrapped Native Token (WBNB trên BSC)
    /// @dev MVP scope: token-to-token only. WETH field giữ để compatible với
    ///      chuẩn Uniswap V2 Router interface. Không sử dụng trong logic hiện tại.
    address public immutable override WETH;

    // =========================================================================
    // Modifier — Deadline check
    // =========================================================================

    /**
     * @dev [FR-01.4] Kiểm tra giao dịch chưa hết hạn trước khi thực thi.
     *      Bảo vệ người dùng khỏi việc giao dịch lỗi thời được thực thi
     *      sau khi thị trường đã biến động mạnh.
     *
     *      Revert với message "LizSwapRouter: EXPIRED" nếu block.timestamp > deadline.
     *
     * @param deadline Unix timestamp tối đa để giao dịch còn hợp lệ
     */
    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "LizSwapRouter: EXPIRED");
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    /**
     * @notice Khởi tạo Router với địa chỉ Factory và WETH.
     * @dev Deployment Script (Task 2.8) sẽ deploy Factory trước, sau đó
     *      truyền địa chỉ Factory vào đây.
     *      WETH set thành address(0) cho MVP scope (token-to-token only).
     *
     * @param _factory Địa chỉ LizSwapFactory contract đã deploy
     * @param _WETH    Địa chỉ WBNB (hoặc address(0) nếu không dùng Native Swap)
     */
    constructor(address _factory, address _WETH) {
        require(_factory != address(0), "LizSwapRouter: ZERO_FACTORY");
        factory = _factory;
        WETH = _WETH;
    }

    // =========================================================================
    // Pure/View Functions — Tính toán AMM [FR-01.3] [FR-01.4] [FR-02.2]
    // =========================================================================

    /**
     * @notice Tính lượng tokenB tương đương với lượng tokenA theo tỷ giá Pool [FR-02.2].
     * @dev Proxy sang LizSwapLibrary.quote().
     *      Dùng khi thêm thanh khoản: người dùng nhập amountA → auto-fill amountB.
     *      Công thức: amountB = amountA * reserveB / reserveA (không bao gồm phí).
     *
     *      [FR-02.2] Auto-quote số lượng Token B tương đương dựa trên tỷ giá Pool.
     *
     * @param amountA  Số lượng token A muốn cung cấp
     * @param reserveA Reserve hiện tại của token A trong Pool
     * @param reserveB Reserve hiện tại của token B trong Pool
     * @return amountB Số lượng token B tương đương cần cung cấp
     */
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure override returns (uint256 amountB) {
        return LizSwapLibrary.quote(amountA, reserveA, reserveB);
    }

    /**
     * @notice Tính số lượng token đầu ra sau phí 0.3% [FR-01.3].
     * @dev Proxy sang LizSwapLibrary.getAmountOut().
     *      Công thức AMM có phí:
     *        amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
     *
     *      [FR-01.3] Hiển thị số lượng Token đầu ra ước tính theo công thức x*y=k.
     *
     * @param amountIn   Số lượng token đưa vào
     * @param reserveIn  Reserve của token đưa vào
     * @param reserveOut Reserve của token nhận ra
     * @return amountOut Số lượng token nhận được sau phí
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure override returns (uint256 amountOut) {
        return LizSwapLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    /**
     * @notice Tính mảng số lượng token cho toàn bộ path swap [FR-01.4].
     * @dev Proxy sang LizSwapLibrary.getAmountsOut().
     *      Dùng để hiển thị Price Impact và Minimum Received trên UI.
     *
     *      [FR-01.4] Hiển thị các thông số Price Impact, Minimum Received.
     *
     * @param amountIn Số lượng token đầu vào
     * @param path     Mảng địa chỉ token theo thứ tự swap
     * @return amounts Mảng số lượng token tại mỗi bước
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) public view override returns (uint256[] memory amounts) {
        return LizSwapLibrary.getAmountsOut(factory, amountIn, path);
    }

    // =========================================================================
    // Internal Functions — Add Liquidity Logic
    // =========================================================================

    /**
     * @notice Hàm nội bộ tính toán lượng token thực sự nạp vào Pool [UC-04].
     *
     * @dev Logic xử lý 2 trường hợp:
     *      1. Pool chưa tồn tại → tự động createPair → dùng amountDesired làm input.
     *      2. Pool đã có reserve → tính optimal amount theo tỷ giá hiện tại:
     *         - Tính amountBOptimal từ amountADesired theo tỷ giá
     *           → nếu amountBOptimal <= amountBDesired và >= amountBMin: dùng (amountADesired, amountBOptimal)
     *         - Ngược lại tính amountAOptimal từ amountBDesired
     *           → nếu amountAOptimal <= amountADesired và >= amountAMin: dùng (amountAOptimal, amountBDesired)
     *         - Cả hai trường hợp fail → revert (slippage quá cao)
     *
     *      [FR-02.2] Tự động quy đổi số lượng Token thứ hai tương đương dựa trên tỷ giá Pool.
     *
     * @param tokenA         Địa chỉ token A
     * @param tokenB         Địa chỉ token B
     * @param amountADesired Mong muốn nạp tối đa token A
     * @param amountBDesired Mong muốn nạp tối đa token B
     * @param amountAMin     Số lượng token A tối thiểu chấp nhận
     * @param amountBMin     Số lượng token B tối thiểu chấp nhận
     * @return amountA       Số lượng token A thực sự nạp vào
     * @return amountB       Số lượng token B thực sự nạp vào
     */
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        // [UC-04] Tự động tạo Pool nếu chưa tồn tại
        if (ILizSwapFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            ILizSwapFactory(factory).createPair(tokenA, tokenB);
        }

        // Lấy reserves hiện tại của Pool
        (uint256 reserveA, uint256 reserveB) = _getReservesOrZero(tokenA, tokenB);

        if (reserveA == 0 && reserveB == 0) {
            // --- Pool mới tạo, chưa có thanh khoản ---
            // Dùng amountDesired làm input initial (không cần tính tỷ giá)
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            // --- Pool đã có thanh khoản — tính optimal amount ---
            // [FR-02.2] Tính amountB tương đương với amountADesired theo tỷ giá hiện tại
            uint256 amountBOptimal = LizSwapLibrary.quote(amountADesired, reserveA, reserveB);

            if (amountBOptimal <= amountBDesired) {
                // Optimal B nhỏ hơn desired B → dùng amountADesired + amountBOptimal
                require(
                    amountBOptimal >= amountBMin,
                    "LizSwapRouter: INSUFFICIENT_B_AMOUNT"
                );
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                // Optimal B lớn hơn desired B → tính ngược lại từ amountBDesired
                uint256 amountAOptimal = LizSwapLibrary.quote(amountBDesired, reserveB, reserveA);
                // amountAOptimal phải <= amountADesired (vì amountBOptimal > amountBDesired)
                assert(amountAOptimal <= amountADesired);
                require(
                    amountAOptimal >= amountAMin,
                    "LizSwapRouter: INSUFFICIENT_A_AMOUNT"
                );
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    // =========================================================================
    // Mutating Functions — Add Liquidity [UC-04] [FR-02.4]
    // =========================================================================

    /**
     * @notice Thêm thanh khoản vào Pool tokenA/tokenB [UC-04] [FR-02.4].
     *
     * @dev Luồng thực thi:
     *      1. Gọi _addLiquidity() → tính amountA, amountB thực sự nạp
     *      2. Lấy địa chỉ Pair từ Factory
     *      3. TransferFrom tokenA từ msg.sender → Pair (caller đã approve trước [UC-02])
     *      4. TransferFrom tokenB từ msg.sender → Pair
     *      5. Gọi pair.mint(to) → nhận LP Token [FR-02.4]
     *
     *      [UC-04] Thêm Thanh khoản (Add Liquidity)
     *      [FR-02.4] Người dùng nhận LP Token đại diện cho phần đóng góp Pool
     *
     * @param tokenA         Địa chỉ token A
     * @param tokenB         Địa chỉ token B
     * @param amountADesired Mong muốn nạp tối đa token A
     * @param amountBDesired Mong muốn nạp tối đa token B
     * @param amountAMin     Số lượng token A tối thiểu chấp nhận (chống slippage) [FR-01.4]
     * @param amountBMin     Số lượng token B tối thiểu chấp nhận (chống slippage)
     * @param to             Địa chỉ nhận LP Token
     * @param deadline       Unix timestamp — revert nếu quá hạn [FR-01.4]
     * @return amountA       Số lượng token A thực sự nạp vào
     * @return amountB       Số lượng token B thực sự nạp vào
     * @return liquidity     Số lượng LP Token được mint cho `to`
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        override
        ensure(deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        // [UC-04] Tính toán lượng token thực sự nạp (xử lý tỷ giá hiện tại)
        (amountA, amountB) = _addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin
        );

        // Lấy địa chỉ Pair (Pool đã tồn tại sau _addLiquidity)
        address pair = ILizSwapFactory(factory).getPair(tokenA, tokenB);

        // [UC-02] Transfer token vào Pair — caller đã approve trước
        _safeTransferFrom(tokenA, msg.sender, pair, amountA);
        _safeTransferFrom(tokenB, msg.sender, pair, amountB);

        // [FR-02.4] Mint LP Token cho người cung cấp thanh khoản
        liquidity = ILizSwapPair(pair).mint(to);
    }

    // =========================================================================
    // Mutating Functions — Remove Liquidity [UC-05] [FR-03.2]
    // =========================================================================

    /**
     * @notice Rút thanh khoản từ Pool tokenA/tokenB [UC-05] [FR-03.2].
     *
     * @dev Luồng thực thi:
     *      1. Lấy địa chỉ Pair từ Factory (revert nếu Pool chưa tồn tại)
     *      2. TransferFrom LP Token từ msg.sender → Pair (caller đã approve trước [UC-02] [FR-03.3])
     *      3. Gọi pair.burn(to) → Pair burn LP Token, transfers token A + B về `to`
     *      4. Kiểm tra slippage: amountA >= amountAMin, amountB >= amountBMin [FR-01.4]
     *      5. Xác định đúng thứ tự amountA/amountB theo tokenA/tokenB
     *
     *      [UC-05] Rút Thanh khoản (Remove Liquidity)
     *      [FR-03.2] Đổi LP Token lấy lại Token A và Token B theo tỷ lệ tại thời điểm rút
     *
     * @param tokenA     Địa chỉ token A
     * @param tokenB     Địa chỉ token B
     * @param liquidity  Số lượng LP Token muốn đốt (burn)
     * @param amountAMin Số lượng token A tối thiểu nhận về (chống slippage)
     * @param amountBMin Số lượng token B tối thiểu nhận về (chống slippage)
     * @param to         Địa chỉ nhận token A và B sau khi rút
     * @param deadline   Unix timestamp — revert nếu quá hạn
     * @return amountA   Số lượng token A thực sự nhận về
     * @return amountB   Số lượng token B thực sự nhận về
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        // Lấy địa chỉ Pair — revert nếu Pool chưa tồn tại
        address pair = LizSwapLibrary.pairFor(factory, tokenA, tokenB);

        // [UC-02] [FR-03.3] Transfer LP Token từ user vào Pair (caller đã approve)
        // Pair.burn() đọc balanceOf(address(this)) để biết lượng LP cần burn
        _safeTransferFrom(address(pair), msg.sender, pair, liquidity);

        // [FR-03.2] Gọi Pair.burn() — burn LP Token, trả token A + B về `to`
        // burn() trả về (amount0, amount1) theo thứ tự canonical (token0/token1)
        (uint256 amount0, uint256 amount1) = ILizSwapPair(pair).burn(to);

        // Map amount0/amount1 → amountA/amountB theo đúng thứ tự input
        // (Pair lưu theo canonical order token0 < token1, input có thể khác thứ tự)
        (address token0, ) = LizSwapLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0
            ? (amount0, amount1)
            : (amount1, amount0);

        // [FR-01.4] Kiểm tra slippage — số lượng nhận về phải >= minimum
        require(amountA >= amountAMin, "LizSwapRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "LizSwapRouter: INSUFFICIENT_B_AMOUNT");
    }

    // =========================================================================
    // Internal Functions — Swap Logic
    // =========================================================================

    /**
     * @notice Execute chuỗi swap qua path [UC-03] [FR-01.5].
     *
     * @dev Duyệt qua từng hop trong path và thực hiện swap tại mỗi Pair:
     *      - Xác định output token và địa chỉ nhận tiếp theo trong chain
     *      - Phần lớn path: tiếp theo là Pair tiếp theo trong chain
     *      - Hop cuối: gửi output về địa chỉ `_to` (người dùng hoặc contract)
     *      - Tính (amount0Out, amount1Out) dựa trên canonical order token0/token1
     *
     *      Luồng cho path [A, B, C]:
     *        Hop 1: Pair(A,B).swap(amounts[1] amountOut cho B) → Pair(B,C)
     *        Hop 2: Pair(B,C).swap(amounts[2] amountOut cho C) → _to
     *
     *      Input token (amounts[0]) đã được Router transfer vào Pair đầu tiên
     *      trước khi gọi _swap() (trong swapExactTokensForTokens).
     *
     *      [FR-01.5] Cho phép người dùng ký và gửi giao dịch lên on-chain.
     *
     * @param amounts Mảng amounts tại mỗi bước (đã tính bởi getAmountsOut)
     * @param path    Mảng địa chỉ token theo thứ tự swap
     * @param _to     Địa chỉ nhận token đầu ra cuối cùng
     */
    function _swap(
        uint256[] memory amounts,
        address[] memory path,
        address _to
    ) internal {
        for (uint256 i = 0; i < path.length - 1; i++) {
            // Token đầu vào và đầu ra của hop hiện tại
            address input = path[i];
            address output = path[i + 1];

            // Xác định canonical order trong Pair
            (address token0, ) = LizSwapLibrary.sortTokens(input, output);

            // Lượng token output của hop này
            uint256 amountOut = amounts[i + 1];

            // Tính (amount0Out, amount1Out) dựa trên canonical order
            // Nếu output == token0: amount0Out = amountOut, amount1Out = 0
            // Ngược lại:            amount0Out = 0,         amount1Out = amountOut
            (uint256 amount0Out, uint256 amount1Out) = output == token0
                ? (amountOut, uint256(0))
                : (uint256(0), amountOut);

            // Địa chỉ nhận output của hop này:
            // - Nếu không phải hop cuối: Pair tiếp theo trong chain
            // - Nếu hop cuối: _to (người dùng cuối)
            address to = i < path.length - 2
                ? LizSwapLibrary.pairFor(factory, output, path[i + 2])
                : _to;

            // [UC-03] Gọi Pair.swap() — thực hiện hoán đổi tại Pool này
            ILizSwapPair(LizSwapLibrary.pairFor(factory, input, output)).swap(
                amount0Out,
                amount1Out,
                to,
                new bytes(0) // Không dùng flash swap callback (MVP scope)
            );
        }
    }

    // =========================================================================
    // Mutating Functions — Swap [UC-03] [FR-01.5]
    // =========================================================================

    /**
     * @notice Swap chính xác số lượng token đầu vào, nhận tối thiểu amountOutMin [UC-03].
     *
     * @dev Luồng thực thi:
     *      1. Gọi LizSwapLibrary.getAmountsOut() → tính output tại mỗi bước [FR-01.3]
     *      2. Validate slippage: amounts[last] >= amountOutMin [FR-01.4]
     *      3. TransferFrom path[0] từ msg.sender → Pair đầu tiên [UC-02]
     *      4. Gọi _swap() → chain swap qua tất cả hops trong path [FR-01.5]
     *
     *      Ví dụ: path = [TokenA, TokenB]
     *        - Tính amounts = [amountIn, amountOut] qua getAmountsOut
     *        - Transfer amountIn TokenA từ user → Pair(TokenA, TokenB)
     *        - Pair.swap(0, amountOut, to, "") → nhận amountOut TokenB
     *
     *      [UC-03]   Hoán đổi Token (Swap)
     *      [FR-01.3] Hiển thị số lượng output theo công thức x*y=k
     *      [FR-01.4] Slippage protection: amountOutMin
     *      [FR-01.5] Gửi giao dịch lên on-chain
     *
     * @param amountIn     Số lượng token đầu vào chính xác
     * @param amountOutMin Số lượng token đầu ra tối thiểu chấp nhận (slippage)
     * @param path         Mảng địa chỉ token theo thứ tự swap (ít nhất 2 phần tử)
     * @param to           Địa chỉ nhận token đầu ra cuối cùng
     * @param deadline     Unix timestamp — revert nếu quá hạn
     * @return amounts     Mảng số lượng token tại mỗi bước của path
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
        // [FR-01.3] Tính output dự kiến qua LizSwapLibrary
        amounts = LizSwapLibrary.getAmountsOut(factory, amountIn, path);

        // [FR-01.4] Slippage check — số lượng nhận về phải >= minimum
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "LizSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );

        // [UC-02] Transfer token đầu vào từ user vào Pair đầu tiên trong path
        // (Caller đã approve path[0] cho Router trước khi gọi hàm này)
        _safeTransferFrom(
            path[0],
            msg.sender,
            LizSwapLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );

        // [FR-01.5] Execute chain swap qua tất cả Pairs trong path
        _swap(amounts, path, to);
    }

    // =========================================================================
    // Private Helper Functions
    // =========================================================================

    /**
     * @notice Lấy reserves của Pool, trả về (0, 0) nếu Pool chưa có thanh khoản.
     * @dev Khác với LizSwapLibrary.getReserves() (revert nếu reserves = 0),
     *      hàm này trả về (0, 0) để _addLiquidity() xử lý Pool mới tạo.
     *
     * @param tokenA  Địa chỉ token A
     * @param tokenB  Địa chỉ token B
     * @return reserveA Reserve của tokenA (0 nếu Pool chưa có thanh khoản)
     * @return reserveB Reserve của tokenB (0 nếu Pool chưa có thanh khoản)
     */
    function _getReservesOrZero(
        address tokenA,
        address tokenB
    ) private view returns (uint256 reserveA, uint256 reserveB) {
        address pair = ILizSwapFactory(factory).getPair(tokenA, tokenB);

        // Pool chưa tồn tại hoặc không có reserves → trả về (0, 0)
        if (pair == address(0)) {
            return (0, 0);
        }

        (uint112 reserve0, uint112 reserve1, ) = ILizSwapPair(pair).getReserves();

        // Nếu chưa có thanh khoản → trả về (0, 0)
        if (reserve0 == 0 && reserve1 == 0) {
            return (0, 0);
        }

        // Map reserves về đúng thứ tự tokenA/tokenB
        (address token0, ) = LizSwapLibrary.sortTokens(tokenA, tokenB);
        (reserveA, reserveB) = tokenA == token0
            ? (uint256(reserve0), uint256(reserve1))
            : (uint256(reserve1), uint256(reserve0));
    }

    /**
     * @notice Safe transferFrom wrapper — đảm bảo transferFrom thành công.
     * @dev Sử dụng low-level call để tương thích cả token trả bool và không trả bool.
     *      Revert nếu call thất bại hoặc return false.
     *
     *      [UC-02] Phê duyệt Token (Approve) — caller phải approve trước khi gọi.
     *
     * @param token  Địa chỉ ERC20 token
     * @param from   Địa chỉ gửi (người dùng đã approve)
     * @param to     Địa chỉ nhận (thường là Pair contract)
     * @param value  Số lượng token cần chuyển
     */
    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) private {
        // Encode transferFrom(address,address,uint256) selector + params
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(
                IERC20.transferFrom.selector,
                from,
                to,
                value
            )
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "LizSwapRouter: TRANSFER_FROM_FAILED"
        );
    }
}
