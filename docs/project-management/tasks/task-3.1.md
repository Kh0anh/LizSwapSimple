# Task 3.1: Root Layout & Google Font Integration

- **Người đảm nhận:** **Hộp**
- **Mã Yêu cầu:** `[NFR-02]`, frontend-design.md §3 (Font JetBrains Mono)
- **Task phụ thuộc:** Task 1.6
- **Đường dẫn File:** `src/app/layout.tsx`

## Mô tả chi tiết công việc

1. Import `JetBrains_Mono` từ `next/font/google`:
   ```tsx
   import { JetBrains_Mono } from 'next/font/google';
   const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
   ```
2. Áp dụng font class lên `<html>` và `<body>`:
   ```tsx
   <html lang="vi" className={jetbrainsMono.variable}>
     <body className="font-mono bg-slate-50 text-slate-900 min-h-screen antialiased">
       <Navbar />
       <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
     </body>
   </html>
   ```
3. SEO metadata:
   ```tsx
   export const metadata = {
     title: 'LizSwapSimple — DEX on BSC',
     description: 'Sàn giao dịch phi tập trung AMM trên Binance Smart Chain',
   };
   ```
4. Import `globals.css` (đã setup ở Task 1.6).

## Đầu ra mong muốn

Layout wrapper hoàn chỉnh, font JetBrains Mono áp dụng toàn app, nền `bg-slate-50`.
