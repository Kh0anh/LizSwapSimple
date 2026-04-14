"use client";

/**
 * ConfirmLiquidityDialog — Modal xác nhận Thêm Thanh Khoản
 * Task 4.6: Confirmation Dialog (Modal xác nhận)
 *
 * Yêu cầu liên quan:
 * - [FR-02.3] Approve token nếu chưa có allowance trước khi add liquidity
 * - [FR-02.4] Hiển thị Token A, Token B, LP Token estimate, Share of Pool
 * - frontend-design.md §4: Fade/Zoom animation shadcn Dialog
 * - frontend-design.md §2.1: bg-white card, border-slate-200
 * - frontend-design.md §2.2: gradient sky-400 → blue-500
 * - frontend-design.md §3: font-mono cho số lượng
 *
 * Kiến trúc [C4-Component]:
 * - Thuộc lớp UI Component, được gọi từ Pool Page (Tab Add Liquidity)
 * - Nhận props: tokenA, tokenB, amountA, amountB, shareText, lpEstimate
 * - onConfirm callback → Pool Page xử lý approve + addLiquidity TX
 *
 * Luồng UX [UC-04]:
 * 1. User nhấn "Thêm Thanh Khoản" trên Pool Page
 * 2. Modal mở, hiển thị tóm tắt: số lượng 2 token, tỷ lệ pool, LP tokens ước tính
 * 3. User nhấn "Xác nhận Thêm Thanh khoản" → onConfirm() → Pool Page gửi TX
 * 4. Modal đóng tự động, Toast notification hiện lên [FR-02.4]
 */

import * as React from "react";
import { PlusIcon, InfoIcon, Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TokenInfo } from "@/types/token";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmLiquidityDialogProps {
  /** Trạng thái mở/đóng dialog */
  open: boolean;
  /** Callback khi dialog thay đổi trạng thái */
  onOpenChange: (open: boolean) => void;

  /** [FR-02.1] Token A trong cặp thanh khoản */
  tokenA: TokenInfo;
  /** [FR-02.1] Token B trong cặp thanh khoản */
  tokenB: TokenInfo;
  /** [FR-02.2] Số lượng Token A sẽ nạp (display string) */
  amountA: string;
  /** [FR-02.2] Số lượng Token B sẽ nạp (display string) */
  amountB: string;

  /** [FR-02.4] Share of Pool ước tính (ví dụ "~0.12%") */
  shareText: string;
  /** [FR-02.4] LP Tokens ước tính nhận được (display string, có thể null) */
  lpEstimate: string | null;
  /** Exchange rate display (ví dụ "1 USDT = 1.0002 DAI") */
  exchangeRate: string;

  /** Đang xử lý TX (disable nút confirm) */
  isLoading?: boolean;
  /** Mô tả bước đang thực hiện (approve / add) */
  loadingStep?: string;

  /** [UC-04] Callback khi user xác nhận — Pool Page gửi TX on-chain */
  onConfirm: () => void;
}

// ─── Sub-component: TokenAmountRow ────────────────────────────────────────────

/**
 * [FR-02.2] Hàng hiển thị Token + Amount trong Confirm Liquidity Dialog
 * [frontend-design.md §3] font-mono cho amount
 */
