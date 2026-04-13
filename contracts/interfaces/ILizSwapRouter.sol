// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// ILizSwapRouter.sol — Task 2.1: Contract Interfaces
// Giải quyết: C4-Component (Router boundary — lớp ngoại vi)
//   [UC-03] Swap, [UC-04] Add Liquidity, [UC-05] Remove Liquidity
//   [FR-01.3] Tính toán AmountOut (x*y=k), [FR-01.4] getAmountsOut (Price Impact)
//   [FR-01.5] swapExactTokensForTokens, [FR-02.2] quote, [FR-02.4] addLiquidity
//   [FR-03.2] removeLiquidity
// Router là điểm vào duy nhất của người dùng và Frontend [UC-03..05].
// ============================================================================

interface ILizSwapRouter {
    // -------------------------------------------------------------------------
    // View functions — Metadata
    // -------------------------------------------------------------------------

    /// @notice Địa chỉ Factory đã deploy hệ thống này
    function factory() external view returns (address);

    /// @notice Địa chỉ Wrapped Native Token (WBNB trên BSC)
    /// @dev    Dự án MVP không hỗ trợ swap native BNB trực tiếp nhưng giữ
    ///         field này để compatible với chuẩn Uniswap V2 Router interface
    function WETH() external view returns (address);

    // -------------------------------------------------------------------------
    // Pure / View functions — Tính toán AMM [FR-01.3] [FR-01.4] [FR-02.2]
    // -------------------------------------------------------------------------

    /// @notice Tính lượng tokenB tương đương với lượng tokenA theo tỷ giá Pool [FR-02.2]
    /// @dev    Công thức: amountB = amountA * reserveB / reserveA
    ///         Dùng khi người dùng nhập số lượng Token A để tự động điền Token B (Add Liquidity)
    /// @param amountA   Số lượng token A muốn cung cấp
    /// @param reserveA  Reserve hiện tại của token A trong Pool
    /// @param reserveB  Reserve hiện tại của token B trong Pool
    /// @return amountB  Số lượng token B tương đương cần cung cấp
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) external pure returns (uint256 amountB);

    /// @notice Tính số lượng token đầu ra sau phí 0.3% cho một swap cụ thể [FR-01.3]
    /// @dev    Công thức AMM có phí: amountOut = (amountIn * 997 * reserveOut) /
    ///                                            (reserveIn * 1000 + amountIn * 997)
    /// @param amountIn   Số lượng token đưa vào
    /// @param reserveIn  Reserve của token đưa vào
    /// @param reserveOut Reserve của token nhận ra
    /// @return amountOut Số lượng token nhận được sau phí
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure returns (uint256 amountOut);

    /// @notice Tính mảng số lượng token cho toàn bộ path swap [FR-01.4]
    /// @dev    Dùng để hiển thị Price Impact và Minimum Received trên UI
    /// @param amountIn Số lượng token đầu vào
    /// @param path     Mảng địa chỉ token theo thứ tự swap (e.g. [tokenA, tokenB])
    /// @return amounts Mảng số lượng token tại mỗi bước (amounts[0] = amountIn)
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);

    // -------------------------------------------------------------------------
    // Mutating functions — Liquidity Management [UC-04] [UC-05]
    // -------------------------------------------------------------------------

    /// @notice Thêm thanh khoản vào Pool tokenA/tokenB [UC-04] [FR-02.4]
    /// @dev    Tự động tạo Pool mới nếu chưa tồn tại (qua Factory.createPair)
    ///         Caller phải approve đủ allowance cho Router trước khi gọi [UC-02]
    ///         Revert nếu block.timestamp > deadline
    /// @param tokenA         Địa chỉ token A
    /// @param tokenB         Địa chỉ token B
    /// @param amountADesired Mong muốn nạp tối đa token A
    /// @param amountBDesired Mong muốn nạp tối đa token B
    /// @param amountAMin     Số lượng token A tối thiểu chấp nhận (chống slippage)
    /// @param amountBMin     Số lượng token B tối thiểu chấp nhận (chống slippage)
    /// @param to             Địa chỉ nhận LP Token
    /// @param deadline       Unix timestamp — revert nếu quá hạn
    /// @return amountA    Số lượng token A thực sự nạp vào
    /// @return amountB    Số lượng token B thực sự nạp vào
    /// @return liquidity  Số lượng LP Token được mint cho `to`
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    /// @notice Rút thanh khoản từ Pool tokenA/tokenB [UC-05] [FR-03.2]
    /// @dev    Caller phải approve LP Token cho Router trước khi gọi [UC-02] [FR-03.3]
    ///         Revert nếu block.timestamp > deadline
    /// @param tokenA     Địa chỉ token A
    /// @param tokenB     Địa chỉ token B
    /// @param liquidity  Số lượng LP Token muốn đốt (burn)
    /// @param amountAMin Số lượng token A tối thiểu nhận về (chống slippage)
    /// @param amountBMin Số lượng token B tối thiểu nhận về (chống slippage)
    /// @param to         Địa chỉ nhận token A và B sau khi rút
    /// @param deadline   Unix timestamp — revert nếu quá hạn
    /// @return amountA   Số lượng token A thực sự nhận về
    /// @return amountB   Số lượng token B thực sự nhận về
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    // -------------------------------------------------------------------------
    // Mutating functions — Swap [UC-03] [FR-01.5]
    // -------------------------------------------------------------------------

    /// @notice Swap chính xác số lượng token đầu vào, nhận tối thiểu amountOutMin [UC-03] [FR-01.5]
    /// @dev    Duyệt qua toàn bộ path, thực hiện swap theo từng bước
    ///         Caller phải approve token đầu tiên trong path cho Router [UC-02]
    ///         Revert nếu amountOut < amountOutMin (slippage protection) hoặc deadline hết hạn
    /// @param amountIn     Số lượng token đầu vào chính xác
    /// @param amountOutMin Số lượng token đầu ra tối thiểu chấp nhận
    /// @param path         Mảng địa chỉ token theo thứ tự swap (ít nhất 2 phần tử)
    /// @param to           Địa chỉ nhận token đầu ra cuối cùng
    /// @param deadline     Unix timestamp — revert nếu quá hạn
    /// @return amounts     Mảng số lượng token tại mỗi bước của path
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}
