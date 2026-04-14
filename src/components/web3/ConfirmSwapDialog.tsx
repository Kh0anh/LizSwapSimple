"use client";

/**
 * ConfirmSwapDialog — Modal xác nhận Hoán Đổi Token
 * Task 4.6: Confirmation Dialog (Modal xác nhận)
 *
 * Yêu cầu liên quan:
 * - [FR-01.4] Hiển thị Price Impact, Minimum Received, Slippage trước khi ký TX
 * - frontend-design.md §4: Fade/Slide animation (data-open:animate-in data-open:zoom-in-95)
 * - frontend-design.md §2.1: bg-white card, border-slate-200
 * - frontend-design.md §2.2: gradient sky-400 → blue-500 cho nút xác nhận
 * - frontend-design.md §2.4: Semantic colors (emerald/amber/red cho Price Impact)
 * - frontend-design.md §3: font-mono cho số lượng, address
 *
 * Kiến trúc [C4-Component]:
 * - Thuộc lớp UI Component, được gọi từ Page Home (Swap Page)
 * - Nhận props từ SwapPage: tokenIn, tokenOut, amountIn, amountOut, slippage, priceImpact
 * - onConfirm callback → Page Home xử lý TX thực tế
 *
 * Luồng UX [UC-03]:
 * 1. User nhấn "Hoán đổi" trên Swap Page
 * 2. Modal mở, hiển thị tóm tắt giao dịch để user review
 * 3. User nhấn "Xác nhận Hoán đổi" → onConfirm() → Swap Page gửi TX on-chain
 * 4. Modal đóng tự động, Toast notification hiện lên [FR-01.5]
 */

import * as React from "react";
import { ArrowDownIcon, InfoIcon, Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TokenInfo } from "@/types/token";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmSwapDialogProps {
  /** Trạng thái mở/đóng dialog */
  open: boolean;
  /** Callback khi dialog thay đổi trạng thái */
  onOpenChange: (open: boolean) => void;

  /** [FR-01.2] Token nguồn */
  tokenIn: TokenInfo;
  /** [FR-01.2] Token đích */
  tokenOut: TokenInfo;
  /** [FR-01.3] Số lượng token nguồn (display string) */
  amountIn: string;
  /** [FR-01.3] Số lượng token đích ước tính (display string) */
  amountOut: string;

  /** [FR-01.4] Slippage tolerance (%, ví dụ "0.5") */
  slippage: string;
  /** [FR-01.4] Price Impact (%, số) */
  priceImpact: number;
  /** [FR-01.4] Minimum Received (display string) */
  minimumReceived: string | null;
  /** [FR-01.4] Exchange rate display */
  exchangeRate: string | null;

  /** Đang xử lý TX (disable nút confirm) */
  isLoading?: boolean;

  /** [UC-03] Callback khi user xác nhận — Page Home gửi TX on-chain */
  onConfirm: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * [FR-01.4] Màu Price Impact theo ngưỡng
 * [frontend-design.md §2.4] emerald < 1%, amber 1-5%, red > 5%
 */
function getPriceImpactClass(impact: number): string {
  if (impact < 1) return "text-emerald-500";
  if (impact <= 5) return "text-amber-500";
  return "text-red-600 font-bold";
}

/**
 * [FR-01.4] Label badge Price Impact
 */
function getPriceImpactBadgeClass(impact: number): string {
  if (impact < 1) return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
  if (impact <= 5) return "bg-amber-500/10 text-amber-600 border-amber-200";
  return "bg-red-500/10 text-red-600 border-red-200";
}

// ─── Sub-component: TokenAmountRow ────────────────────────────────────────────

/**
 * [FR-01.3] Hiển thị 1 hàng Token + Amount trong Dialog
 * [frontend-design.md §3] font-mono cho amount
 */
function TokenAmountRow({
  token,
  amount,
  label,
  highlight,
}: {
  token: TokenInfo;
  amount: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border",
        highlight
          ? "bg-sky-50/60 border-sky-200"
          : "bg-slate-50 border-slate-100",
      )}
    >
      {/* Left: Label + Token info */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          {/* Token icon fallback */}
          {token.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={token.logoUrl}
              alt={token.symbol}
              className="size-5 rounded-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="size-5 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">
                {token.symbol.charAt(0)}
              </span>
            </div>
          )}
          <span className="font-semibold text-slate-900 text-sm">{token.symbol}</span>
        </div>
      </div>

      {/* Right: Amount [frontend-design.md §3] font-mono */}
      <span
        className={cn(
          "text-xl font-semibold font-mono",
          highlight ? "text-slate-900" : "text-slate-700",
        )}
      >
        {amount}
      </span>
    </div>
  );
}

// ─── Sub-component: InfoRow ───────────────────────────────────────────────────

/**
 * [FR-01.4] Hàng thông tin chi tiết giao dịch
 */
