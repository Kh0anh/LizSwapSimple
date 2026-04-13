# Task 3.6: Cài đặt shadcn/ui Components cơ bản

- **Người đảm nhận:** **Hộp**
- **Mã Yêu cầu:** frontend-design.md §1, §4, techstack.md §2
- **Task phụ thuộc:** Task 1.6
- **Đường dẫn File:** `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/input.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/toast.tsx`, `src/components/ui/tooltip.tsx`, `src/components/ui/select.tsx`, `src/components/ui/dropdown-menu.tsx`

## Mô tả chi tiết công việc

1. Cài đặt các shadcn/ui components cần thiết bằng CLI:
   ```bash
   npx shadcn-ui@latest add button card input dialog toast tooltip select dropdown-menu
   ```
2. Verify mỗi component tự kế thừa Design Token HSL từ `globals.css`.
3. Components này sẽ được Phase 4 dùng để xây dựng Swap Card, Pool Form, TX Confirmation Modal.

## Đầu ra mong muốn

Tất cả UI components cần thiết đã cài trong `src/components/ui/`, style đồng nhất theo design system.
