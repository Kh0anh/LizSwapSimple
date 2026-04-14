// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// LizSwapPair.sol — Task 2.4: Lõi AMM (Automated Market Maker)
// Giải quyết:
//   [FR-01.3] Công thức Constant Product x*y=k — tính toán output amount
//   [UC-03]   Hoán đổi Token (Swap)
//   [UC-04]   Thêm Thanh khoản (Add Liquidity) — mint LP Token
//   [UC-05]   Rút Thanh khoản (Remove Liquidity) — burn LP Token
//   C4-Component (Pair/Pool): "Xử lý lõi AMM (x*y=k), giữ tiền và
//   kiểm soát token của LP."
//
// Contract này là trung tâm của hệ sinh thái LizSwapSimple:
//   - Kế thừa LizSwapERC20 để phát hành/thu hồi LP Token [FR-02.4]
//   - Sử dụng ReentrancyGuard từ OpenZeppelin cho bảo mật [techstack.md §1]
//   - Implement ILizSwapPair interface (Task 2.1)
//
// Khác biệt so với Uniswap V2 gốc:
//   - Solidity ^0.8.20 (SafeMath mặc định, overflow built-in)
//   - Kế thừa OpenZeppelin ERC20 + ReentrancyGuard thay vì tự code
//   - Không có flash swap callback (đơn giản hoá cho mục đích học thuật)
//   - Không có price oracle (TWAP) — chỉ giữ blockTimestampLast cho tương thích
// ============================================================================

import "./LizSwapERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LizSwapPair
 * @notice Lõi AMM Pool — quản lý thanh khoản và thực hiện hoán đổi token
 *         theo công thức Constant Product (x * y = k) [FR-01.3].
 *
 * @dev Contract này xử lý ba chức năng cốt lõi:
 *      1. mint() — Phát hành LP Token khi thêm thanh khoản [UC-04]
 *      2. burn() — Thu hồi LP Token khi rút thanh khoản [UC-05]
 *      3. swap() — Hoán đổi token theo x*y=k với phí 0.3% [UC-03]
 *
 *      Kế thừa LizSwapERC20 (LP Token ERC20 base) và ReentrancyGuard
 *      (bảo mật chống reentrancy attack) theo yêu cầu techstack.md §1.
 *
 *      Luồng hoạt động:
 *      - Factory deploy Pair → gọi initialize(token0, token1)
 *      - Router chuyển token vào Pair → gọi mint()/burn()/swap()
 *      - Pair tự quản lý reserves và kiểm tra invariant x*y=k
 */
