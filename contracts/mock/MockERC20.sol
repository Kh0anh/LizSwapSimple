// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev [project-structure.md §1] MockERC20 Token cho môi trường Local / Testnet.
 * Contract này cung cấp public mint logic để cung cấp token giả lập (như MockUSDT, MockDAI)
 * phục vụ test giao thức AMM Swap và Liquidity.
 */
contract MockERC20 is ERC20 {
    /**
     * @dev Constructor khởi tạo token với số lượng ban đầu.
     * @param name Tên của token.
     * @param symbol Ký hiệu của token.
     * @param initialSupply Tổng cung ban đầu cấp cho deployer.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Public mint function cho deployer mint token tùy ý khi test.
     * @param to Địa chỉ nhận token.
     * @param amount Số lượng token cần mint.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
