/**
 * Input Component — LizSwapSimple UI System
 * Task 3.6: Cài đặt shadcn/ui Components cơ bản [frontend-design.md §1, §4]
 *
 * Sử dụng trong:
 * - [FR-01.3] Token Amount Input: Nhập số lượng Token nguồn để swap (Swap Page)
 * - [FR-02.2] Liquidity Amount Input: Nhập số lượng Token để thêm thanh khoản
 *
 * Design tokens kế thừa từ globals.css:
 * - border-input = slate-200 [frontend-design.md §2.1]
 * - focus-visible:border-ring = sky-500 focus ring [frontend-design.md §2.2]
 * - placeholder:text-muted-foreground = slate-500 [frontend-design.md §2.3]
 * - rounded-lg = bo góc chuẩn cho input [frontend-design.md §4]
 */

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
