"use client";

/**
 * Navbar Component — LizSwapSimple DEX
 * Task 3.2: Navbar Component (thay thế placeholder từ Task 3.1)
 *
 * Yêu cầu liên quan:
 * - [UC-01] Kết nối ví MetaMask — WalletConnectButton bên phải
 * - [FR-01.1] Navigation đến Swap page (trang chính)
 * - frontend-design.md §2: màu sắc, typography
 * - frontend-design.md §4: micro-animations, transitions
 * - project-structure.md §2: vị trí file src/components/Navbar.tsx
 *
 * Cấu trúc layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  🦎 LizSwap  │     Swap   Pool     │  [Kết nối Ví]         │
 * └─────────────────────────────────────────────────────────────┘
 *   (shrink-0)       (flex-1 center)        (shrink-0)
 *
 * - Logo: gradient text từ sky-400 → blue-500 [frontend-design.md §2.2]
 * - Nav links: Swap (/), Pool (/pool) — active state dùng usePathname()
 * - WalletConnectButton: slot bên phải [UC-01]
 * - Container: sticky, glassmorphism bg-white/80 backdrop-blur-md [frontend-design.md §2.1]
 * - Responsive: mobile thu gọn nav links
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletConnectButton } from "@/components/web3/WalletConnectButton";

// ─── Nav Links Config ────────────────────────────────────────────────────────

/**
 * Danh sách navigation links theo [FR-01.1]
 * href phải khớp với cấu trúc route trong Next.js App Router
 */
const NAV_LINKS = [
  {
    label: "Swap",
    href: "/",
    /** [UC-03] Trang hoán đổi token chính */
  },
  {
    label: "Pool",
    href: "/pool",
    /** [UC-04] [UC-05] Trang quản lý thanh khoản */
  },
] as const;

// ─── NavLink Component ────────────────────────────────────────────────────────

/**
 * [FR-01.1] NavLink — link điều hướng với active state
 *
 * Active: text-sky-500 font-semibold [frontend-design.md §2.2]
 * Inactive: text-slate-500 hover:text-sky-500 [frontend-design.md §2.3]
 * Transition: duration-200 [frontend-design.md §4]
 */
function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        // Base styles
        "relative text-sm font-medium transition-colors duration-200",
        // Padding cho click area
        "px-1 py-1",
        // [frontend-design.md §4] Underline indicator animation
        "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full",
        "after:rounded-full after:transition-all after:duration-200",
        // Active state [frontend-design.md §2.2]
        isActive
          ? "text-sky-500 font-semibold after:bg-sky-500 after:scale-x-100"
          : // Inactive: hover → sky-500, underline hidden [frontend-design.md §2.3]
            "text-slate-500 hover:text-sky-500 after:bg-sky-400 after:scale-x-0 hover:after:scale-x-100"
      )}
    >
      {label}
    </Link>
  );
}

// ─── Navbar (Main Component) ──────────────────────────────────────────────────

/**
 * [UC-01] [FR-01.1] Navbar — Thanh điều hướng cố định trên cùng
 *
 * Glassmorphism style [frontend-design.md §2.1]:
 * - bg-white/80: nền trắng với 80% opacity
 * - backdrop-blur-md: blur effect phía sau
 * - border-b border-slate-200: đường kẻ dưới mảnh
 * - sticky top-0 z-50: cố định và đè lên nội dung
 *
 * Layout (justify-between):
 * [Logo]  ──────────  [Swap | Pool]  ──────────  [WalletConnectButton]
 */
export function Navbar() {
  // [FR-01.1] Theo dõi route hiện tại để highlight nav link đúng
  const pathname = usePathname();

  return (
    <nav
      // [frontend-design.md §2.1] Glassmorphism container
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md"
      aria-label="Navigation chính"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* ── Logo (Left) ───────────────────────────────────────────────── */}
        {/**
         * [frontend-design.md §2.2] Logo gradient sky-400 → blue-500
         * [frontend-design.md §3] font-mono — JetBrains Mono
         * [frontend-design.md §4] hover:scale-[1.02] micro-animation
         */}
        <Link
          href="/"
          className={cn(
            "font-mono font-bold text-xl tracking-tight shrink-0",
            "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]",
            // Gradient text [frontend-design.md §2.2]
            "bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent"
          )}
          aria-label="LizSwap — Trang chủ"
        >
          🦎 LizSwap
        </Link>

        {/* ── Center: Desktop Navigation Links ──────────────────────────── */}
        {/**
         * [FR-01.1] Swap và Pool — ẩn trên mobile (sm:flex)
         * flex-1 justify-center: canh giữa giữa Logo và WalletButton
         */}
        <div
          className="hidden sm:flex flex-1 items-center justify-center gap-8"
          role="navigation"
          aria-label="Trang chính"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              isActive={pathname === link.href}
            />
          ))}
        </div>

        {/* ── Right: Mobile Nav + WalletConnectButton ───────────────────── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Mobile nav links — hiển thị chỉ khi < sm */}
          <div
            className="flex items-center gap-4 sm:hidden"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs font-medium transition-colors duration-200",
                  pathname === link.href
                    ? "text-sky-500 font-semibold"
                    : "text-slate-500 hover:text-sky-500"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* [UC-01] WalletConnectButton — entry point kết nối MetaMask */}
          {/**
           * Task 3.4: WalletConnectButton (Huy) đã implement:
           * - Chưa kết nối: gradient "Kết nối Ví"
           * - Đang kết nối: spinner + disabled
           * - Đã kết nối: address rút gọn + dropdown Ngắt kết nối
           */}
          <WalletConnectButton />
        </div>

      </div>
    </nav>
  );
}
