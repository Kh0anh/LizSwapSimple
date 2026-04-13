// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// ILizSwapFactory.sol — Task 2.1: Contract Interfaces
// Giải quyết: C4-Component (Factory boundary)
// Interface quản lý registry toàn bộ Pair Pool trong hệ sinh thái LizSwap.
// ============================================================================

interface ILizSwapFactory {
    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Phát ra khi một Pair Pool mới được tạo
    /// @param token0     Địa chỉ token đầu tiên (được sort theo địa chỉ)
    /// @param token1     Địa chỉ token thứ hai (được sort theo địa chỉ)
    /// @param pair       Địa chỉ contract Pair vừa được deploy
    /// @param pairIndex  Chỉ số thứ tự theo mảng allPairs (index 0-based + 1)
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256 pairIndex
    );

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /// @notice Truy vấn địa chỉ Pool của một cặp token
    /// @dev    Trả về address(0) nếu chưa tồn tại Pool
    /// @param tokenA Địa chỉ token A (thứ tự không quan trọng)
    /// @param tokenB Địa chỉ token B (thứ tự không quan trọng)
    /// @return pair  Địa chỉ contract LizSwapPair tương ứng
    function getPair(address tokenA, address tokenB) external view returns (address pair);

    /// @notice Truy vấn địa chỉ Pair theo chỉ số trong mảng allPairs
    /// @param index Chỉ số 0-based trong mảng allPairs
    /// @return pair Địa chỉ contract LizSwapPair
    function allPairs(uint256 index) external view returns (address pair);

    /// @notice Tổng số Pair Pool đã được tạo
    /// @return Số lượng Pool hiện có trong hệ thống
    function allPairsLength() external view returns (uint256);

    // -------------------------------------------------------------------------
    // Mutating functions
    // -------------------------------------------------------------------------

    /// @notice Tạo mới một Pair Pool cho cặp tokenA/tokenB
    /// @dev    Revert nếu Pool đã tồn tại hoặc tokenA == tokenB
    ///         Phát sự kiện PairCreated sau khi deploy thành công
    /// @param tokenA Địa chỉ token A
    /// @param tokenB Địa chỉ token B
    /// @return pair  Địa chỉ contract LizSwapPair vừa được tạo
    function createPair(address tokenA, address tokenB) external returns (address pair);
}
