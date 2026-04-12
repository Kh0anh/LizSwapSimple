// [NFR-02] Root Layout — Cấu trúc layout gốc cho Next.js App Router
// Chi tiết font và design sẽ được thiết lập tại Task 3.1

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LizSwapSimple — DEX",
  description:
    "Sàn giao dịch phi tập trung (DEX) nguyên mẫu dựa trên AMM Uniswap V2 cho BSC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
