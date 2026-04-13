// [NFR-02] Root Layout — Cấu trúc layout gốc cho Next.js App Router
// Chi tiết font và design sẽ được thiết lập tại Task 3.1

import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
