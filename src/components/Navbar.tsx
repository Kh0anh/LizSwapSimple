/**
 * [UC-01] Navbar Component — Placeholder
 * Task 3.1: Tạo skeleton Navbar để Root Layout có thể import
 *
 * ⚠️ PLACEHOLDER: Component này sẽ được hoàn thiện đầy đủ tại Task 3.2
 * - Task 3.2 sẽ thêm: Logo gradient, Link Swap/Pool, WalletConnectButton, responsive
 * - Task 3.4 sẽ tích hợp WalletConnectButton vào đây
 *
 * Yêu cầu liên quan:
 * - [UC-01] Kết nối ví Web3 — entry point trong Navbar
 * - [FR-01.1] Nút Connect Wallet hiển thị trong Navbar
 * - frontend-design.md §2, §4: màu sắc và micro-animations sẽ thêm ở Task 3.2
 */

import { WalletConnectButton } from "@/components/web3/WalletConnectButton";

export function Navbar() {
  return (
    // [frontend-design.md §2.1] bg-white với border-bottom slate-200
    // Navbar sticky top để luôn hiển thị khi scroll
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo placeholder — Task 3.2 sẽ thay bằng Logo gradient chính thức */}
        <span className="font-mono font-bold text-slate-900 text-lg tracking-tight">
          {/* [frontend-design.md §2.2] gradient-primary-text cho logo */}
          LizSwap
        </span>

        {/* Navigation links + WalletConnectButton — Task 3.2 & 3.4 sẽ hoàn thiện */}
        <div className="flex items-center gap-4">
          {/* Placeholder navigation — sẽ được thay thế ở Task 3.2 */}
          {/* [UC-01] Task 3.4: Wallet connect entry point */}
          <WalletConnectButton />
        </div>
      </div>
    </nav>
  );
}
