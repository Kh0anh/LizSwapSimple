# Giao Diện Cảm Quan và Hướng Dẫn UI/UX (Frontend Design Guidelines)

> **Phiên bản:** v1 | **Ngày tạo:** 9 tháng 4 năm 2026 | **Tác giả:** Khanh

Tài liệu này xác định các quy chuẩn về mặt hình ảnh, thiết kế, màu sắc, font chữ và trải nghiệm UI/UX cho nền tảng **LizSwapSimple DEX**. Việc tuân thủ tài liệu này là bắt buộc trong quá trình code component UI tại thư mục `src/` nhằm đảm bảo tính thẩm mỹ chuẩn Premium Web3 và nhất quán trên toàn bộ hệ thống.

Tài liệu này dựa trên các yêu cầu từ kỹ thuật chuẩn đã được chốt cứng trong `techstack.md` và `srs.md`.

## 1. Tổng Quan Ngăn Xếp Ui (UI Tech Stack)

*   **Framework**: Next.js (Static HTML/JS - theo `[NFR-02]`).
*   **CSS Framework**: Tailwind CSS (Sử dụng hệ thống Utility-First).
*   **Component System**: `shadcn/ui` (Sử dụng để xây dựng Modal, Toast, Button,... tạo sự đồng nhất).
*   **Icons**: Thư viện `lucide-react`.

## 2. Hệ Thống Màu Sắc (Color Palette & Theming)

Hệ thống LizSwapSimple sẽ theo đuổi thiết kế **Light Mode (Chế độ màu sáng duy nhất)**. Nhằm đem lại cảm giác sang trọng ("Premium") nhưng vô cùng thanh thoát, hệ thống sử dụng màu nền sáng sủa kết hợp với màu chủ đạo là **Xanh Nước Biển Sáng (Light Blue/Sky Blue)** mang tính chất "Dynamic" nổi bật.

### 2.1. Màu Nền (Backgrounds & Surfaces)
- **App Background**: Màu trắng hoặc xám cực nhạt.
  - Tailwind: `bg-slate-50` (`#f8fafc`)
- **Card/Container (Swap/Pool Box)**: Bề mặt trắng tinh khiết nổi lên trên nền hệ thống, mang hơi hướng thiết kế phẳng hiện đại pha viền bóng đổ.
  - Tailwind: `bg-white` (`#ffffff`) kết hợp thẻ đổ bóng nhẹ `shadow-sm` và viền mảnh `border border-slate-200`.

### 2.2. Màu Nhấn Chủ Đạo (Primary Colors)
Sử dụng Xanh Nước Biển Sáng làm màu định hướng cho các hành động chính (Swap, Add Liquidity, Connect Wallet,...). Gradient kết hợp giữa các tông xanh lam để tạo sức sống:
- **Primary Gradient**: Chuyển sắc từ Xanh Biển Nhạt (Sky) sang Xanh Dương (Blue).
  - Tailwind: `bg-gradient-to-r from-sky-400 to-blue-500`
- **Primary Solid (Dùng cho Text/Icon hover)**: Xanh nước biển (`#0ea5e9` - `sky-500` hoặc `#3b82f6` - `blue-500`).

### 2.3. Màu Văn Bản (Typography Colors)
- **Text Primary (Tiêu đề, Text chính)**: Đen than nhã nhặn.
  - Tailwind: `text-slate-900` (`#0f172a`)
- **Text Muted (Mô tả phụ, Label, Placeholder)**: Xám nhạt.
  - Tailwind: `text-slate-500` (`#64748b`)

### 2.4. Semantic Colors (Màu Trạng Thái)
- **Thành Công (Success)**: Màu xanh ngọc chỉ báo giao dịch TX đã hoàn thành trên mạng BSC.
  - Tailwind: `text-emerald-500`, `bg-emerald-500/10`
- **Lỗi / Thất Bại (Error)**: Màu đỏ chỉ lỗi (Vượt Slippage, lỗi hợp đồng).
  - Tailwind: `text-red-500`, `bg-red-500/10`
- **Cảnh Báo (Warning)**: Màu hổ phách/cam chỉ báo Price Impact cao.
  - Tailwind: `text-amber-500`, `bg-amber-500/10`

## 3. Hệ Thống Font Chữ (Typography)

Sử dụng Google Fonts kết hợp trong Next.js `next/font/google` để tối ưu hóa việc truyền tải.

- **Font Chủ Đạo và Duy Nhất Hệ Thống - `JetBrains Mono`**:
  - *Áp dụng*: Sử dụng cho TẤT CẢ các khối giao diện (Text chính, Tiêu đề, Label) cũng như bắt buộc cho việc hiển thị **Số Dư (Balance)**, **Ví Địa Chỉ (Wallet Address)**, **Mã Transaction Hash**.
  - *Đặc tính*: Là font đơn không gian (Monospace) mang đậm chất công nghệ (Cyber/Dev aesthetic), đảm bảo các con số có độ rộng bằng nhau (tabular numbers) giúp dễ theo dõi số dư/address đồng thời tạo sự đồng nhất tuyệt đối cho toàn bộ ứng dụng DEX.

## 4. UI/UX & Hiệu Ứng Trực Quan (Micro-animations)

Các chi tiết này phải được tích hợp sẵn ở cấp Component UI hoặc Tailwind Classes để đảm bảo LizSwapSimple không bị khô khan mà trở nên "Sống động" (Dynamic).

- **Tương Tác Hover Button**: Khi hover vào các nút bấm tương tác (Primary Button), kích thước phải nảy nhẹ hoặc mượt mà sáng lên.
  - Code mẫu: `transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/25`
- **Transitions Modal / Toast**: Mở hoặc Đóng hộp thoại xác nhận thanh khoản / Hoán đổi cần sử dụng hiệu ứng lướt (Fade/Slide từ shadcn/ui state). Mọi thay đổi trạng thái UI đều bọc bằng thuộc tính `transition-colors duration-200`.
- **Trạng Thái Chờ (Loading State)**:
  - Khi chờ gọi hàm qua `ethers.js` mạng BSC, các Button chính phải vào trạng thái disable kèm hiệu ứng xoay (Spinner) đồng màu.
  - Không sử dụng Text Loading khô khan; sử dụng Loading Icons (lucide) xoay mượt `animate-spin`.
- **Bo Góc (Border Radius)**:
  - Các khối Card/Box giữ độ bo mềm mại, hiện đại: Sử dụng mức `rounded-xl` lên tới `rounded-2xl`. Nút bấm dùng `rounded-lg` tới `rounded-full`.

## 5. Cấu trúc Đồng bộ Component

Để đảm bảo màu sắc và font chữ được thống nhất ở toàn bộ ứng dụng, tất cả được định nghĩa token HSL xuyên suốt tại file cấu hình:

- **Thực thi qua (`src/app/globals.css`)**: File `globals.css` sẽ thiết lập sẵn các custom properties như `--background`, `--foreground`, `--primary`, `--muted` theo bảng màu Light Mode ở Mục 2 để shadcn/ui tái dử dụng.
- **`tailwind.config.ts`**: Được thiết lập để đón trực tiếp CSS Variable, ví dụ `colors: { primary: 'hsl(var(--primary))' }` – nhờ vậy các lập trình viên frontend không được phép dùng hardcode mã Hex vào JSX/TSX.

---
*Tài liệu này là cam kết bắt buộc cho việc xây dựng thư mục `src/`. Mọi thay đổi phải review lại chuẩn thiết kế.*
