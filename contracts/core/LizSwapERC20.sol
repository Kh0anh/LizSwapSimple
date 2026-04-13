// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// LizSwapERC20.sol — Task 2.2: LP Token Base Contract
// Giải quyết: [FR-02.4] Mint LP Token, C3 - Pair component, techstack.md §1
//
// Contract nền tảng đại diện cho LP Token (Liquidity Provider Token).
// Kế thừa chuẩn ERC20 từ OpenZeppelin để đáp ứng bảo mật (techstack.md §1).
// Khác biệt Uniswap V2 gốc: bản gốc tự code ERC20 thủ công; bản này dùng OZ.
//
// LizSwapPair sẽ kế thừa contract này và gọi _mint() / _burn() nội bộ khi:
//   - Người dùng Add Liquidity → _mint() [FR-02.4]
//   - Người dùng Remove Liquidity → _burn() [FR-03.2]
// ============================================================================

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title LizSwapERC20
 * @notice LP Token base contract cho hệ thống LizSwapSimple DEX.
 *
 * @dev Contract này là lớp nền (base class) chứa logic ERC20 chuẩn cho
 *      LP Token. LizSwapPair sẽ kế thừa contract này để phát hành và
 *      thu hồi LP Token khi người dùng cung cấp / rút thanh khoản.
 *
 *      Lý do kế thừa OpenZeppelin thay vì tự code (khác Uniswap V2 gốc):
 *      - Chuẩn bảo mật được kiểm toán (audited)
 *      - Tích hợp SafeMath mặc định từ Solidity ^0.8.20
 *      - Tuân thủ yêu cầu dự án tại techstack.md §1
 */
contract LizSwapERC20 is ERC20 {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @notice Khởi tạo LP Token với tên và ký hiệu theo tài liệu task-2.2.md
     * @dev Gọi constructor của ERC20 (OpenZeppelin) với:
     *      - name: "LizSwap LP Token"
     *      - symbol: "LIZ-LP"
     *
     *      Không mint token nào tại thời điểm deploy.
     *      Toàn bộ việc phát hành token được uỷ quyền cho LizSwapPair
     *      thông qua hàm _mint() nội bộ khi Add Liquidity [FR-02.4].
     */
    constructor() ERC20("LizSwap LP Token", "LIZ-LP") {}

    // -------------------------------------------------------------------------
    // Internal functions — cho LizSwapPair sử dụng
    // -------------------------------------------------------------------------

    /**
     * @notice Phát hành (mint) LP Token cho địa chỉ `to` khi thêm thanh khoản.
     * @dev Override internal từ OpenZeppelin ERC20._mint().
     *      Chỉ được gọi từ LizSwapPair khi người dùng Add Liquidity [UC-04].
     *      Cập nhật totalSupply và balanceOf[to], phát sự kiện Transfer.
     *
     *      [FR-02.4] Người dùng nhận LP Token đại diện cho phần đóng góp Pool.
     *
     * @param to     Địa chỉ nhận LP Token (thường là địa chỉ Liquidity Provider)
     * @param amount Số lượng LP Token cần phát hành (tính theo wei, 18 decimals)
     */
    function _mint(address to, uint256 amount) internal override {
        // [FR-02.4] Mint LP Token đại diện cho phần đóng góp thanh khoản
        super._mint(to, amount);
    }

    /**
     * @notice Thu hồi (burn) LP Token từ địa chỉ `from` khi rút thanh khoản.
     * @dev Override internal từ OpenZeppelin ERC20._burn().
     *      Chỉ được gọi từ LizSwapPair khi người dùng Remove Liquidity [UC-05].
     *      Giảm totalSupply và balanceOf[from], phát sự kiện Transfer về address(0).
     *
     *      [FR-03.2] Người dùng đổi LP Token lấy lại Token A và Token B theo tỷ lệ.
     *
     * @param from   Địa chỉ bị thu hồi LP Token (thường là địa chỉ Liquidity Provider)
     * @param amount Số lượng LP Token cần thu hồi (tính theo wei, 18 decimals)
     */
    function _burn(address from, uint256 amount) internal override {
        // [FR-03.2] Burn LP Token khi người dùng rút thanh khoản
        super._burn(from, amount);
    }
}
