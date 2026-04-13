/**
 * [NFR-02] Button Component — LizSwapSimple UI System
 * Task 1.6: Khởi tạo shadcn/ui và Tailwind Design Token
 * Tuân thủ: frontend-design.md §4 (Micro-animations, Hover Effects)
 *
 * Variant "default": Primary gradient sky→blue dùng cho Swap, Add Liquidity,
 * Connect Wallet buttons theo [frontend-design.md §2.2]
 * Hover Effect: transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
 * Loading State: Spinner animate-spin khi giao dịch đang chờ
 */

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * buttonVariants — CVA variants cho Button components
 * [frontend-design.md §4] Micro-animations: hover:scale-[1.02], active:scale-[0.98]
 * [frontend-design.md §2.2] Primary: Sky-500 gradient (bg-primary = oklch sky-500)
 * [frontend-design.md §4] Bo góc: rounded-lg đến rounded-full
 */
const buttonVariants = cva(
  // Base classes: transition-all duration-300 theo [frontend-design.md §4]
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap select-none outline-none " +
  "transition-all duration-300 " +
  // Focus ring
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 " +
  // Disabled
  "disabled:pointer-events-none disabled:opacity-50 " +
  // Aria invalid
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 " +
  "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 " +
  // SVG
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /**
         * default: Primary action button — bg-primary (sky-500)
         * [frontend-design.md §2.2] Màu nhấn chủ đạo cho Swap / Add Liquidity
         * [frontend-design.md §4] hover:scale-[1.02] active:scale-[0.98]
         */
        default:
          "bg-primary text-primary-foreground " +
          "hover:scale-[1.02] active:scale-[0.98] " +
          "hover:shadow-lg hover:shadow-primary/25 " +
          "hover:opacity-90",

        /**
         * gradient: Primary gradient sky-400 → blue-500
         * [frontend-design.md §2.2] bg-gradient-to-r from-sky-400 to-blue-500
         * Dùng cho CTA chính: Swap Now, Connect Wallet
         */
        gradient:
          "bg-gradient-to-r from-sky-400 to-blue-500 text-white border-transparent " +
          "hover:scale-[1.02] active:scale-[0.98] " +
          "hover:shadow-lg hover:shadow-blue-500/30 " +
          "hover:from-sky-500 hover:to-blue-600",

        /**
         * outline: Secondary action — border với hover nền muted
         * [frontend-design.md §2.1] bg-white + border-slate-200
         */
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground " +
          "hover:scale-[1.01] active:scale-[0.99] " +
          "aria-expanded:bg-muted aria-expanded:text-foreground " +
          "dark:border-input dark:bg-input/30 dark:hover:bg-input/50",

        /**
         * secondary: Nền slate-100, text slate-900
         */
        secondary:
          "bg-secondary text-secondary-foreground " +
          "hover:bg-secondary/80 hover:scale-[1.01] active:scale-[0.99] " +
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",

        /**
         * ghost: Không nền, hover nền muted
         */
        ghost:
          "hover:bg-muted hover:text-foreground hover:scale-[1.01] active:scale-[0.99] " +
          "aria-expanded:bg-muted aria-expanded:text-foreground " +
          "dark:hover:bg-muted/50",

        /**
         * destructive: Error state — [frontend-design.md §2.4] red-500
         * Dùng cho Remove Liquidity warning, Slippage exceeded
         */
        destructive:
          "bg-destructive/10 text-destructive " +
          "hover:bg-destructive/20 hover:scale-[1.01] active:scale-[0.99] " +
          "focus-visible:border-destructive/40 focus-visible:ring-destructive/20 " +
          "dark:bg-destructive/20 dark:hover:bg-destructive/30 " +
          "dark:focus-visible:ring-destructive/40",

        /**
         * link: Text button với underline
         */
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs " +
          "in-data-[slot=button-group]:rounded-lg " +
          "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 " +
          "[&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] " +
          "in-data-[slot=button-group]:rounded-lg " +
          "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 " +
          "[&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 rounded-xl text-base",
        xl: "h-13 gap-2 px-8 rounded-xl text-base font-semibold",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] " +
          "in-data-[slot=button-group]:rounded-lg " +
          "[&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] " +
          "in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button Component
 * [frontend-design.md §4] Tất cả button có micro-animation hover/active
 * [UC-01] Connect Wallet: dùng variant="gradient"
 * [UC-03] Swap: dùng variant="gradient" size="lg"
 * [UC-04] Add Liquidity: dùng variant="gradient"
 * [UC-05] Remove Liquidity: dùng variant="destructive"
 */
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
