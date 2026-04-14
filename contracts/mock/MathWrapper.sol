// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// MathWrapper.sol — Test helper để expose internal functions của Math.sol
// Vì Math là library internal-only, cần wrapper contract để test từ TypeScript.
// ============================================================================

import "../../contracts/periphery/libraries/Math.sol";

contract MathWrapper {
    function min(uint256 x, uint256 y) external pure returns (uint256) {
        return Math.min(x, y);
    }

    function sqrt(uint256 y) external pure returns (uint256) {
        return Math.sqrt(y);
    }
}
