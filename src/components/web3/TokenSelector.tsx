"use client";

/**
 * TokenSelector Component — LizSwapSimple DEX
 * Task 4.1: TokenSelector Component
 *
 * Yêu cầu liên quan:
 * - [FR-01.2] Chọn Token nguồn/đích để Swap (Swap Page)
 * - [FR-02.1] Chọn cặp Token để cung cấp thanh khoản (Pool Page)
 *
 * Kiến trúc [C4-Component]:
 * - Thuộc lớp UI Component (shadcn/ui Dialog)
 * - Đọc danh sách token từ tokenList.json (static config)
 * - Gọi swapService.getTokenBalance() để hiển thị số dư [UC-02 pre-check]
 *
 * Design:
 * - Button trigger: rounded-xl bg-slate-100 hover:bg-slate-200 [frontend-design.md §4]
 * - Dialog list: rounded-2xl [frontend-design.md §4]
 * - Balance: font-mono text-sm text-slate-500 [frontend-design.md §3]
 * - Token icon: placeholder fallback nếu logoUrl không load
 *
 * ⚠️ swapService stub: Task 3.5 (Huy) chưa merge — sử dụng stub inline
 * Khi Task 3.5 merge vào develop, thay stub bằng import thật.
 */

import * as React from "react";
import { ChevronDownIcon, SearchIcon, WalletIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { TokenInfo } from "@/types/token";
import tokenList from "@/services/contracts/tokenList.json";

// ─── Props ──────────────────────────────────────────────────────────────────

/**
 * Props của TokenSelector
 * [FR-01.2] selectedToken: token hiện tại đang chọn
 * [FR-01.2] onSelect: callback khi người dùng chọn token mới
 * [FR-01.2] disabledToken: address của token đã chọn ở ô khác (tránh chọn trùng)
 * label: nhãn hiển thị phía trên button (tùy chọn)
 */
interface TokenSelectorProps {
  selectedToken: TokenInfo | null;
  onSelect: (token: TokenInfo) => void;
  disabledToken?: string;
  label?: string;
  /** [UC-01] Địa chỉ ví kết nối — dùng để gọi getTokenBalance */
  walletAddress?: string;
}

// ─── Stub Balance Fetcher ────────────────────────────────────────────────────

/**
 * [FR-01.2] Stub cho swapService.getTokenBalance()
 *
 * ⚠️ STUB: Task 3.5 (swapService) chưa merge vào develop.
 * Trả về "—" khi chưa có swapService thật.
 * Sau khi Task 3.5 merge: thay bằng import { swapService } from "@/services/swapService"
 * và gọi swapService.getTokenBalance(tokenAddress, walletAddress)
 *
 * @param _tokenAddress - Địa chỉ contract token
 * @param _walletAddress - Địa chỉ ví người dùng
 */
async function getTokenBalance(
  _tokenAddress: string,
  _walletAddress: string
): Promise<string> {
  // TODO [Task 3.5]: Thay bằng swapService.getTokenBalance(tokenAddress, walletAddress)
  // import { swapService } from "@/services/swapService";
  // return swapService.getTokenBalance(_tokenAddress, _walletAddress);
  return "—";
}

// ─── TokenIcon ───────────────────────────────────────────────────────────────

/**
 * [FR-01.2] Icon hiển thị cho từng token
 * Fallback: hiển thị chữ cái đầu của symbol nếu logoUrl lỗi
 * [frontend-design.md §2.2] Màu gradient primary cho fallback icon
 */
function TokenIcon({
  token,
  size = "md",
}: {
  token: TokenInfo;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "size-5 text-xs",
    md: "size-8 text-sm",
    lg: "size-10 text-base",
  }[size];

  const [imgError, setImgError] = React.useState(false);

  if (token.logoUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={token.logoUrl}
        alt={token.symbol}
        onError={() => setImgError(true)}
        className={cn("rounded-full object-cover", sizeClass)}
      />
    );
  }

  // [frontend-design.md §2.2] Fallback: gradient bg với chữ cái đầu symbol
  return (
    <div
      className={cn(
        "rounded-full gradient-primary flex items-center justify-center font-bold text-white shrink-0",
        sizeClass
      )}
    >
      {token.symbol.charAt(0)}
    </div>
  );
}

// ─── TokenListItem ────────────────────────────────────────────────────────────

/**
 * [FR-01.2] Item trong danh sách token — hiển thị icon, symbol, name, balance
 * [frontend-design.md §4] transition-colors duration-200 khi hover
 * [frontend-design.md §3] font-mono cho balance — tabular numbers
 */
