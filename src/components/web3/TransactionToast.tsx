"use client";

/**
 * TransactionToast — Hệ thống thông báo giao dịch LizSwapSimple DEX
 * Task 4.5: Transaction Toast/Notification System
 *
 * Yêu cầu liên quan:
 * - [FR-01.5] Feedback TX Swap: Thông báo trạng thái giao dịch hoán đổi
 * - [FR-02.4] Feedback Add Liquidity: Phản hồi kết quả thêm thanh khoản
 * - [FR-03.2] Feedback Remove Liquidity: Phản hồi kết quả rút thanh khoản
 * - [UC-02] Feedback Approve: Thông báo kết quả phê duyệt token
 * - frontend-design.md §4: Loading State, Transitions
 * - frontend-design.md §2.4: Semantic Colors (Success/Error/Warning)
 *
 * Kiến trúc:
 * - Sử dụng Sonner (đã cài ở Task 3.6) qua hàm toast() để trigger notification
 * - <Toaster /> đã mount trong layout.tsx (Task 3.6)
 * - showTxToast() là entry point duy nhất — gọi từ mọi nơi trong app
 *
 * Luồng sử dụng điển hình [UC-03]:
 * 1. User submit → showTxToast("pending")
 * 2. ethers.js trả về tx.hash → showTxToast("success", tx.hash)
 * 3. Lỗi catch → showTxToast("error", undefined, err.message)
 */

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  ExternalLinkIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Trạng thái giao dịch
 * - pending: Đang chờ xác nhận trên BSC
 * - success: Đã xác nhận thành công
 * - error:   Thất bại (revert, slippage, user reject...)
 */
export type TxStatus = "pending" | "success" | "error";

/**
 * Options cho showTxToast
 */
export interface TxToastOptions {
  /** [FR-01.5] Mô tả hành động (ví dụ: "Swap USDT → DAI", "Add Liquidity") */
  description?: string;
  /** [FR-01.5] txHash để tạo link BSCScan (chỉ có khi success/pending confirm) */
  txHash?: string;
  /** [FR-01.5] Error message hiển thị khi status = "error" */
  errorMessage?: string;
}

// ─── BSCScan URL Helper ───────────────────────────────────────────────────────

/**
 * Lấy BSCScan URL cho transaction hash
 * [NFR-03] Configurable: đọc từ env var NEXT_PUBLIC_CHAIN_ID
 * - chainId 97 → BSC Testnet
 * - chainId 56 → BSC Mainnet
 */
