/**
 * Sonner/Toaster Component — LizSwapSimple UI System
 * Task 3.6: Cài đặt shadcn/ui Components cơ bản [frontend-design.md §1, §4]
 *
 * Thay thế cho `toast` (không có trong registry base-nova).
 * Sử dụng trong:
 * - [FR-01.5] TX Notification: Thông báo trạng thái giao dịch Swap (Pending/Success/Error)
 * - [FR-02.4] Add Liquidity Notification: Phản hồi kết quả thêm thanh khoản
 * - [FR-03.2] Remove Liquidity Notification: Phản hồi kết quả rút thanh khoản
 * - [UC-02] Approve Notification: Thông báo kết quả phê duyệt token
 *
 * Design tokens kế thừa từ globals.css:
 * - --normal-bg = var(--popover) = white [frontend-design.md §2.1]
 * - --normal-border = var(--border) = slate-200 [frontend-design.md §2.1]
 * - --border-radius = var(--radius) = 0.75rem [frontend-design.md §4]
 * - Icons: lucide-react (CircleCheck=success, OctagonX=error, Loader2=loading)
 *   animate-spin cho loading state [frontend-design.md §4]
 *
 * [frontend-design.md §2] Light Mode ONLY — hardcode theme="light"
 * Không dùng useTheme/next-themes vì dự án không hỗ trợ dark mode
 */
"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/**
 * Toaster — Wrapper của Sonner Toaster được cấu hình theo LizSwapSimple Design System
 * [frontend-design.md §2] theme="light" cố định — không toggle dark mode
 * [frontend-design.md §4] Loading spinner: animate-spin
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      // [frontend-design.md §2] Light Mode ONLY — bỏ useTheme
      theme="light"
      className="toaster group"
      // [frontend-design.md §4] Icons lucide-react — animate-spin cho loading state
      icons={{
        success: (
          // [frontend-design.md §2.4] Success: emerald-500
          <CircleCheckIcon className="size-4 text-emerald-500" />
        ),
        info: (
          // [frontend-design.md §2.2] Info: sky-500
          <InfoIcon className="size-4 text-sky-500" />
        ),
        warning: (
          // [frontend-design.md §2.4] Warning: amber-500
          <TriangleAlertIcon className="size-4 text-amber-500" />
        ),
        error: (
          // [frontend-design.md §2.4] Error: red-500
          <OctagonXIcon className="size-4 text-red-500" />
        ),
        loading: (
          // [frontend-design.md §4] Loading State: animate-spin
          <Loader2Icon className="size-4 animate-spin text-sky-500" />
        ),
      }}
      style={
        {
          // [frontend-design.md §2.1] Kế thừa CSS variables từ globals.css
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // [frontend-design.md §2.4] Semantic colors
          "--success-bg": "var(--popover)",
          "--error-bg": "var(--popover)",
        } as React.CSSProperties
      }
      // [frontend-design.md §4] dismiss sau 8s để người dùng đọc TX hash
      duration={8000}
      {...props}
    />
  )
}

export { Toaster }