function TokenListItem({
  token,
  balance,
  isDisabled,
  isSelected,
  onClick,
}: {
  token: TokenInfo;
  balance: string;
  isDisabled: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        // [frontend-design.md §4] transition-colors duration-200
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
        "transition-colors duration-200",
        // Base hover state [frontend-design.md §2.1]
        "hover:bg-slate-100",
        // Selected state [frontend-design.md §2.2] primary accent
        isSelected && "bg-sky-50 ring-1 ring-sky-200",
        // Disabled state
        isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
      )}
    >
      {/* Token Icon */}
      <TokenIcon token={token} size="md" />

      {/* Token Info */}
      <div className="flex-1 text-left min-w-0">
        {/* [frontend-design.md §2] text-slate-900 chính, text-slate-500 phụ */}
        <div className="font-semibold text-slate-900 text-sm leading-tight">
          {token.symbol}
        </div>
        <div className="text-xs text-slate-500 truncate">{token.name}</div>
      </div>

      {/* Balance [frontend-design.md §3] font-mono, tabular-nums */}
      <div className="text-right shrink-0">
        {balance === "—" ? (
          // Chưa kết nối ví hoặc đang load
          <span className="text-xs text-slate-400 font-mono">—</span>
        ) : (
          <span className="text-sm text-slate-600 font-mono font-numbers">
            {balance}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── TokenSelector (Main Component) ──────────────────────────────────────────

/**
 * [FR-01.2] [FR-02.1] TokenSelector — Component chọn token chính
 *
 * Luồng:
 * 1. Hiển thị button trigger với token đang chọn (hoặc "Select token")
 * 2. Click → mở Dialog danh sách token
 * 3. Người dùng lọc theo search, click item → onSelect callback
 * 4. Dialog tự đóng sau khi chọn
 */
export function TokenSelector({
  selectedToken,
  onSelect,
  disabledToken,
  label,
  walletAddress,
}: TokenSelectorProps) {
  // State quản lý dialog open/close
  const [open, setOpen] = React.useState(false);
  // [FR-01.2] State search filter token
  const [search, setSearch] = React.useState("");
  // Balance map: address → formatted balance string
  const [balances, setBalances] = React.useState<Record<string, string>>({});

  // Cast tokenList.json sang TokenInfo[]
  const tokens = tokenList as TokenInfo[];

  // ── Load balances khi dialog mở và ví đã kết nối ──────────────────────────
  React.useEffect(() => {
    if (!open || !walletAddress) return;

    /**
     * [FR-01.2] Tải số dư toàn bộ token trong danh sách
     * Chạy parallel fetch cho tất cả token
     * [UC-02] Pre-check: cần biết balance trước khi Approve/Swap
     */
    const loadBalances = async () => {
      const entries = await Promise.all(
        tokens.map(async (token) => {
          try {
            const bal = await getTokenBalance(token.address, walletAddress);
            return [token.address, bal] as const;
          } catch {
            return [token.address, "—"] as const;
          }
        })
      );
      setBalances(Object.fromEntries(entries));
    };

    loadBalances();
  }, [open, walletAddress, tokens]);

  // ── Filter token theo search query ────────────────────────────────────────
  /**
   * [FR-01.2] Lọc token theo symbol hoặc name (case-insensitive)
   * Cho phép search "usdt", "dai", "bnb" etc.
   */
  const filteredTokens = React.useMemo(() => {
    if (!search.trim()) return tokens;
    const q = search.toLowerCase();
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [tokens, search]);

  // ── Handler chọn token ────────────────────────────────────────────────────
  const handleSelect = (token: TokenInfo) => {
    // [FR-01.2] Gọi onSelect callback với token được chọn
    onSelect(token);
    // Đóng dialog và reset search
    setOpen(false);
    setSearch("");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Label (tuỳ chọn) */}
      {label && (
        <span className="text-xs font-medium text-slate-500 mb-1 block">
          {label}
        </span>
      )}

      {/* ── Trigger Button ─────────────────────────────────────────────── */}
      {/**
       * [FR-01.2] Button hiển thị token đang chọn
       * Styling theo task-4.1.md: rounded-xl bg-slate-100 hover:bg-slate-200
       * [frontend-design.md §4] transition-colors duration-200
       */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          // Base style theo task-4.1.md spec
          "rounded-xl bg-slate-100 hover:bg-slate-200",
          "px-3 py-2 transition-colors duration-200",
          // Layout
          "flex items-center gap-2 shrink-0",
          // [frontend-design.md §4] hover effect
          "active:scale-[0.98]"
        )}
      >
        {selectedToken ? (
          // Token đã chọn: hiển thị icon + symbol
          <>
            <TokenIcon token={selectedToken} size="sm" />
            <span className="font-semibold text-slate-900 text-sm">
              {selectedToken.symbol}
            </span>
          </>
        ) : (
          // Chưa chọn: placeholder text
          <span className="text-slate-500 text-sm font-medium">
            Select token
          </span>
        )}
        {/* Chevron icon */}
        <ChevronDownIcon className="size-4 text-slate-400 ml-0.5" />
      </button>

      {/* ── Dialog chọn token ──────────────────────────────────────────── */}
      {/**
       * [FR-01.2] Dialog danh sách token
       * Styling: rounded-2xl [frontend-design.md §4]
       * Fade/Zoom animation từ shadcn Dialog [frontend-design.md §4]
       */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="rounded-2xl p-0 max-w-sm overflow-hidden"
          showCloseButton={false}
        >
          {/* Dialog Header */}
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Chọn Token
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="px-4 pt-3 pb-2">
            {/**
             * [FR-01.2] Ô tìm kiếm token theo symbol/name/address
             * Sử dụng Input shadcn/ui đã cài ở Task 3.6
             */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Tên, symbol hoặc địa chỉ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-slate-200 bg-slate-50 focus-visible:border-sky-400"
              />
            </div>
          </div>

          <Separator />

          {/* Token List */}
          <div className="overflow-y-auto max-h-72 px-2 py-2">
            {filteredTokens.length === 0 ? (
              // Không có kết quả search
              <div className="text-center py-8 text-slate-400 text-sm">
                Không tìm thấy token nào
              </div>
            ) : (
              filteredTokens.map((token) => (
                <TokenListItem
                  key={token.address}
                  token={token}
                  balance={balances[token.address] ?? "—"}
                  isDisabled={token.address === disabledToken}
                  isSelected={token.address === selectedToken?.address}
                  onClick={() => handleSelect(token)}
                />
              ))
            )}
          </div>

          {/* Footer: trạng thái ví */}
          {!walletAddress && (
            <>
              <Separator />
              {/**
               * [UC-01] Nhắc kết nối ví để xem balance
               * [frontend-design.md §2.3] text-slate-500
               */}
              <div className="px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
                <WalletIcon className="size-3.5" />
                <span>Kết nối ví để xem số dư</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