function InfoRow({
  label,
  value,
  valueClass,
  tooltip,
}: {
  label: string;
  value: string;
  valueClass?: string;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">{label}</span>
        {tooltip && (
          <span title={tooltip} className="cursor-help">
            <InfoIcon className="size-3 text-slate-400" />
          </span>
        )}
      </div>
      {/* [frontend-design.md §3] font-mono cho giá trị số */}
      <span className={cn("text-xs font-mono font-medium text-slate-700", valueClass)}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * [FR-01.4] [UC-03] ConfirmSwapDialog
 *
 * Modal xác nhận hoán đổi hiển thị:
 * - Token nguồn → Token đích + số lượng
 * - Price Impact (màu semantic)
 * - Minimum Received
 * - Slippage Tolerance
 * - Exchange Rate
 * - Nút "Xác nhận Hoán đổi" gradient
 */
export function ConfirmSwapDialog({
  open,
  onOpenChange,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  slippage,
  priceImpact,
  minimumReceived,
  exchangeRate,
  isLoading = false,
  onConfirm,
}: ConfirmSwapDialogProps) {
  const impactClass = getPriceImpactClass(priceImpact);
  const impactBadgeClass = getPriceImpactBadgeClass(priceImpact);
  const isHighImpact = priceImpact > 5;

  const handleConfirm = () => {
    onConfirm();
    // Không đóng dialog ngay — để SwapPage tự đóng sau khi TX gửi thành công
    // (hoặc để lỗi hiển thị Toast)
  };

  return (
    /*
     * [frontend-design.md §4] Dialog shadcn/ui với Fade/Zoom animation
     * data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
     * data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
     */
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl p-0 max-w-sm overflow-hidden"
        showCloseButton={!isLoading}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Xác nhận Hoán đổi
          </DialogTitle>
        </DialogHeader>

        {/* ── Token Flow: In → Out ── */}
        {/* [FR-01.3] Hiển thị số lượng token nguồn và đích */}
        <div className="px-5 pt-4 space-y-1.5">
          {/* Token nguồn (From) */}
          <TokenAmountRow
            token={tokenIn}
            amount={amountIn}
            label="Từ"
          />

          {/* Arrow xuống */}
          <div className="flex justify-center">
            <div className="rounded-full bg-white border border-slate-200 p-1 shadow-sm">
              <ArrowDownIcon className="size-3.5 text-slate-400" />
            </div>
          </div>

          {/* Token đích (To) — highlight xanh */}
          <TokenAmountRow
            token={tokenOut}
            amount={amountOut}
            label="Đến (ước tính)"
            highlight
          />
        </div>

        {/* ── Thông tin chi tiết [FR-01.4] ── */}
        <div className="mx-5 mt-3 px-3 py-1 rounded-xl bg-slate-50/80 border border-slate-100 divide-y divide-slate-100">
          {/* Price Impact [FR-01.4] */}
          <InfoRow
            label="Price Impact"
            value={priceImpact > 0 ? `${priceImpact.toFixed(2)}%` : "<0.01%"}
            valueClass={impactClass}
            tooltip="Ảnh hưởng đến giá pool do giao dịch của bạn"
          />

          {/* Minimum Received [FR-01.4] */}
          {minimumReceived && (
            <InfoRow
              label="Nhận tối thiểu"
              value={`${minimumReceived} ${tokenOut.symbol}`}
              tooltip={`Nếu giá trượt quá ${slippage}%, giao dịch sẽ revert`}
            />
          )}

          {/* Slippage [FR-01.4] */}
          <InfoRow
            label="Slippage Tolerance"
            value={`${slippage}%`}
            valueClass={parseFloat(slippage) > 5 ? "text-amber-500" : undefined}
          />

          {/* Exchange Rate [FR-01.4] */}
          {exchangeRate && (
            <InfoRow label="Tỷ giá" value={exchangeRate} />
          )}
        </div>

        {/* ── Cảnh báo Price Impact cao ── */}
        {/* [frontend-design.md §2.4] Warning: amber/red */}
        {isHighImpact && (
          <div
            className={cn(
              "mx-5 mt-2 px-3 py-2 rounded-xl border flex items-start gap-2",
              impactBadgeClass,
            )}
          >
            <InfoIcon className="size-3.5 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Price Impact cao ({priceImpact.toFixed(2)}%)</strong> — Bạn có thể nhận
              được ít hơn đáng kể so với ước tính. Cân nhắc giảm số lượng hoặc tăng slippage.
            </p>
          </div>
        )}

        {/* ── Footer Buttons ── */}
        <div className="px-5 pt-3 pb-5 flex flex-col gap-2 mt-1">
          {/* Nút xác nhận chính [UC-03] */}
          {/*
           * [frontend-design.md §2.2] gradient sky-400 → blue-500
           * [frontend-design.md §4] hover:scale-[1.02] active:scale-[0.98] hover:shadow-blue-500/25
           */}
          <button
            id="confirm-swap-btn"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-white transition-all duration-300",
              isLoading
                ? "bg-gradient-to-r from-sky-400 to-blue-500 opacity-70 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-400 to-blue-500 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/25",
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                {/* [frontend-design.md §4] Loader2 animate-spin */}
                <Loader2Icon className="size-4 animate-spin" />
                Đang hoán đổi...
              </span>
            ) : (
              "Xác nhận Hoán đổi"
            )}
          </button>

          {/* Nút hủy */}
          {!isLoading && (
            <button
              onClick={() => onOpenChange(false)}
              className="w-full h-10 rounded-xl font-medium text-slate-500 text-sm bg-slate-50 hover:bg-slate-100 transition-colors duration-200 border border-slate-200"
            >
              Hủy
            </button>
          )}
        </div>

        {/* Disclaimer nhỏ */}
        <p className="px-5 pb-4 text-xs text-slate-400 text-center -mt-2">
          Giao dịch sẽ revert nếu giá thay đổi quá{" "}
          <span className="font-mono">{slippage}%</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}
