// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// LizSwapLibraryWrapper.sol — Test helper để expose internal functions
// của LizSwapLibrary.sol.
// Vì LizSwapLibrary là library internal-only, cần wrapper contract để test.
// ============================================================================

import "../../contracts/periphery/libraries/LizSwapLibrary.sol";

contract LizSwapLibraryWrapper {
    function sortTokens(
        address tokenA,
        address tokenB
    ) external pure returns (address token0, address token1) {
        return LizSwapLibrary.sortTokens(tokenA, tokenB);
    }

    function pairFor(
        address factory,
        address tokenA,
        address tokenB
    ) external view returns (address pair) {
        return LizSwapLibrary.pairFor(factory, tokenA, tokenB);
    }

    function getReserves(
        address factory,
        address tokenA,
        address tokenB
    ) external view returns (uint256 reserveA, uint256 reserveB) {
        return LizSwapLibrary.getReserves(factory, tokenA, tokenB);
    }

    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) external pure returns (uint256 amountB) {
        return LizSwapLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure returns (uint256 amountOut) {
        return LizSwapLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountsOut(
        address factory,
        uint256 amountIn,
        address[] memory path
    ) external view returns (uint256[] memory amounts) {
        return LizSwapLibrary.getAmountsOut(factory, amountIn, path);
    }
}
