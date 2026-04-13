/**
 * [NFR-02] Root Layout — LizSwapSimple DEX
 * Task 3.1: Root Layout & Google Font Integration [frontend-design.md §3] [NFR-02]
 *
 * Yêu cầu liên quan:
 * - [NFR-02] Frontend Tĩnh: static export, không có server-side logic
 * - frontend-design.md §3: JetBrains Mono — font duy nhất cho toàn bộ hệ thống DEX
 *
 * Font strategy: next/font/google tối ưu font loading (preload, no layout shift)
 * [frontend-design.md §3] JetBrains Mono — font duy nhất cho toàn bộ hệ thống DEX:
 * - Text chính, tiêu đề, label
 * - Số dư (Balance), Địa chỉ ví (Wallet Address), Transaction Hash
 * - Đảm bảo tabular-nums: số có độ rộng đều, dễ theo dõi
 */

import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

/**
 * [frontend-design.md §3] JetBrains Mono — Monospace font cho DEX
 * variable: '--font-mono' — CSS variable dùng trong globals.css @theme
 * Subsets: latin + latin-ext (hỗ trợ ký tự mở rộng Latin cho UI text)
 * Weights: 300, 400, 500, 600, 700 — đủ dùng cho mọi typography level
 * display: swap — tránh invisible text khi font đang tải
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  // [frontend-design.md §3] CSS variable để dùng trong globals.css @theme
  variable: "--font-mono",
});

/**
 * [NFR-02] SEO Metadata cho LizSwapSimple
 * - Static export cần metadata rõ ràng để đảm bảo SEO khi deploy S3/IPFS/Docker
 * - title, description theo spec task-3.1.md
 */
export const metadata: Metadata = {
  title: "LizSwapSimple — DEX on BSC",
  description: "Sàn giao dịch phi tập trung AMM trên Binance Smart Chain",
  keywords: ["DEX", "DeFi", "BSC", "AMM", "Uniswap V2", "Swap", "Liquidity"],
  authors: [{ name: "LizSwapSimple Team" }],
};

/**
 * RootLayout — Layout gốc cho toàn bộ Next.js App Router
 * [NFR-02] Static export: không dùng server-side logic
 *
 * Cấu trúc theo task-3.1.md:
 * <html lang="vi" className={jetbrainsMono.variable}>
 *   <body className="font-mono bg-slate-50 text-slate-900 min-h-screen antialiased">
 *     <Navbar />
 *     <main>{children}</main>
 *   </body>
 * </html>
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={jetbrainsMono.variable}>
      {/*
       * [frontend-design.md §2.1] bg-slate-50 (#f8fafc) — nền toàn app
       * [frontend-design.md §2.3] text-slate-900 (#0f172a) — text chính
       * [frontend-design.md §3] font-mono = JetBrains Mono (via --font-mono variable)
       * min-h-screen đảm bảo nền bao phủ toàn trang
       * antialiased: smooth font rendering cho số dư và addresses
       */}
      <body className="font-mono bg-slate-50 text-slate-900 min-h-screen antialiased">
        {/* [UC-01] Navbar chứa nút Connect Wallet — sẽ hoàn thiện ở Task 3.2 */}
        <Navbar />
        {/*
         * [NFR-02] Main content wrapper
         * max-w-7xl: giới hạn chiều rộng tối đa
         * mx-auto px-4 py-8: căn giữa và padding chuẩn
         */}
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
