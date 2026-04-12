# Task 2.9: Smart Contract Unit Tests

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** Toàn bộ UC, FR
- **Task phụ thuộc:** Task 2.6, Task 2.7
- **Đường dẫn File:** `test/LizSwapFactory.test.ts`, `test/LizSwapPair.test.ts`, `test/LizSwapRouter.test.ts`

## Mô tả chi tiết công việc

1. **`LizSwapFactory.test.ts`**:
   - Test `createPair()` tạo Pair mới, emit event `PairCreated`.
   - Test getPair() trả address đúng (cả hai chiều).
   - Test tạo trùng Pair → revert.
   - Test token giống nhau → revert.
2. **`LizSwapPair.test.ts`**:
   - Test `mint()` — Add Liquidity lần đầu → LP Token = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY. Verify `[FR-02.4]`.
   - Test `mint()` — Add Liquidity lần sau → LP proportional.
   - Test `burn()` — Remove Liquidity → nhận lại token0, token1 đúng tỷ lệ reserve. Verify `[FR-03.2]`.
   - Test `swap()` — Swap token → output đúng công thức `x*y=k` trừ phí 0.3%. Verify `[FR-01.3]`.
   - Test `swap()` — k invariant check (`require` failed khi balance sai).
   - Test `ReentrancyGuard` — gọi lại swap trong callback → revert.
3. **`LizSwapRouter.test.ts`**:
   - Test `addLiquidity()` luồng đầy đủ: approve → addLiquidity → user nhận LP Token. Verify `[UC-04]`.
   - Test `removeLiquidity()` luồng đầy đủ: approve LP → removeLiquidity → nhận token. Verify `[UC-05]`.
   - Test `swapExactTokensForTokens()`: approve → swap → user nhận token output đúng. Verify `[UC-03]`.
   - Test deadline expired → revert.
   - Test slippage: amountOutMin > actual → revert. Verify `[FR-01.4]`.

## Đầu ra mong muốn

`npm run test` — tất cả test **PASS**. Coverage >= 90% cho Router, Pair, Factory.