contract LizSwapPair is LizSwapERC20, ReentrancyGuard {
    // =========================================================================
    // Constants
    // =========================================================================

    /**
     * @notice Lượng LP Token tối thiểu bị khoá vĩnh viễn khi tạo Pool lần đầu.
     * @dev Chống tấn công chia-0 (division by zero) và first-depositor inflation attack.
     *      1000 wei LP Token được mint tới address(0xdead) — burned forever.
     *      Giá trị này theo chuẩn Uniswap V2.
     */
    uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;

    // =========================================================================
    // State Variables — Task 2.4 spec
    // =========================================================================

    /// @notice Địa chỉ Factory đã deploy Pool này
    /// @dev Được set trong constructor, dùng để validate initialize()
    address public factory;

    /// @notice Địa chỉ token0 (sort nhỏ hơn trong cặp)
    /// @dev Canonical order: token0 < token1 (so sánh uint160)
    address public token0;

    /// @notice Địa chỉ token1 (sort lớn hơn trong cặp)
    address public token1;

    /// @notice Reserve hiện tại của token0 trong Pool
    /// @dev uint112 để tiết kiệm storage (packed cùng reserve1 và blockTimestampLast)
    ///      [FR-01.3] Frontend dùng reserves để tính toán quote/output amount
    uint112 private reserve0;

    /// @notice Reserve hiện tại của token1 trong Pool
    uint112 private reserve1;

    /// @notice Block timestamp của lần cập nhật reserve gần nhất
    /// @dev uint32 — đủ cho timestamp đến năm ~2106
    uint32 private blockTimestampLast;

    /// @notice Giá trị k (= reserve0 * reserve1) tại thời điểm cuối
    /// @dev Dùng để theo dõi sự thay đổi k giữa các lần mint/burn
    uint256 public kLast;

    // =========================================================================
    // Initialization Guard
    // =========================================================================

    /// @dev Flag ngăn không cho gọi initialize() nhiều hơn một lần
    bool private _initialized;

    // =========================================================================
    // Events — implement ILizSwapPair (Task 2.1)
    // =========================================================================

    /// @notice [UC-04] Phát ra khi LP Token được mint (Add Liquidity thành công)
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);

    /// @notice [UC-05] Phát ra khi LP Token được burn (Remove Liquidity thành công)
    event Burn(
        address indexed sender,
        uint256 amount0,
        uint256 amount1,
        address indexed to
    );

    /// @notice [UC-03] Phát ra khi Swap được thực hiện thành công
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );

    /// @notice Phát ra sau mỗi lần reserves được cập nhật
    event Sync(uint112 reserve0, uint112 reserve1);

    // =========================================================================
    // Constructor
    // =========================================================================

    /**
     * @notice Ghi nhận Factory là người deploy.
     * @dev msg.sender lúc deploy chính là Factory contract (LizSwapFactory).
     *      Token addresses được set sau qua initialize() để Factory có thể
     *      lấy địa chỉ Pair trước khi truyền token vào.
     *      [C4-Component - Factory: "Deploy & tạo địa chỉ Pool mới (createPair)"]
     */
    constructor() LizSwapERC20() {
        factory = msg.sender;
    }

    // =========================================================================
    // Initialize — được gọi bởi Factory ngay sau deploy
    // =========================================================================

    /**
     * @notice Khởi tạo địa chỉ token0 và token1 cho Pool.
     * @dev Chỉ được gọi duy nhất một lần, ngay sau khi Factory deploy Pair.
     *      Factory đảm bảo token0 < token1 (đã sort trước khi gọi).
     *      [C4-Component - Factory: "Deploy & tạo địa chỉ Pool mới (createPair)"]
     *
     * @param _token0 Địa chỉ token0 (sort nhỏ hơn)
     * @param _token1 Địa chỉ token1 (sort lớn hơn)
     */
    function initialize(address _token0, address _token1) external {
        require(!_initialized, "LizSwapPair: ALREADY_INITIALIZED");
        require(msg.sender == factory, "LizSwapPair: FORBIDDEN");
        token0 = _token0;
        token1 = _token1;
        _initialized = true;
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /**
     * @notice Đọc reserve hiện tại của cả hai token trong Pool.
     * @dev [FR-01.3] Frontend và Router dùng hàm này để tính toán:
     *      - Quote: amountB = amountA * reserveB / reserveA
     *      - getAmountOut: output theo công thức x*y=k có phí 0.3%
     *
     * @return _reserve0 Reserve token0 (uint112)
     * @return _reserve1 Reserve token1 (uint112)
     * @return _blockTimestampLast Block timestamp lần cập nhật gần nhất
     */
    function getReserves()
        public
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        )
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /**
     * @notice Cập nhật reserves với số dư mới và emit Sync event.
     * @dev Được gọi nội bộ sau mỗi thao tác mint/burn/swap.
     *      Đảm bảo reserves luôn đồng bộ với số dư token thực tế.
     *      Overflow check: balance phải fit trong uint112 (< 2^112).
     *
     * @param balance0   Số dư mới của token0 trong contract
     * @param balance1   Số dư mới của token1 trong contract
     */
    function _update(
        uint256 balance0,
        uint256 balance1,
        uint112, /* _reserve0 */
        uint112  /* _reserve1 */
    ) private {
        // Kiểm tra overflow — balance phải fit trong uint112
        require(
            balance0 <= type(uint112).max && balance1 <= type(uint112).max,
            "LizSwapPair: OVERFLOW"
        );

        // Cập nhật blockTimestampLast (mod 2^32 để phù hợp uint32)
        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);

        // Lưu reserves mới vào storage
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;

        // Emit Sync event — thông báo reserves đã được cập nhật
        emit Sync(reserve0, reserve1);
    }

    // =========================================================================
    // Core AMM Functions — mint, burn, swap
    // =========================================================================

    /**
     * @notice Mint LP Token cho người cung cấp thanh khoản [UC-04] [FR-02.4].
     *
     * @dev Luồng thực thi:
     *      1. Router chuyển token0 và token1 vào Pair contract trước khi gọi mint()
     *      2. Pair tính amount0 = balance0 - reserve0 (token mới nạp vào)
     *      3. Tính liquidity:
     *         - Lần đầu (totalSupply == 0):
     *           liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
     *           Mint MINIMUM_LIQUIDITY tới address(0xdead) để khoá vĩnh viễn
     *         - Lần sau:
     *           liquidity = min(amount0 * totalSupply / reserve0,
     *                          amount1 * totalSupply / reserve1)
     *      4. Gọi _mintLP(to, liquidity) — phát hành LP Token
     *      5. Gọi _update() — cập nhật reserves
     *      6. Emit Mint event
     *
     *      [FR-02.4] Người dùng nhận LP Token đại diện cho phần đóng góp Pool.
     *      Protected by nonReentrant modifier [techstack.md §1 - ReentrancyGuard]
     *
     * @param to Địa chỉ nhận LP Token (Liquidity Provider)
     * @return liquidity Số lượng LP Token được mint
     */
    function mint(
        address to
    ) external nonReentrant returns (uint256 liquidity) {
        // Đọc reserves hiện tại từ storage
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();

        // Lấy số dư token thực tế trong contract
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        // [UC-04] Tính lượng token mới được nạp vào (chênh lệch so với reserve)
        uint256 amount0 = balance0 - uint256(_reserve0);
        uint256 amount1 = balance1 - uint256(_reserve1);

        uint256 _totalSupply = totalSupply();

        if (_totalSupply == 0) {
            // --- Lần đầu tiên thêm thanh khoản ---
            // [FR-01.3] Công thức: liquidity = sqrt(amount0 * amount1)
            // Trừ MINIMUM_LIQUIDITY để khoá phần tối thiểu, chống first-depositor attack
            liquidity = _sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;

            // Khoá MINIMUM_LIQUIDITY LP Token vĩnh viễn tại address(0xdead)
            // (0xdead thay vì address(0) vì OZ ERC20 không cho mint tới address(0))
            _mintLP(address(0xdead), MINIMUM_LIQUIDITY);
        } else {
            // --- Lần thêm thanh khoản tiếp theo ---
            // [FR-02.4] Tính proportional liquidity dựa trên token ít hơn
            liquidity = _min(
                (amount0 * _totalSupply) / uint256(_reserve0),
                (amount1 * _totalSupply) / uint256(_reserve1)
            );
        }

        // Validate: phải mint được ít nhất 1 wei LP Token
        require(liquidity > 0, "LizSwapPair: INSUFFICIENT_LIQUIDITY_MINTED");

        // [FR-02.4] Mint LP Token cho người cung cấp thanh khoản
        _mintLP(to, liquidity);

        // Cập nhật reserves với số dư mới
        _update(balance0, balance1, _reserve0, _reserve1);

        // Cập nhật kLast = reserve0 * reserve1
        kLast = uint256(reserve0) * uint256(reserve1);

        // [UC-04] Emit Mint event
        emit Mint(msg.sender, amount0, amount1);
    }

    /**
     * @notice Burn LP Token để rút thanh khoản về [UC-05] [FR-03.2].
     *
     * @dev Luồng thực thi:
     *      1. Router chuyển LP Token vào Pair contract trước khi gọi burn()
     *      2. Pair đọc liquidity = balanceOf(address(this)) — LP Token đã nhận
     *      3. Tính lượng token trả lại:
     *         amount0 = liquidity * balance0 / totalSupply
     *         amount1 = liquidity * balance1 / totalSupply
     *      4. Burn LP Token: _burnLP(address(this), liquidity)
     *      5. Transfer token0 và token1 về cho `to`
     *      6. Gọi _update() — cập nhật reserves
     *      7. Emit Burn event
     *
     *      [FR-03.2] Người dùng đổi LP Token lấy lại Token A và Token B theo tỷ lệ.
     *      Protected by nonReentrant modifier [techstack.md §1 - ReentrancyGuard]
     *
     * @param to Địa chỉ nhận token A và token B sau khi burn
     * @return amount0 Số lượng token0 trả về
     * @return amount1 Số lượng token1 trả về
     */
    function burn(
        address to
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        // Đọc reserves hiện tại từ storage
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();

        // Đọc địa chỉ token từ storage (cache vào memory cho tiết kiệm gas)
        address _token0 = token0;
        address _token1 = token1;

        // Lấy số dư token thực tế trong contract
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));

        // [UC-05] Đọc lượng LP Token mà Router đã chuyển vào contract
        uint256 liquidity = balanceOf(address(this));

        uint256 _totalSupply = totalSupply();

        // [FR-03.2] Tính lượng token proportional theo LP Token đang burn
        // amount = liquidity * balance / totalSupply
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;

        // Validate: phải rút được ít nhất 1 wei mỗi token
        require(
            amount0 > 0 && amount1 > 0,
            "LizSwapPair: INSUFFICIENT_LIQUIDITY_BURNED"
        );

        // [FR-03.2] Burn LP Token từ contract (LP Token đã được Router chuyển vào)
        _burnLP(address(this), liquidity);

        // [UC-05] Transfer token về cho người rút thanh khoản
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);

        // Cập nhật balance sau khi transfer
        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));

        // Cập nhật reserves
        _update(balance0, balance1, _reserve0, _reserve1);

        // Cập nhật kLast
        kLast = uint256(reserve0) * uint256(reserve1);

        // [UC-05] Emit Burn event
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     * @notice Thực hiện hoán đổi token theo công thức x*y=k [UC-03] [FR-01.3].
     *
     * @dev Luồng thực thi:
     *      1. Validate: ít nhất 1 amountOut > 0
     *      2. Validate: amountOut < reserve tương ứng (đủ thanh khoản)
     *      3. Validate: to != token0 && to != token1 (chống re-entrancy patterns)
     *      4. Transfer tokenOut cho `to` (optimistic transfer)
     *      5. Đọc balance mới sau transfer
     *      6. Tính amountIn từ chênh lệch balance vs reserve
     *      7. Kiểm tra Constant Product invariant (có phí 0.3%):
     *         balance0Adjusted * balance1Adjusted >= reserve0 * reserve1 * 1000^2
     *         Trong đó: balanceAdjusted = balance * 1000 - amountIn * 3
     *      8. Gọi _update() — cập nhật reserves
     *      9. Emit Swap event
     *
     *      Phí 0.3% được tính bằng cách:
     *      - Với mỗi token đầu vào, 0.3% bị trừ trước khi kiểm tra invariant
     *      - amountIn * 997 / 1000 = net input (sau phí)
     *      - Phí tự động tích luỹ trong reserves → LP holders hưởng lợi
     *
     *      Protected by nonReentrant modifier [techstack.md §1 - ReentrancyGuard]
     *
     * @param amount0Out Số lượng token0 muốn nhận ra
     * @param amount1Out Số lượng token1 muốn nhận ra
     * @param to         Địa chỉ nhận token đầu ra
     */
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata /* data */
    ) external nonReentrant {
        // --- Bước 1: Validate ít nhất 1 amountOut > 0 ---
        require(
            amount0Out > 0 || amount1Out > 0,
            "LizSwapPair: INSUFFICIENT_OUTPUT_AMOUNT"
        );

        // --- Đọc reserves hiện tại ---
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();

        // --- Bước 2: Validate đủ thanh khoản ---
        require(
            amount0Out < _reserve0 && amount1Out < _reserve1,
            "LizSwapPair: INSUFFICIENT_LIQUIDITY"
        );

        uint256 balance0;
        uint256 balance1;

        {
            // Scoped block để tránh stack-too-deep error
            address _token0 = token0;
            address _token1 = token1;

            // --- Bước 3: Validate to không phải token addresses ---
            // Tránh re-entrancy patterns qua ERC20 callbacks
            require(
                to != _token0 && to != _token1,
                "LizSwapPair: INVALID_TO"
            );

            // --- Bước 4: Optimistic transfer — gửi token ra trước ---
            // [UC-03] Transfer token output cho người hoán đổi
            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out);
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out);

            // --- Bước 5: Đọc balance mới sau transfer ---
            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }

        // --- Bước 6: Tính amountIn thực tế ---
        // amountIn = balance hiện tại - (reserve - amountOut)
        // Nếu balance > reserve - amountOut → có token mới được nạp vào
        uint256 amount0In = balance0 > uint256(_reserve0) - amount0Out
            ? balance0 - (uint256(_reserve0) - amount0Out)
            : 0;
        uint256 amount1In = balance1 > uint256(_reserve1) - amount1Out
            ? balance1 - (uint256(_reserve1) - amount1Out)
            : 0;

        // Validate: ít nhất 1 amountIn > 0 (phải có token vào để đổi)
        require(
            amount0In > 0 || amount1In > 0,
            "LizSwapPair: INSUFFICIENT_INPUT_AMOUNT"
        );

        // --- Bước 7: Kiểm tra Constant Product invariant (x*y=k) có phí 0.3% ---
        // [FR-01.3] Công thức AMM: (reserve0_new * 1000 - amountIn0 * 3) *
        //                          (reserve1_new * 1000 - amountIn1 * 3) >=
        //                          reserve0_old * reserve1_old * 1000^2
        //
        // Phí 0.3%: cho mỗi amountIn, chỉ 99.7% (997/1000) được tính vào balance
        // Phần 0.3% còn lại tự động ở trong Pool → tăng reserves → LP hưởng lợi
        {
            uint256 balance0Adjusted = balance0 * 1000 - amount0In * 3;
            uint256 balance1Adjusted = balance1 * 1000 - amount1In * 3;

            require(
                balance0Adjusted * balance1Adjusted >=
                    uint256(_reserve0) * uint256(_reserve1) * (1000 ** 2),
                "LizSwapPair: K"
            );
        }

        // --- Bước 8: Cập nhật reserves ---
        _update(balance0, balance1, _reserve0, _reserve1);

        // --- Bước 9: Emit Swap event ---
        // [UC-03] Hoán đổi Token thành công
        emit Swap(
            msg.sender,
            amount0In,
            amount1In,
            amount0Out,
            amount1Out,
            to
        );
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /**
     * @notice Đồng bộ reserves với số dư token thực tế trong contract.
     * @dev Hữu ích khi ai đó gửi token trực tiếp vào Pool (không qua Router).
     *      Gọi _update() để cập nhật reserves theo balance thực.
     */
    function sync() external nonReentrant {
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this)),
            reserve0,
            reserve1
        );
    }

    // =========================================================================
    // Private Helper Functions
    // =========================================================================

    /**
     * @notice Safe transfer wrapper — đảm bảo transfer thành công.
     * @dev Sử dụng low-level call để tương thích cả token trả bool và không trả bool.
     *      Revert nếu call thất bại hoặc return false.
     *
     * @param token  Địa chỉ ERC20 token
     * @param to     Địa chỉ nhận
     * @param value  Số lượng token cần chuyển
     */
    function _safeTransfer(address token, address to, uint256 value) private {
        // Encode transfer(address,uint256) selector + params
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "LizSwapPair: TRANSFER_FAILED"
        );
    }

    /**
     * @notice Tính căn bậc hai (square root) theo thuật toán Babylonian method.
     * @dev [FR-01.3] Dùng trong hàm mint() lần đầu để tính initial liquidity.
     *      Công thức: liquidity = sqrt(amount0 * amount1)
     *      Thuật toán Babylonian: lặp z = (z + y/z) / 2 cho đến khi hội tụ.
     *
     * @param y Giá trị cần tính căn
     * @return z Kết quả căn bậc hai (floor)
     */
    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
        // y == 0 → z = 0 (default)
    }

    /**
     * @notice Trả về giá trị nhỏ hơn trong hai số.
     * @dev [FR-02.4] Dùng trong mint() để tính liquidity proportional
     *      theo token có tỷ lệ thấp hơn (tránh LP inflation).
     *
     * @param x Giá trị thứ nhất
     * @param y Giá trị thứ hai
     * @return Giá trị nhỏ hơn
     */
    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x < y ? x : y;
    }
}
