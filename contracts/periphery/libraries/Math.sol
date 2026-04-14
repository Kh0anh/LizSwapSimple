// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// Math.sol — Task 2.5: Math Libraries
// Giải quyết:
//   [FR-01.3] Công thức tính toán AMM — hàm sqrt dùng trong Pool khởi tạo
//   project-structure.md §1 — contracts/periphery/libraries/
//
// Thư viện math nội bộ cung cấp các phép tính toán số học an toàn
// cho toàn hệ sinh thái LizSwapSimple.
// Solidity ^0.8.20: overflow/underflow mặc định revert (no SafeMath needed).
// ============================================================================

/**
 * @title Math
 * @notice Thư viện các hàm toán học nội bộ dùng trong hệ sinh thái LizSwap.
 *
 * @dev Cung cấp hai hàm tiện ích cốt lõi:
 *      1. min(x, y)  — Trả về giá trị nhỏ hơn giữa hai uint256
 *      2. sqrt(y)    — Tính căn bậc hai theo thuật toán Babylonian method
 *
 *      Thư viện này được LizSwapLibrary sử dụng nội bộ và có thể
 *      được tái sử dụng bởi bất kỳ contract nào trong hệ sinh thái.
 *
 *      Khác với Uniswap V2 gốc (code bằng tay inline):
 *      - Tồn tại như một library Solidity riêng biệt để tái sử dụng rõ ràng
 *      - Solidity ^0.8.20 không cần SafeMath (overflow tự revert)
 */
library Math {
    // =========================================================================
    // Hàm min — Trả về giá trị nhỏ hơn
    // =========================================================================

    /**
     * @notice Trả về giá trị nhỏ hơn trong hai số nguyên không âm.
     * @dev [FR-02.4] Dùng trong LizSwapPair.mint() để tính proportional
     *      liquidity theo token có tỷ lệ thấp hơn:
     *        liquidity = min(amount0 * totalSupply / reserve0,
     *                        amount1 * totalSupply / reserve1)
     *
     *      Hàm thuần túy (pure) — không truy cập state, không side effect.
     *
     * @param x Số nguyên thứ nhất
     * @param y Số nguyên thứ hai
     * @return Giá trị nhỏ hơn giữa x và y
     */
    function min(uint256 x, uint256 y) internal pure returns (uint256) {
        return x < y ? x : y;
    }

    // =========================================================================
    // Hàm sqrt — Căn bậc hai (Babylonian Method)
    // =========================================================================

    /**
     * @notice Tính căn bậc hai (floor) của một số nguyên không âm.
     * @dev [FR-01.3] Dùng trong LizSwapPair.mint() lần đầu tiên để
     *      xác định initial liquidity (LP Token phát hành ban đầu):
     *        liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
     *
     *      Thuật toán: Babylonian Method (Newton's Method for square root)
     *      Khởi đầu z = y (ước tính ban đầu)
     *      Lặp:  x = (y / z + z) / 2
     *            nếu x < z: z = x, tiếp tục
     *            ngược lại: dừng, z là kết quả
     *
     *      Trường hợp đặc biệt:
     *        y = 0 → z = 0  (uint default)
     *        y = 1,2,3 → z = 1
     *        y >= 4 → chạy vòng lặp Babylonian
     *
     *      Hàm thuần túy (pure) — không truy cập state, không side effect.
     *      Gas cost: O(log n) — rất hiệu quả trên EVM.
     *
     * @param y Giá trị cần tính căn bậc hai (uint256)
     * @return z Kết quả căn bậc hai (floor, tức bỏ phần thập phân)
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            // Bắt đầu ước tính từ y (upper bound)
            z = y;
            // x là ước tính tiếp theo: x = (y/z + z) / 2
            uint256 x = y / 2 + 1;
            // Tiếp tục hội tụ cho đến khi x >= z (đã đạt floor sqrt)
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            // y ∈ {1, 2, 3} → sqrt floor = 1
            z = 1;
        }
        // y == 0 → z = 0 (uint256 default value)
    }
}
