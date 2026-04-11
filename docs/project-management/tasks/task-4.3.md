# Task 4.3: Pool Page — Add Liquidity Form

- **Người đảm nhận:** **Huy**
- **Mã Yêu cầu:** `[UC-02]`, `[UC-04]`, `[FR-02]` (tất cả sub-items), C4-Component (Page Pool)
- **Task phụ thuộc:** Task 3.5, Task 4.1
- **Đường dẫn File:** `src/app/pool/page.tsx` (phần Add Liquidity)

## Mô tả chi tiết công việc

1. **Layout:** Card `max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6`.
2. **Tab navigation:** Hai tab "Thêm Thanh Khoản" / "Rút Thanh Khoản" — dùng state local hoặc shadcn `<Tabs>`.
3. **Add Liquidity Form `[FR-02]`:**
   - **Token A:**
     - `<TokenSelector>` chọn token — `[FR-02.1]`.
     - `<Input>` nhập số lượng tokenA.
     - Hiển thị balance.
   - **Dấu "+"** giữa hai token fields.
   - **Token B:**
     - `<TokenSelector>` — `[FR-02.1]`.
     - `<Input>` — **tự động tính** số lượng tokenB khi user nhập tokenA amount — `[FR-02.2]`:
       - Gọi `swapService.getReserves()` rồi `swapService.quote(amountA, reserveA, reserveB)`.
       - Nếu Pool chưa tồn tại (reserve = 0) → user tự nhập cả hai → tạo Pool mới, hiển thị thông báo "Bạn đang tạo Pool mới!".
   - **Thông tin Pool:**
     - Tỷ giá hiện tại: `"1 mUSDT = X mDAI"`.
     - Share of Pool ước tính: `"Phần chia: ~2.5%"`.
4. **Add Liquidity Button:**
   - Logic approve tuần tự: Check allowance tokenA → approve nếu cần — `[FR-02.3]` → check allowance tokenB → approve nếu cần.
   - Gọi `swapService.addLiquidity(signer, tokenA, tokenB, amountA, amountB, amountAMin, amountBMin, account, deadline)` — `[FR-02.4]`.
   - Styling giống Swap button (gradient, hover effects).
   - Loading state với spinner — `frontend-design.md §4`.
5. **Post-TX:** Toast success + refresh balance + hiển thị LP Token received.

## Đầu ra mong muốn

Form Add Liquidity hoàn chỉnh, auto-quote tokenB, approve flow, gọi addLiquidity, toast feedback.
