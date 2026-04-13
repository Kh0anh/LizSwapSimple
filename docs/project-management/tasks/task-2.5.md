# Task 2.5: Math Libraries

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[FR-01.3]` (Công thức tính toán), project-structure.md §1
- **Task phụ thuộc:** Task 2.3, Task 2.4
- **Đường dẫn File:** `contracts/periphery/libraries/LizSwapLibrary.sol`, `contracts/periphery/libraries/Math.sol`

## Mô tả chi tiết công việc

1. **`Math.sol`**:
   - `function min(uint x, uint y) internal pure returns (uint)`.
   - `function sqrt(uint y) internal pure returns (uint z)` — Babylonian method.
2. **`LizSwapLibrary.sol`**:
   - `function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1)`.
   - `function pairFor(address factory, address tokenA, address tokenB) internal view returns (address pair)` — gọi `ILizSwapFactory(factory).getPair()`.
   - `function getReserves(address factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB)` — gọi Pair.getReserves(), sắp xếp đúng thứ tự.
   - `function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB)` — `amountB = amountA * reserveB / reserveA` — phục vụ `[FR-02.2]`.
   - `function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut)` — Công thức AMM có tính phí 0.3%: `amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)` — phục vụ `[FR-01.3]`.
   - `function getAmountsOut(address factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts)` — tính output multi-hop — phục vụ `[FR-01.4]`.

## Đầu ra mong muốn

Library cho Router gọi, tính toán Swap/Quote/Reserve chính xác theo Constant Product Formula.