function getBscScanTxUrl(txHash: string): string {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "97";
  const baseUrl =
    chainId === "56"
      ? "https://bscscan.com"
      : "https://testnet.bscscan.com";
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Rút gọn txHash để hiển thị (0x1234...abcd)
 * [frontend-design.md §3] font-mono cho address/hash
 */
function shortenHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

// ─── Toast Content Components ─────────────────────────────────────────────────

/**
 * [FR-01.5] BSCScan Link Component
 * [frontend-design.md §2.2] text-sky-500 underline cho external link
 */
function BscScanLink({ txHash }: { txHash: string }) {
  return (
    <a
      href={getBscScanTxUrl(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sky-500 underline underline-offset-2 text-xs font-mono hover:text-sky-600 transition-colors duration-200"
    >
      {shortenHash(txHash)}
      <ExternalLinkIcon className="size-3" />
    </a>
  );
}

/**
 * [FR-01.5] Pending Toast Content
 * [frontend-design.md §4] animate-spin cho Loader2 icon
 */
function PendingToastContent({
  description,
  txHash,
}: {
  description?: string;
  txHash?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* [frontend-design.md §4] Loading State: Loader2 animate-spin */}
        <Loader2Icon className="size-4 animate-spin text-sky-500 shrink-0" />
        <span className="text-sm font-medium text-slate-900">
          Giao dịch đang xử lý...
        </span>
      </div>
      {description && (
        <p className="text-xs text-slate-500 pl-6">{description}</p>
      )}
      {txHash && (
        <div className="pl-6">
          <BscScanLink txHash={txHash} />
        </div>
      )}
    </div>
  );
}

/**
 * [FR-01.5] Success Toast Content
 * [frontend-design.md §2.4] text-emerald-500 cho success icon
 */
function SuccessToastContent({
  description,
  txHash,
}: {
  description?: string;
  txHash?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* [frontend-design.md §2.4] Success: emerald-500 */}
        <CheckCircleIcon className="size-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-medium text-slate-900">
          Giao dịch thành công!
        </span>
      </div>
      {description && (
        <p className="text-xs text-slate-500 pl-6">{description}</p>
      )}
      {txHash && (
        <div className="pl-6 flex items-center gap-1">
          <span className="text-xs text-slate-400">Xem trên BSCScan:</span>
          <BscScanLink txHash={txHash} />
        </div>
      )}
    </div>
  );
}

/**
 * [FR-01.5] Error Toast Content
 * [frontend-design.md §2.4] text-red-500 cho error icon
 */
function ErrorToastContent({
  description,
  errorMessage,
}: {
  description?: string;
  errorMessage?: string;
}) {
  // Rút gọn message lỗi nếu quá dài (ethers.js lỗi thường dài)
  const displayError = errorMessage
    ? errorMessage.length > 80
      ? errorMessage.slice(0, 80) + "..."
      : errorMessage
    : "Vui lòng thử lại";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* [frontend-design.md §2.4] Error: red-500 */}
        <XCircleIcon className="size-4 text-red-500 shrink-0" />
        <span className="text-sm font-medium text-slate-900">
          Giao dịch thất bại
        </span>
      </div>
      {description && (
        <p className="text-xs text-slate-500 pl-6">{description}</p>
      )}
      <p className="text-xs text-red-400 pl-6 break-words">{displayError}</p>
    </div>
  );
}

// ─── Main Utility: showTxToast ────────────────────────────────────────────────

/**
 * showTxToast — Hàm chính hiển thị Transaction Toast Notification
 *
 * Sử dụng:
 * ```tsx
 * // Bước 1: User submit giao dịch
 * showTxToast("pending", { description: "Swap USDT → DAI" });
 *
 * // Bước 2a: TX thành công
 * showTxToast("success", { txHash: tx.hash, description: "Swap USDT → DAI" });
 *
 * // Bước 2b: TX thất bại
 * showTxToast("error", { errorMessage: err.message, description: "Swap USDT → DAI" });
 * ```
 *
 * [FR-01.5] Dùng cho TX Swap (Task 4.2)
 * [FR-02.4] Dùng cho Add Liquidity (Task 4.3)
 * [FR-03.2] Dùng cho Remove Liquidity (Task 4.4)
 * [UC-02]   Dùng cho Token Approval
 *
 * @param status - Trạng thái: "pending" | "success" | "error"
 * @param options - txHash, description, errorMessage
 * @returns toast ID (có thể dùng để dismiss programmatically)
 */
export function showTxToast(
  status: TxStatus,
  options: TxToastOptions = {}
): string | number {
  const { description, txHash, errorMessage } = options;

  // [frontend-design.md §4] duration 8s — đủ để đọc TX hash
  const TOAST_DURATION = 8000;

  switch (status) {
    /**
     * [FR-01.5] Pending: Toast với Loader2 animate-spin
     * Styling: bg mặc định (trắng) — không có semantic color mạnh
     */
    case "pending":
      return toast.custom(
        () => (
          <div
            className={[
              // Base toast style
              "w-full max-w-sm rounded-xl border shadow-sm px-4 py-3",
              // Không có màu semantic mạnh cho pending — neutral
              "bg-white border-slate-200",
              // [frontend-design.md §4] transition-all
              "transition-all duration-300",
            ].join(" ")}
          >
            <PendingToastContent description={description} txHash={txHash} />
          </div>
        ),
        {
          duration: TOAST_DURATION,
        }
      );

    /**
     * [FR-01.5] Success: bg-emerald-500/10 border-emerald-200
     * [frontend-design.md §2.4] Màu thành công: emerald
     */
    case "success":
      return toast.custom(
        () => (
          <div
            className={[
              "w-full max-w-sm rounded-xl border shadow-sm px-4 py-3",
              // [frontend-design.md §2.4] Success: bg-emerald-500/10 border-emerald-200
              "bg-emerald-500/10 border-emerald-200",
              "transition-all duration-300",
            ].join(" ")}
          >
            <SuccessToastContent description={description} txHash={txHash} />
          </div>
        ),
        {
          duration: TOAST_DURATION,
        }
      );

    /**
     * [FR-01.5] Error: bg-red-500/10 border-red-200
     * [frontend-design.md §2.4] Màu lỗi: red
     */
    case "error":
      return toast.custom(
        () => (
          <div
            className={[
              "w-full max-w-sm rounded-xl border shadow-sm px-4 py-3",
              // [frontend-design.md §2.4] Error: bg-red-500/10 border-red-200
              "bg-red-500/10 border-red-200",
              "transition-all duration-300",
            ].join(" ")}
          >
            <ErrorToastContent
              description={description}
              errorMessage={errorMessage}
            />
          </div>
        ),
        {
          duration: TOAST_DURATION,
        }
      );

    default:
      return toast("Thông báo không xác định");
  }
}

