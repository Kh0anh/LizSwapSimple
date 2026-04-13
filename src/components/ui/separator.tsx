/**
 * Separator Component — LizSwapSimple UI System
 * Task 3.6: Cài đặt shadcn/ui Components cơ bản [frontend-design.md §1, §4]
 *
 * Sử dụng trong:
 * - [FR-01] SwapCard: Phân tách khu vực Input/Output token
 * - [FR-01.4] SwapInfo: Phân tách thông số Price Impact, Slippage, Min Received
 * - [FR-02] PoolCard: Phân tách thông số Pool info
 *
 * Design tokens kế thừa từ globals.css:
 * - bg-border = slate-200 [frontend-design.md §2.1]
 */
"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
