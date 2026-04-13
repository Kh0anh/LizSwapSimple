/**
 * [NFR-02] Root Layout — LizSwapSimple DEX
 * Task 1.6: Tích hợp font JetBrains Mono via next/font/google [frontend-design.md §3]
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

/**
 * [frontend-design.md §3] JetBrains Mono — Monospace font cho DEX
 * Subsets: latin + vietnamese (hỗ trợ tiếng Việt cho UI text)
 * Weights: 300, 400, 500, 600, 700 — đủ dùng cho mọi typography level
 * display: swap — tránh invisible text khi font đang tải
 */
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  // CSS variable để dùng trong globals.css @theme
  variable: "--font-jetbrains-mono",
});

/**
 * [NFR-02] SEO Metadata cho LizSwapSimple
 * Static export cần metadata rõ ràng để đảm bảo SEO khi deploy S3/IPFS
 */
export const metadata: Metadata = {
  title: "LizSwapSimple — Decentralized Exchange",
  description:
    "Sàn giao dịch phi tập trung (DEX) nguyên mẫu dựa trên AMM Uniswap V2 cho BSC. Thực hiện Swap, Add/Remove Liquidity phi tập trung.",
  keywords: ["DEX", "DeFi", "BSC", "AMM", "Uniswap V2", "Swap", "Liquidity"],
  authors: [{ name: "LizSwapSimple Team" }],
};

/**
 * RootLayout — Layout gốc cho toàn bộ Next.js App Router
 * [NFR-02] Static export: không dùng server-side logic
 * Font class được inject qua className để CSS variable hoạt động
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={jetBrainsMono.variable}>
      {/*
       * bg-background = slate-50 (#f8fafc) theo [frontend-design.md §2.1]
       * font-sans = JetBrains Mono theo @theme inline trong globals.css
       * [frontend-design.md §3] min-h-screen đảm bảo nền bao phủ toàn trang
       */}
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
