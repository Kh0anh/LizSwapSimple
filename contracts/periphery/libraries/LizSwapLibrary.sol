// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// LizSwapLibrary.sol — Task 2.5: Math Libraries
// Giải quyết:
//   [FR-01.3] Công thức tính toán AMM có phí 0.3% (getAmountOut)
//   [FR-01.4] Tính output multi-hop (getAmountsOut) — phục vụ Price Impact
//   [FR-02.2] Auto-quote số lượng Token B theo tỷ giá Pool (quote)
//   project-structure.md §1 — contracts/periphery/libraries/
//
// Thư viện ngoại vi cung cấp các hàm tính toán phức hợp cho Router,
// bao gồm: sortTokens, pairFor, getReserves, quote, getAmountOut,
// getAmountsOut. Router sẽ import và gọi trực tiếp thư viện này.
// ============================================================================

import "../../interfaces/ILizSwapFactory.sol";
import "../../interfaces/ILizSwapPair.sol";
import "./Math.sol";

/**
 * @title LizSwapLibrary
 * @notice Thư viện tính toán phụ trợ cho LizSwapRouter.
 *         Cung cấp các hàm tiện ích để tính toán quote, output amount,
 *         và tra cứu reserves từ Factory/Pair contract.
 *
 * @dev Tất cả hàm đều là `internal` — chỉ được gọi nội bộ từ Router.
 *      Không deploy riêng (Solidity library không có address riêng).
 *
 *      Các hàm được phân loại:
 *      ┌─────────────────────────────────────────────────────────────┐
 *      │ Pure functions (không truy cập state)                       │
 *      │   sortTokens  — sắp xếp token theo địa chỉ                 │
 *      │   quote        — tính amountB theo tỷ giá Pool hiện tại     │
 *      │   getAmountOut — tính output với phí 0.3% (x*y=k formula)  │
 *      ├─────────────────────────────────────────────────────────────┤
 *      │ View functions (đọc state từ contract bên ngoài)            │
 *      │   pairFor      — lấy địa chỉ Pair từ Factory               │
 *      │   getReserves  — lấy reserves đã sort theo input order      │
 *      │   getAmountsOut — tính output cho multi-hop path            │
 *      └─────────────────────────────────────────────────────────────┘
 *
 *      Khác với Uniswap V2 gốc (dùng CREATE2 để tính pairFor offline):
 *      - pairFor() gọi trực tiếp ILizSwapFactory.getPair() (đơn giản hơn,
 *        phù hợp mục tiêu học thuật, không cần tính init code hash)
 */
