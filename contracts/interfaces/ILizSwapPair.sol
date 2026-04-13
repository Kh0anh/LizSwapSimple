// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ILizSwapERC20.sol";

// ============================================================================
// ILizSwapPair.sol — Task 2.1: Contract Interfaces
// Giải quyết: C4-Component (Pair/Pool boundary)
//   [UC-03] Swap, [UC-04] Add Liquidity, [UC-05] Remove Liquidity
//   [FR-01.3] Công thức x*y=k, [FR-02.4] Mint LP Token, [FR-03.2] Burn LP Token
// Interface lõi AMM Pool, kế thừa ERC20 chuẩn để phát hành LP Token.
// ============================================================================

interface ILizSwapPair is ILizSwapERC20 {
    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Phát ra khi LP Token được mint (Add Liquidity thành công) [UC-04]
    /// @param sender   Địa chỉ gọi hàm mint (thường là Router)
    /// @param amount0  Số lượng token0 đã nạp vào Pool
    /// @param amount1  Số lượng token1 đã nạp vào Pool
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);

    /// @notice Phát ra khi LP Token được burn (Remove Liquidity thành công) [UC-05]
    /// @param sender   Địa chỉ gọi hàm burn (thường là Router)
    /// @param amount0  Số lượng token0 rút về
    /// @param amount1  Số lượng token1 rút về
    /// @param to       Địa chỉ nhận token sau khi rút
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);

    /// @notice Phát ra khi Swap được thực hiện thành công [UC-03]
    /// @param sender      Địa chỉ khởi tạo swap (thường là Router)
    /// @param amount0In   Số lượng token0 đưa vào Pool
    /// @param amount1In   Số lượng token1 đưa vào Pool
    /// @param amount0Out  Số lượng token0 Pool trả ra
    /// @param amount1Out  Số lượng token1 Pool trả ra
    /// @param to          Địa chỉ nhận token đầu ra
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );

    /// @notice Phát ra sau mỗi lần reserve được đồng bộ hoặc thay đổi
    /// @param reserve0  Reserve mới của token0
    /// @param reserve1  Reserve mới của token1
    event Sync(uint112 reserve0, uint112 reserve1);

    // -------------------------------------------------------------------------
    // View functions — Metadata
    // -------------------------------------------------------------------------

    /// @notice Địa chỉ Factory đã deploy Pool này
    function factory() external view returns (address);

    /// @notice Địa chỉ token0 (sort nhỏ hơn trong cặp)
    function token0() external view returns (address);

    /// @notice Địa chỉ token1 (sort lớn hơn trong cặp)
    function token1() external view returns (address);

    // -------------------------------------------------------------------------
    // View functions — AMM State [FR-01.3]
    // -------------------------------------------------------------------------

    /// @notice Đọc reserve hiện tại của cả hai token trong Pool
    /// @dev    Sử dụng để tính toán quote và getAmountOut theo công thức x*y=k [FR-01.3]
    /// @return reserve0           Reserve token0 (uint112 để tiết kiệm storage)
    /// @return reserve1           Reserve token1 (uint112)
    /// @return blockTimestampLast Block timestamp lần cập nhật reserve gần nhất
    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    // -------------------------------------------------------------------------
    // Mutating functions — Core AMM
    // -------------------------------------------------------------------------

    /// @notice Mint LP Token cho người cung cấp thanh khoản [UC-04] [FR-02.4]
    /// @dev    Caller (Router) phải chuyển token vào Pool trước khi gọi hàm này
    /// @param to  Địa chỉ nhận LP Token
    /// @return liquidity Số lượng LP Token được mint
    function mint(address to) external returns (uint256 liquidity);

    /// @notice Burn LP Token để rút thanh khoản về [UC-05] [FR-03.2]
    /// @dev    Caller (Router) phải chuyển LP Token vào Pool trước khi gọi
    /// @param to  Địa chỉ nhận token A và token B sau khi burn
    /// @return amount0 Số lượng token0 trả về
    /// @return amount1 Số lượng token1 trả về
    function burn(address to) external returns (uint256 amount0, uint256 amount1);

    /// @notice Thực hiện hoán đổi token theo công thức x*y=k [UC-03] [FR-01.3]
    /// @dev    Chính xác một trong hai (amount0Out, amount1Out) phải > 0
    ///         Caller phải đảm bảo invariant x*y=k vẫn thoả sau swap (tính phí 0.3%)
    /// @param amount0Out  Số lượng token0 muốn nhận ra
    /// @param amount1Out  Số lượng token1 muốn nhận ra
    /// @param to          Địa chỉ nhận token đầu ra
    /// @param data        Dữ liệu tuỳ chọn cho flash swap callback (truyền rỗng nếu không dùng)
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external;

    /// @notice Đồng bộ reserve với số dư token thực tế trong contract
    /// @dev    Hữu ích khi ai đó gửi token trực tiếp vào Pool (không qua Router)
    function sync() external;
}
