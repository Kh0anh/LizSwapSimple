# Task 4.2: Swap Page (Trang Hoán Đổi)

- **Người đảm nhận:** **Hộp**
- **Mã Yêu cầu:** `[UC-02]`, `[UC-03]`, `[FR-01]` (tất cả sub-items), C4-Component (Page Home)
- **Task phụ thuộc:** Task 3.2, Task 3.5, Task 3.6, Task 4.1
- **Đường dẫn File:** `src/app/page.tsx`

## Mô tả chi tiết công việc

Đây là trang **chính (Home)** của ứng dụng, xử lý toàn bộ luồng Swap `[FR-01]`.

1. **Layout:** Card trung tâm `max-w-md mx-auto` theo `frontend-design.md §2.1`:
   - `bg-white rounded-2xl shadow-sm border border-slate-200 p-6`.
   - Tiêu đề "Hoán đổi" (Swap) phía trên.
2. **Swap Form:**
   - **Input Token (From):**
     - `<TokenSelector>` chọn token nguồn — `[FR-01.2]`.
     - `<Input>` (shadcn/ui) nhập số lượng, type="number".
     - Hiển thị balance: `"Số dư: 1,234.56 mUSDT"` gọi `swapService.getTokenBalance()`.
   - **Nút đảo chiều:** Icon `<ArrowDownUp />` (lucide), click swap vị trí tokenFrom ↔ tokenTo.
   - **Output Token (To):**
     - `<TokenSelector>` chọn token đích — `[FR-01.2]`.
     - `<Input>` readonly, hiển thị số lượng ước tính gọi `swapService.getAmountsOut()` — `[FR-01.3]`.
3. **Thông tin giao dịch `[FR-01.4]`:**
   - **Price Impact:** Tính `= (amountIn * reserveOut / reserveIn - amountOut) / (amountIn * reserveOut / reserveIn) * 100`. Hiển thị màu: `< 1%` xanh, `1-5%` vàng `text-amber-500`, `> 5%` đỏ `text-red-500`.
   - **Minimum Received:** `amountOut * (1 - slippage / 100)`. Hiển thị `font-mono`.
   - **Slippage Tolerance:** Cho phép user chọn `0.5%`, `1%`, `2%` hoặc custom. Lưu state local.
   - **Exchange Rate:** `1 TokenA = X TokenB`.
4. **Swap Button:**
   - Trạng thái tuần tự:
     1. Ví chưa kết nối → `"Kết nối Ví"` (gọi `connectWallet()`).
     2. Chưa nhập amount → `"Nhập số lượng"` (disabled, mờ).
     3. Cần Approve → `"Phê duyệt [Token Symbol]"` — gọi `swapService.approveToken()` — `[UC-02]`.
     4. Sẵn sàng → `"Hoán đổi"` gradient `bg-gradient-to-r from-sky-400 to-blue-500`.
   - Khi đang gửi TX → disable, `<Loader2 className="animate-spin" />` — `frontend-design.md §4`.
   - Styling: `w-full rounded-xl py-3 text-lg font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/25`.
5. **Luồng xử lý khi click "Hoán đổi":**
   - Kiểm tra allowance → nếu chưa đủ → approve trước.
   - Gọi `swapService.swapExactTokensForTokens(signer, amountIn, amountOutMin, [tokenFrom, tokenTo], account, deadline)` — `[FR-01.5]`.
   - Chờ TX confirm → hiện Toast thành công (emerald) hoặc thất bại (red) — `frontend-design.md §2.4`.
   - Refresh balance sau swap.

## Đầu ra mong muốn

Trang Swap hoàn chỉnh, xử lý full luồng UC-02 → UC-03, hiển thị Price Impact, Minimum Received, Slippage. UI theo design system.
