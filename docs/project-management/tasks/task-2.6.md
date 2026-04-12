# Task 2.6: LizSwapRouter.sol (Periphery)

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[UC-03]`, `[UC-04]`, `[UC-05]`, `[FR-01.5]`, `[FR-02.4]`, `[FR-03.2]`, C3 - Router
- **Task phụ thuộc:** Task 2.4, Task 2.5
- **Đường dẫn File:** `contracts/periphery/LizSwapRouter.sol`

## Mô tả chi tiết công việc

Router là **entry point duy nhất** mà Frontend gọi vào. Mọi service trong `src/services/` sẽ interact trực tiếp với contract này.

1. **State Variables:**
   - `address public immutable factory`
   - `address public immutable WETH` (cho tương lai, hiện tại token-to-token)
2. **Modifier:**
   - `modifier ensure(uint deadline) { require(deadline >= block.timestamp, 'LizSwapRouter: EXPIRED'); _; }` — kiểm tra deadline transaction.
3. **Functions — Add Liquidity `[UC-04, FR-02]`:**
   - `function _addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin) internal returns (uint amountA, uint amountB)`:
     - Nếu chưa có Pair → gọi `factory.createPair(tokenA, tokenB)`.
     - Nếu reserve = 0 → trả amountDesired.
     - Nếu có reserve → tính `amountBOptimal = quote(amountADesired, reserveA, reserveB)`, kiểm tra `>= amountBMin`. Hoặc ngược lại.
   - `function addLiquidity(...) external ensure(deadline) returns (uint amountA, uint amountB, uint liquidity)`:
     - Gọi `_addLiquidity()`.
     - `TransferFrom` hai token từ `msg.sender` vào Pair.
     - Gọi `pair.mint(to)` → nhận LP Token — `[FR-02.4]`.
4. **Functions — Remove Liquidity `[UC-05, FR-03]`:**
   - `function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external ensure(deadline) returns (uint amountA, uint amountB)`:
     - Transfer LP Token từ user vào Pair contract.
     - Gọi `pair.burn(to)` — `[FR-03.2]`.
     - Kiểm tra amounts >= amountMin (slippage).
5. **Functions — Swap `[UC-03, FR-01]`:**
   - `function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external ensure(deadline) returns (uint[] memory amounts)`:
     - Gọi `LizSwapLibrary.getAmountsOut(factory, amountIn, path)` — tính output dự kiến — `[FR-01.3]`.
     - Validate `amounts[amounts.length - 1] >= amountOutMin` — `[FR-01.4]` slippage check.
     - `TransferFrom` tokenIn từ sender vào first Pair.
     - Gọi `_swap()` internal loop qua path — `[FR-01.5]`.
   - `function _swap(uint[] memory amounts, address[] memory path, address _to) internal` — Execute swap chain.
6. **View Functions:**
   - `function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure returns (uint)` — proxy `LizSwapLibrary.getAmountOut()`.
   - `function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory)`.
   - `function quote(uint amountA, uint reserveA, uint reserveB) public pure returns (uint)`.

## Đầu ra mong muốn

Router biên dịch thành công, cung cấp đầy đủ hàm addLiquidity, removeLiquidity, swapExactTokensForTokens, và các hàm view.
