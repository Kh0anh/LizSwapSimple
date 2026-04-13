// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// ILizSwapERC20.sol — Task 2.1: Contract Interfaces
// Giải quyết: C4-Component (SC boundary), [FR-02.4] (LP Token)
// Giao diện chuẩn ERC20 dùng cho LP Token phát hành bởi LizSwapPair.
// ============================================================================

interface ILizSwapERC20 {
    // -------------------------------------------------------------------------
    // Events ERC20 chuẩn
    // -------------------------------------------------------------------------

    /// @notice Phát ra khi token được chuyển (kể cả mint và burn)
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @notice Phát ra khi allowance được cập nhật qua approve() [UC-02]
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /// @notice Tổng nguồn cung LP Token đang lưu hành
    function totalSupply() external view returns (uint256);

    /// @notice Số dư LP Token của một địa chỉ
    /// @param owner Địa chỉ cần truy vấn
    function balanceOf(address owner) external view returns (uint256);

    /// @notice Hạn mức chi tiêu mà owner cho phép spender sử dụng [UC-02]
    /// @param owner  Chủ sở hữu token
    /// @param spender  Địa chỉ được uỷ quyền chi tiêu
    function allowance(address owner, address spender) external view returns (uint256);

    // -------------------------------------------------------------------------
    // Mutating functions
    // -------------------------------------------------------------------------

    /// @notice Chuyển token tới địa chỉ khác
    /// @param to     Địa chỉ nhận
    /// @param value  Số lượng token
    function transfer(address to, uint256 value) external returns (bool);

    /// @notice Cấp phép (approve) cho spender chi tiêu đến `value` token [UC-02]
    /// @param spender  Địa chỉ được uỷ quyền
    /// @param value    Hạn mức tối đa
    function approve(address spender, uint256 value) external returns (bool);

    /// @notice Chuyển token thay mặt `from` (yêu cầu allowance đủ) [UC-02]
    /// @param from   Địa chỉ nguồn
    /// @param to     Địa chỉ đích
    /// @param value  Số lượng token
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    // -------------------------------------------------------------------------
    // EIP-2612 Permit (tuỳ chọn — cho phép approve bằng chữ ký off-chain)
    // -------------------------------------------------------------------------

    /// @notice Domain Separator dùng cho EIP-712 signature
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    /// @notice TypeHash của Permit message dùng trong EIP-2612
    function PERMIT_TYPEHASH() external pure returns (bytes32);

    /// @notice Nonce hiện tại của một tài khoản (ngăn replay attack)
    /// @param owner Địa chỉ cần truy vấn
    function nonces(address owner) external view returns (uint256);

    /// @notice Cấp phép (approve) bằng chữ ký EIP-712 thay vì on-chain tx [UC-02]
    /// @param owner     Chủ sở hữu token
    /// @param spender   Địa chỉ được uỷ quyền
    /// @param value     Hạn mức
    /// @param deadline  Thời hạn hết hạn chữ ký (block.timestamp)
    /// @param v         Phần v của chữ ký
    /// @param r         Phần r của chữ ký
    /// @param s         Phần s của chữ ký
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