/**
 * showApproveToast — Wrapper ngắn gọn cho [UC-02] Token Approval flow
 *
 * Sử dụng:
 * ```tsx
 * // Đang approve
 * showApproveToast("pending", "USDT");
 * // Approve thành công
 * showApproveToast("success", "USDT", tx.hash);
 * // Approve thất bại
 * showApproveToast("error", "USDT", undefined, err.message);
 * ```
 *
 * [UC-02] Phê duyệt Token (Approve) — sub-step trước mọi Swap/Liquidity TX
 */
export function showApproveToast(
  status: TxStatus,
  tokenSymbol: string,
  txHash?: string,
  errorMessage?: string
): string | number {
  const descriptions: Record<TxStatus, string> = {
    pending: `Đang phê duyệt ${tokenSymbol}...`,
    success: `Đã phê duyệt ${tokenSymbol} thành công`,
    error: `Không thể phê duyệt ${tokenSymbol}`,
  };

  return showTxToast(status, {
    description: descriptions[status],
    txHash,
    errorMessage,
  });
}

/**
 * showSwapToast — Wrapper ngắn gọn cho [UC-03] Swap TX flow
 *
 * [UC-03] Hoán đổi Token — Swap Page (Task 4.2)
 */
export function showSwapToast(
  status: TxStatus,
  fromSymbol: string,
  toSymbol: string,
  txHash?: string,
  errorMessage?: string
): string | number {
  const descriptions: Record<TxStatus, string> = {
    pending: `Đang hoán đổi ${fromSymbol} → ${toSymbol}...`,
    success: `Hoán đổi ${fromSymbol} → ${toSymbol} thành công`,
    error: `Hoán đổi ${fromSymbol} → ${toSymbol} thất bại`,
  };

  return showTxToast(status, {
    description: descriptions[status],
    txHash,
    errorMessage,
  });
}

/**
 * showLiquidityToast — Wrapper ngắn gọn cho [UC-04]/[UC-05] Liquidity TX flow
 *
 * [UC-04] Thêm thanh khoản — Pool Page (Task 4.3)
 * [UC-05] Rút thanh khoản — Pool Page (Task 4.4)
 */
export function showLiquidityToast(
  status: TxStatus,
  action: "add" | "remove",
  tokenASymbol: string,
  tokenBSymbol: string,
  txHash?: string,
  errorMessage?: string
): string | number {
  const actionLabel = action === "add" ? "Thêm" : "Rút";
  const descriptions: Record<TxStatus, string> = {
    pending: `Đang ${actionLabel.toLowerCase()} thanh khoản ${tokenASymbol}/${tokenBSymbol}...`,
    success: `${actionLabel} thanh khoản ${tokenASymbol}/${tokenBSymbol} thành công`,
    error: `${actionLabel} thanh khoản ${tokenASymbol}/${tokenBSymbol} thất bại`,
  };

  return showTxToast(status, {
    description: descriptions[status],
    txHash,
    errorMessage,
  });
}