library LizSwapLibrary {
    // =========================================================================
    // Hàm sortTokens — Sắp xếp cặp token theo canonical order
    // =========================================================================

    /**
     * @notice Sắp xếp hai địa chỉ token theo thứ tự tăng dần (canonical order).
     * @dev Uniswap V2 quy ước: token0 < token1 khi so sánh địa chỉ dạng uint160.
     *      Canonical order này đảm bảo một cặp (A, B) và (B, A) luôn map
     *      tới cùng một Pair contract — tránh tạo duplicate pools.
     *
     *      Validation: tokenA != tokenB (không thể tạo pool với cùng token)
     *                  Cả hai address != address(0)
     *
     * @param tokenA Địa chỉ token A (thứ tự bất kỳ)
     * @param tokenB Địa chỉ token B (thứ tự bất kỳ)
     * @return token0 Địa chỉ nhỏ hơn (sort đầu tiên)
     * @return token1 Địa chỉ lớn hơn (sort thứ hai)
     */
    function sortTokens(
        address tokenA,
        address tokenB
    ) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "LizSwapLibrary: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "LizSwapLibrary: ZERO_ADDRESS");
    }

    // =========================================================================
    // Hàm pairFor — Tra cứu địa chỉ Pair từ Factory
    // =========================================================================

    /**
     * @notice Lấy địa chỉ Pair contract từ Factory registry.
     * @dev [C4-Component - Router: "Lấy địa chỉ Pool (getPair)"]
     *      Gọi ILizSwapFactory.getPair() thay vì tính offline bằng CREATE2
     *      (phù hợp cho dự án học thuật — đơn giản hơn, dễ hiểu hơn).
     *
     *      Revert nếu chưa tồn tại Pool cho cặp token này.
     *
     * @param factory Địa chỉ LizSwapFactory contract
     * @param tokenA  Địa chỉ token A (thứ tự bất kỳ)
     * @param tokenB  Địa chỉ token B (thứ tự bất kỳ)
     * @return pair   Địa chỉ LizSwapPair contract tương ứng
     */
    function pairFor(
        address factory,
        address tokenA,
        address tokenB
    ) internal view returns (address pair) {
        pair = ILizSwapFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "LizSwapLibrary: PAIR_NOT_EXISTS");
    }

    // =========================================================================
    // Hàm getReserves — Lấy reserves đã sort đúng thứ tự input
    // =========================================================================

    /**
     * @notice Lấy reserves của Pool và sắp xếp theo thứ tự tokenA/tokenB.
     * @dev [FR-01.3] Đảm bảo reserveA luôn tương ứng với tokenA (dù thứ tự
     *      trong Pool có thể là token0/token1 khác với input).
     *
     *      Quy trình:
     *      1. sortTokens() → xác định token0 (canonical)
     *      2. Gọi ILizSwapPair.getReserves() → lấy reserve0, reserve1
     *      3. Nếu tokenA == token0: reserveA = reserve0, reserveB = reserve1
     *         Ngược lại:            reserveA = reserve1, reserveB = reserve0
     *
     *      Validation: Pool phải tồn tại (pairFor) và đã có thanh khoản.
     *
     * @param factory Địa chỉ LizSwapFactory contract
     * @param tokenA  Địa chỉ token A (thứ tự bất kỳ — caller xác định)
     * @param tokenB  Địa chỉ token B
     * @return reserveA Reserve của tokenA trong Pool
     * @return reserveB Reserve của tokenB trong Pool
     */
    function getReserves(
        address factory,
        address tokenA,
        address tokenB
    ) internal view returns (uint256 reserveA, uint256 reserveB) {
        // Xác định token0 để biết thứ tự reserve trong Pair
        (address token0, ) = sortTokens(tokenA, tokenB);

        // Lấy địa chỉ Pair và đọc reserves
        address pair = pairFor(factory, tokenA, tokenB);
        (uint112 reserve0, uint112 reserve1, ) = ILizSwapPair(pair).getReserves();

        // Map về đúng thứ tự tokenA/tokenB (không phải token0/token1)
        (reserveA, reserveB) = tokenA == token0
            ? (uint256(reserve0), uint256(reserve1))
            : (uint256(reserve1), uint256(reserve0));

        // Validate Pool đã có thanh khoản
        require(
            reserveA > 0 && reserveB > 0,
            "LizSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
    }

    // =========================================================================
    // Hàm quote — Tính amountB proportional theo reserves
    // =========================================================================

    /**
     * @notice Tính số lượng tokenB tương đương với amountA theo tỷ giá Pool hiện tại.
     * @dev [FR-02.2] Dùng khi thêm thanh khoản: người dùng nhập amountA,
     *      hệ thống tự động tính amountB cần nạp proportional.
     *
     *      Công thức: amountB = amountA * reserveB / reserveA
     *
     *      Đây là tính toán KHÔNG có phí (pure ratio) — chỉ dùng để quote,
     *      không dùng để tính output của swap.
     *
     *      Validation:
     *        amountA > 0  (phải có lượng đầu vào)
     *        reserveA > 0 và reserveB > 0 (Pool phải có thanh khoản)
     *
     * @param amountA  Số lượng tokenA muốn cung cấp
     * @param reserveA Reserve của tokenA hiện có trong Pool
     * @param reserveB Reserve của tokenB hiện có trong Pool
     * @return amountB Số lượng tokenB tương đương cần cung cấp thêm
     */
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (uint256 amountB) {
        require(amountA > 0, "LizSwapLibrary: INSUFFICIENT_AMOUNT");
        require(
            reserveA > 0 && reserveB > 0,
            "LizSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
        // amountB = amountA * reserveB / reserveA (tỷ lệ giá hiện tại trong Pool)
        amountB = (amountA * reserveB) / reserveA;
    }

    // =========================================================================
    // Hàm getAmountOut — Tính output theo công thức x*y=k có phí 0.3%
    // =========================================================================

    /**
     * @notice Tính số lượng token đầu ra khi swap, có tính phí 0.3%.
     * @dev [FR-01.3] Công thức Constant Product Formula với fee:
     *
     *      Gọi:
     *        amountInWithFee = amountIn * 997           (sau phí 0.3%)
     *        numerator       = amountInWithFee * reserveOut
     *        denominator     = reserveIn * 1000 + amountInWithFee
     *        amountOut       = numerator / denominator
     *
     *      Phí 0.3% = 0.3/100 = 3/1000
     *      Vì Solidity không có float: nhân 1000 để tránh decimal:
     *        - amountIn hiệu quả = amountIn * 997 / 1000 (sau phí)
     *        - Đảm bảo invariant: (reserveIn + amountIn*997/1000) *
     *                              (reserveOut - amountOut) >= reserveIn * reserveOut
     *
     *      Phí 0.3% tự động tích luỹ trong Pool
     *      (không rút ra — LP holders hưởng lợi khi reserves tăng).
     *
     *      Validation:
     *        amountIn > 0
     *        reserveIn > 0 và reserveOut > 0
     *
     * @param amountIn  Số lượng token đầu vào (trước phí)
     * @param reserveIn Reserve của token đầu vào trong Pool
     * @param reserveOut Reserve của token đầu ra trong Pool
     * @return amountOut Số lượng token đầu ra (sau phí 0.3%)
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "LizSwapLibrary: INSUFFICIENT_INPUT_AMOUNT");
        require(
            reserveIn > 0 && reserveOut > 0,
            "LizSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );

        // Áp dụng phí 0.3%: amountIn hiệu quả = amountIn * 997
        uint256 amountInWithFee = amountIn * 997;

        // numerator = amountInWithFee * reserveOut
        uint256 numerator = amountInWithFee * reserveOut;

        // denominator = reserveIn * 1000 + amountInWithFee
        // (reserveIn * 1000 đại diện cho "base" không có phí)
        uint256 denominator = reserveIn * 1000 + amountInWithFee;

        // amountOut = floor(numerator / denominator)
        amountOut = numerator / denominator;
    }

    // =========================================================================
    // Hàm getAmountsOut — Tính output cho multi-hop path
    // =========================================================================

    /**
     * @notice Tính mảng output amounts cho chuỗi hoán đổi multi-hop.
     * @dev [FR-01.4] Phục vụ hiển thị Price Impact và Minimum Received trên UI.
     *      Router dùng hàm này để tính lượng token nhận được ở từng bước.
     *
     *      Ví dụ path 2-hop: [TokenA, TokenB, TokenC]
     *        amounts[0] = amountIn (TokenA input)
     *        amounts[1] = getAmountOut(amountIn, reserveA_B, reserveB_A) → TokenB
     *        amounts[2] = getAmountOut(amounts[1], reserveB_C, reserveC_B) → TokenC
     *
     *      Mỗi bước áp dụng phí 0.3% (qua getAmountOut).
     *      Path phải có ít nhất 2 địa chỉ (1 hop tối thiểu).
     *
     *      Validation:
     *        path.length >= 2  (ít nhất 1 cặp token)
     *        amountIn > 0      (phải có lượng đầu vào)
     *
     * @param factory  Địa chỉ LizSwapFactory contract
     * @param amountIn Số lượng token đầu vào (path[0])
     * @param path     Mảng địa chỉ token định tuyến (path[0] → ... → path[n])
     * @return amounts Mảng amounts tại mỗi bước: amounts[0] = input, amounts[n] = final output
     */
    function getAmountsOut(
        address factory,
        uint256 amountIn,
        address[] memory path
    ) internal view returns (uint256[] memory amounts) {
        require(path.length >= 2, "LizSwapLibrary: INVALID_PATH");

        // Khởi tạo mảng kết quả với độ dài bằng path
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        // Duyệt qua từng hop trong path
        for (uint256 i = 0; i < path.length - 1; i++) {
            // Lấy reserves cho cặp token tại hop hiện tại
            (uint256 reserveIn, uint256 reserveOut) = getReserves(
                factory,
                path[i],       // token đầu vào hop i
                path[i + 1]    // token đầu ra hop i
            );
            // Tính output của hop này → input của hop tiếp theo
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }
}
