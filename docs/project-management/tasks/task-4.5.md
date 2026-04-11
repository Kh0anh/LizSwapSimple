# Task 4.5: Transaction Toast/Notification System

- **Người đảm nhận:** **Hộp**
- **Mã Yêu cầu:** frontend-design.md §4 (Transitions, Loading State), `[FR-01.5]` feedback
- **Task phụ thuộc:** Task 3.6, Task 3.1
- **Đường dẫn File:** `src/components/web3/TransactionToast.tsx`, `src/app/layout.tsx` (add Toaster)

## Mô tả chi tiết công việc

1. Sử dụng shadcn/ui `<Toaster />` component, thêm vào `layout.tsx`.
2. Tạo utility `showTxToast(status, txHash?)`:
   - **Pending:** `"Giao dịch đang xử lý..."` + `<Loader2 className="animate-spin text-sky-500" />`.
   - **Success:** `"Giao dịch thành công!"` + `<CheckCircle className="text-emerald-500" />` + link xem trên BSCScan `text-sky-500 underline`.
   - **Error:** `"Giao dịch thất bại"` + `<XCircle className="text-red-500" />` + error message.
3. **Styling theo frontend-design.md §2.4:**
   - Success: `bg-emerald-500/10 border-emerald-200`.
   - Error: `bg-red-500/10 border-red-200`.
   - Warning: `bg-amber-500/10 border-amber-200`.
4. Toast auto-dismiss sau 8 giây, closeable.

## Đầu ra mong muốn

Hệ thống notification thống nhất cho mọi TX trên toàn app.
