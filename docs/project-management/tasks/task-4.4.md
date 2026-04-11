# Task 4.4: Pool Page — Remove Liquidity & LP Positions

- **Người đảm nhận:** **Huy**
- **Mã Yêu cầu:** `[UC-02]`, `[UC-05]`, `[FR-03]` (tất cả sub-items)
- **Task phụ thuộc:** Task 3.5, Task 4.3
- **Đường dẫn File:** `src/app/pool/page.tsx` (phần Remove Liquidity)

## Mô tả chi tiết công việc

1. **My Positions Section `[FR-03.1]`:**
   - Hiển thị danh sách Pools mà user đang hold LP Token.
   - Với mỗi Pool:
     - Pair name: `"mUSDT / mDAI"`.
     - LP Token balance: `font-mono`.
     - Your share: `(userLP / totalSupply) * 100`.
     - Pooled token0 amount, Pooled token1 amount (tính từ share * reserves).
   - Cách lấy data:
     - Duyệt `factory.allPairsLength()` → `factory.allPairs(i)` → lấy pair address → check `pair.balanceOf(userAddress)` > 0.
     - Hoặc đơn giản: chỉ hiển thị Pool đã biết từ `tokenList.json`.
2. **Remove Liquidity Form `[FR-03]`:**
   - **Input:** Slider hoặc Input nhập % LP muốn rút (25%, 50%, 75%, 100%, hoặc custom).
   - **Preview:** Hiển thị ước tính nhận được `amount0`, `amount1` — tính `(lpAmount * reserve0) / totalSupply`.
   - **Approve LP Token:** Cần approve LP Token cho Router — `[FR-03.3]` / `[UC-02]`.
   - **Remove Button:** Gọi `swapService.removeLiquidity(signer, tokenA, tokenB, lpAmount, amountAMin, amountBMin, account, deadline)` — `[FR-03.2]`.
   - Styling: Button `text-red-500 border-red-200 hover:bg-red-50` (semantic delete action) hoặc gradient.
3. **Post-TX:** Toast success, refresh positions list + balance.

## Đầu ra mong muốn

Hiển thị LP positions, form Remove Liquidity với preview amounts, approve LP → removeLiquidity call.