function LiquidityTokenRow({
  token,
  amount,
}: {
  token: TokenInfo;
  amount: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
      {/* Token identity */}
      <div className="flex items-center gap-2">
        {token.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={token.logoUrl}
            alt={token.symbol}
            className="size-6 rounded-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="size-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">
              {token.symbol.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <div className="font-semibold text-slate-900 text-sm leading-tight">
            {token.symbol}
          </div>
          <div className="text-xs text-slate-400 truncate max-w-[100px]">{token.name}</div>
        </div>
      </div>

      {/* Amount [frontend-design.md §3] font-mono */}
      <span className="text-base font-semibold font-mono text-slate-900">{amount}</span>
    </div>
  );
}

// ─── Sub-component: InfoRow ───────────────────────────────────────────────────

/**
 * [FR-02.4] Hàng thông tin tóm tắt trong dialog
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
      <span className={cn("text-xs font-mono font-medium text-slate-700", valueClass)}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * [FR-02.4] [UC-04] ConfirmLiquidityDialog
 *
 * Modal xác nhận thêm thanh khoản hiển thị:
 * - Token A + Token B + số lượng mỗi token
 * - LP Tokens ước tính nhận được
 * - Share of Pool
 * - Exchange Rate
 * - Nút "Xác nhận Thêm Thanh khoản" gradient
 */
export function ConfirmLiquidityDialog({
  open,
  onOpenChange,
  tokenA,
  tokenB,
  amountA,
  amountB,
  shareText,
  lpEstimate,
  exchangeRate,
  isLoading = false,
  loadingStep,
  onConfirm,
}: ConfirmLiquidityDialogProps) {
  return (
    /*
     * [frontend-design.md §4] Dialog shadcn/ui với Fade/Zoom animation
     * Sử dụng data-open:animate-in data-open:zoom-in-95 data-closed:zoom-out-95
     */
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl p-0 max-w-sm overflow-hidden"
        showCloseButton={!isLoading}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Xác nhận Thêm Thanh khoản
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Bạn sẽ cung cấp thanh khoản cho pool{" "}
            <span className="font-semibold text-slate-700">
              {tokenA.symbol}/{tokenB.symbol}
            </span>
          </p>
        </DialogHeader>

        {/* ── Số lượng 2 Token [FR-02.2] ── */}
        <div className="px-5 pt-4 space-y-2">
          {/* Token A */}
          <LiquidityTokenRow token={tokenA} amount={amountA} />

          {/* Plus separator */}
          <div className="flex justify-center">
            <div className="rounded-full bg-white border border-slate-200 p-1 shadow-sm">
              <PlusIcon className="size-3.5 text-slate-400" />
            </div>
          </div>

          {/* Token B */}
          <LiquidityTokenRow token={tokenB} amount={amountB} />
        </div>

        {/* ── LP Tokens Section [FR-02.4] ── */}
        {lpEstimate && (
          <div className="mx-5 mt-3 flex items-center justify-between p-3 rounded-xl bg-sky-50/60 border border-sky-200">
            <div className="flex items-center gap-1.5">
              {/* LP Token icon kết hợp 2 token */}
              <div className="flex -space-x-1.5">
                <div className="size-5 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 border-2 border-white flex items-center justify-center">
                  <span className="text-[7px] font-bold text-white">
                    {tokenA.symbol.charAt(0)}
                  </span>
                </div>
                <div className="size-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center">
                  <span className="text-[7px] font-bold text-white">
                    {tokenB.symbol.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">
                  LP Token nhận được
                </div>
                <div className="text-xs text-slate-500">
                  {tokenA.symbol}/{tokenB.symbol}
                </div>
              </div>
            </div>
            {/* [frontend-design.md §3] font-mono cho số LP Token */}
            <span className="text-base font-semibold font-mono text-slate-900">
              ≈ {lpEstimate}
            </span>
          </div>
        )}

        {/* ── Thông tin chi tiết [FR-02.4] ── */}
        <div className="mx-5 mt-3 px-3 py-1 rounded-xl bg-slate-50/80 border border-slate-100 divide-y divide-slate-100">
          {/* Share of Pool [FR-02.4] */}
          <InfoRow
            label="Share of Pool"
            value={shareText}
            valueClass="text-sky-600"
            tooltip="Tỷ lệ phần trăm bạn sở hữu trên tổng pool sau khi thêm"
          />

          {/* Exchange Rate [FR-02.2] */}
          {exchangeRate !== "--" && (
            <InfoRow label="Tỷ giá" value={exchangeRate} />
          )}

          {/* Note về LP Token */}
          <div className="py-1.5">
            <p className="text-xs text-slate-400 leading-relaxed">
              LP Token đại diện cho phần đóng góp của bạn trong pool. Rút thanh khoản
              bất cứ lúc nào để lấy lại token.
            </p>
          </div>
        </div>

        {/* ── Loading step indicator ── */}
        {/* [frontend-design.md §4] Loading State */}
        {isLoading && loadingStep && (
          <div className="mx-5 mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200">
            <Loader2Icon className="size-4 animate-spin text-sky-500 shrink-0" />
            <span className="text-xs text-sky-700 font-medium">{loadingStep}</span>
          </div>
        )}

        {/* ── Footer Buttons ── */}
        <div className="px-5 pt-3 pb-5 flex flex-col gap-2 mt-1">
          {/* Nút xác nhận chính [UC-04] */}
          {/*
           * [frontend-design.md §2.2] gradient sky-400 → blue-500
           * [frontend-design.md §4] hover:scale-[1.02] active:scale-[0.98]
           */}
          <button
            id="confirm-add-liquidity-btn"
            onClick={onConfirm}
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
                Đang xử lý...
              </span>
            ) : (
              "Xác nhận Thêm Thanh khoản"
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
      </DialogContent>
    </Dialog>
  );
}
