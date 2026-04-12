# Task 3.2: Navbar Component

- **Người đảm nhận:** **Hộp**
- **Mã Yêu cầu:** `[UC-01]` (Kết nối ví), `[FR-01.1]`, frontend-design.md §2, §4, project-structure.md §2
- **Task phụ thuộc:** Task 3.1, Task 3.4
- **Đường dẫn File:** `src/components/Navbar.tsx`

## Mô tả chi tiết công việc

1. **Cấu trúc:**
   - Logo "LizSwap" bên trái (text gradient `bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent`).
   - Navigation links: "Swap" (`/`) và "Pool" (`/pool`).
   - Nút `<WalletConnectButton />` bên phải.
2. **Styling theo frontend-design.md:**
   - Container: `bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50`.
   - Nav links: `text-slate-500 hover:text-sky-500 transition-colors duration-200`.
   - Active link: `text-sky-500 font-semibold` (dùng `usePathname()` từ Next.js).
3. **Responsive:** Sử dụng flexbox, trên mobile thu gọn nav phù hợp.

## Đầu ra mong muốn

Navbar cố định trên đầu trang, Logo gradient, navigation Swap/Pool, slot cho WalletConnectButton.
