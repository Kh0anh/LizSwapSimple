/**
 * [NFR-02] Utility Functions — LizSwapSimple
 * Task 1.6: Khởi tạo shadcn/ui và Tailwind Design Token
 *
 * cn() — Class Name merger dùng clsx + tailwind-merge
 * Cho phép kết hợp conditional Tailwind classes an toàn, tránh conflict.
 * Dùng xuyên suốt mọi UI Component của LizSwap.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Kết hợp Tailwind class names một cách thông minh.
 * Ưu tiên: tailwind-merge giải quyết conflict, clsx xử lý điều kiện.
 *
 * @example
 * cn("bg-primary text-white", isActive && "opacity-100", "hover:scale-[1.02]")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
