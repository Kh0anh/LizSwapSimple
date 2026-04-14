// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// MockERC20.sol — Token giả lập cho testing
// Cung cấp public mint() để deployer tạo token test trên Local/Testnet.
// (Phiên bản tạm cho test Task 2.4 — Task 2.7 sẽ hoàn thiện đầy đủ)
// ============================================================================

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {}

    /// @notice Public mint cho testing — ai cũng có thể mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
