# Task 4.6: Confirmation Dialog (Modal xác nhận)

- **Người đảm nhận:** **Hộp**
- **Mã Yêu cầu:** frontend-design.md §4 (Transitions Modal), `[FR-01.4]`
- **Task phụ thuộc:** Task 3.6, Task 4.2, Task 4.3
- **Đường dẫn File:** `src/components/web3/ConfirmSwapDialog.tsx`, `src/components/web3/ConfirmLiquidityDialog.tsx`

## Mô tả chi tiết công việc

1. **`ConfirmSwapDialog.tsx`:**
   - Sử dụng shadcn/ui `<Dialog>`.
   - Hiển thị: Token From → Token To, Amount In/Out, Price Impact, Minimum Received, Slippage.
   - Nút "Xác nhận Hoán đổi" gradient.
   - Fade/Slide animation theo shadcn/ui state.
2. **`ConfirmLiquidityDialog.tsx`:**
   - Hiển thị: Token A amount, Token B amount, Estimated LP Tokens, Share of Pool.
   - Nút "Xác nhận Thêm Thanh khoản".
3. **Styling:** `rounded-2xl`, transitions `transition-all duration-300`.

## Đầu ra mong muốn

Modal xác nhận trước khi gửi TX, UX chuyên nghiệp, tránh click nhầm.
