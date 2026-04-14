"use client";

/**
 * Swap Page — LizSwapSimple DEX
 * Task 4.2: Swap Page (Trang Home chính) + Task 4.6: ConfirmSwapDialog
 *
 * Yêu cầu liên quan:
 * - [UC-02] Phê duyệt Token (Approve) — kiểm tra allowance trước khi swap
 * - [UC-03] Hoán đổi Token (Swap) — thực thi swapExactTokensForTokens
 * - [FR-01.1] Kết nối ví MetaMask qua useWeb3 hook
 * - [FR-01.2] Chọn Token nguồn và Token đích — dùng TokenSelector
 * - [FR-01.3] Hiển thị số lượng ước tính — gọi swapService.getAmountsOut()
 * - [FR-01.4] Price Impact, Minimum Received, Slippage Tolerance, Exchange Rate
 *             + ConfirmSwapDialog để review trước khi ký TX (Task 4.6)
 * - [FR-01.5] Ký và gửi giao dịch on-chain, kết quả Toast notification
 *
 * Kiến trúc [C4-Component]:
 * - Page Home → dùng Web3 Hooks (useWeb3) để lấy account/signer
 * - Page Home → dùng Contract Services (swapService) để read/write blockchain
 * - Page Home → dùng TokenSelector (Task 4.1) cho chọn token
 * - Page Home → dùng ConfirmSwapDialog (Task 4.6) cho xác nhận TX
 * - Page Home → dùng TransactionToast (Task 4.5) cho feedback TX
 */

import * as React from "react";
import { formatUnits, parseUnits, MaxUint256 } from "ethers";
import { ArrowDownUpIcon, SettingsIcon, Loader2Icon, InfoIcon } from "lucide-react";

import { useWeb3 } from "@/hooks/useWeb3";
import { swapService } from "@/services/swapService";
import { TokenSelector } from "@/components/web3/TokenSelector";
import { showSwapToast, showApproveToast } from "@/components/web3/TransactionToast";
// [Task 4.6] Import ConfirmSwapDialog [FR-01.4]
import { ConfirmSwapDialog } from "@/components/web3/ConfirmSwapDialog";
import type { TokenInfo } from "@/types/token";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

/** [NFR-03] Router address đọc từ env */
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS ?? "";

/** Deadline mặc định 20 phút (giây) */
const DEADLINE_SECONDS = 20 * 60;

/** [FR-01.3] Debounce khi user gõ số lượng — tránh gọi RPC liên tục */
const QUOTE_DEBOUNCE_MS = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

type SlippagePreset = "0.5" | "1" | "2";

// ─── Helper: Format number display ───────────────────────────────────────────

/**
 * [FR-01.3] Format số lớn từ bigint thành chuỗi hiển thị UI
 * [frontend-design.md §3] tabular numbers, font-mono
 */
function formatTokenAmount(amount: bigint, decimals: number, maxDecimals = 6): string {
  const raw = formatUnits(amount, decimals);
  const num = parseFloat(raw);
  if (num === 0) return "0";
  if (num < 0.000001) return "<0.000001";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * [FR-01.3] Format balance ngắn gọn để hiển thị bên cạnh ô input
 */
function formatBalance(balance: bigint, decimals: number): string {
  const raw = formatUnits(balance, decimals);
  const num = parseFloat(raw);
  if (num === 0) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

/**
 * [FR-01.4] Tính Price Impact
 */
function calcPriceImpact(
  amountIn: bigint,
  amountOutActual: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): number {
  if (reserveIn === 0n || reserveOut === 0n || amountIn === 0n) return 0;
  const amountOutIdeal = (amountIn * reserveOut) / reserveIn;
  if (amountOutIdeal === 0n) return 0;
  const impactNumerator = amountOutIdeal - amountOutActual;
  const impactBps = (impactNumerator * 10000n) / amountOutIdeal;
  return Number(impactBps) / 100;
}

// ─── Sub-component: SlippageSettings ─────────────────────────────────────────

/**
 * [FR-01.4] Slippage Tolerance Picker
 */
function SlippageSettings({
  slippage,
  onChange,
  onClose,
}: {
  slippage: string;
  onChange: (val: string) => void;
  onClose: () => void;
}) {
  const presets: SlippagePreset[] = ["0.5", "1", "2"];
  const [customValue, setCustomValue] = React.useState(
    presets.includes(slippage as SlippagePreset) ? "" : slippage,
  );

  const handlePreset = (val: SlippagePreset) => {
    setCustomValue("");
    onChange(val);
  };

  const handleCustom = (val: string) => {
    setCustomValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num <= 50) {
      onChange(val);
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 z-50 w-64 bg-white rounded-2xl border border-slate-200 shadow-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-900">Slippage Tolerance</span>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-200"
        >
          Đóng
        </button>
      </div>
      <div className="flex gap-2 mb-3">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              slippage === p && !customValue
                ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {p}%
          </button>
        ))}
      </div>
      <div className="relative">
        <input
          type="number"
          value={customValue}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder="Tùy chỉnh..."
          min="0.01"
          max="50"
          step="0.1"
          className="w-full pr-6 pl-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 font-mono focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors duration-200"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          %
        </span>
      </div>
      {parseFloat(slippage) > 5 && (
        <p className="mt-2 text-xs text-amber-500 flex items-center gap-1">
          <InfoIcon className="size-3" />
          Slippage cao — có thể bị front-run
        </p>
      )}
    </div>
  );
}

// ─── Sub-component: SwapInfoRow ───────────────────────────────────────────────

/**
 * [FR-01.4] Hiển thị 1 hàng thông tin giao dịch
 */
function SwapInfoRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn("text-xs font-mono font-medium text-slate-700", valueClass)}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomePage() {
  // ── Web3 State [UC-01] ──────────────────────────────────────────────────────
  const { account, signer, provider, isConnected, isConnecting, connectWallet } = useWeb3();

  // ── Token State [FR-01.2] ──────────────────────────────────────────────────
  const [tokenIn, setTokenIn] = React.useState<TokenInfo | null>(null);
  const [tokenOut, setTokenOut] = React.useState<TokenInfo | null>(null);

  // ── Amount State [FR-01.3] ─────────────────────────────────────────────────
  const [amountIn, setAmountIn] = React.useState("");
  const [amountOut, setAmountOut] = React.useState("");
  const [isQuoting, setIsQuoting] = React.useState(false);

  // ── Balance State [FR-01.3] ────────────────────────────────────────────────
  const [balanceIn, setBalanceIn] = React.useState<bigint>(0n);
  const [balanceOut, setBalanceOut] = React.useState<bigint>(0n);

  // ── Reserves State [FR-01.4] ───────────────────────────────────────────────
  const [reserveIn, setReserveIn] = React.useState<bigint>(0n);
  const [reserveOut, setReserveOut] = React.useState<bigint>(0n);

  // ── Price Impact & Slippage [FR-01.4] ─────────────────────────────────────
  const [priceImpact, setPriceImpact] = React.useState<number>(0);
  const [slippage, setSlippage] = React.useState("0.5");
  const [showSlippage, setShowSlippage] = React.useState(false);

  // ── TX State [FR-01.5], [UC-02] ────────────────────────────────────────────
  const [isTxLoading, setIsTxLoading] = React.useState(false);
  const [txAction, setTxAction] = React.useState<"approve" | "swap" | null>(null);
  const [allowance, setAllowance] = React.useState<bigint>(0n);
  const [poolExists, setPoolExists] = React.useState<boolean | null>(null);

  // ── [Task 4.6] Confirm Dialog State [FR-01.4] ─────────────────────────────
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Load balances [FR-01.3]
  // ─────────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!account || !provider) {
      setBalanceIn(0n);
      setBalanceOut(0n);
      return;
    }
    const loadBalances = async () => {
      if (tokenIn) {
        try {
          const bal = await swapService.getTokenBalance(provider, tokenIn.address, account);
          setBalanceIn(bal);
        } catch { setBalanceIn(0n); }
      }
      if (tokenOut) {
        try {
          const bal = await swapService.getTokenBalance(provider, tokenOut.address, account);
          setBalanceOut(bal);
        } catch { setBalanceOut(0n); }
      }
    };
    void loadBalances();
  }, [account, provider, tokenIn, tokenOut]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Load allowance [UC-02]
  // ─────────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!account || !provider || !tokenIn || !ROUTER_ADDRESS) {
      setAllowance(0n);
      return;
    }
    const loadAllowance = async () => {
      try {
        const al = await swapService.getAllowance(provider, tokenIn.address, account, ROUTER_ADDRESS);
        setAllowance(al);
      } catch { setAllowance(0n); }
    };
    void loadAllowance();
  }, [account, provider, tokenIn]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Load reserves + pool check [FR-01.4]
  // ─────────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "";
    if (!tokenIn || !tokenOut || !factoryAddress) {
      setReserveIn(0n);
      setReserveOut(0n);
      setPoolExists(null);
      return;
    }
    const prov = provider ?? undefined;
    const loadReserves = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reserves = await swapService.getReserves(prov as any, factoryAddress, tokenIn.address, tokenOut.address);
        if (reserves.pairAddress === "0x0000000000000000000000000000000000000000") {
          setPoolExists(false);
          setReserveIn(0n);
          setReserveOut(0n);
        } else {
          setPoolExists(true);
          setReserveIn(reserves.reserveA);
          setReserveOut(reserves.reserveB);
        }
      } catch {
        setPoolExists(false);
        setReserveIn(0n);
        setReserveOut(0n);
      }
    };
    void loadReserves();
  }, [provider, tokenIn, tokenOut]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Debounced quote [FR-01.3]
  // ─────────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut("");
      setPriceImpact(0);
      return;
    }
    const prov = provider ?? undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsQuoting(true);
      try {
        // [FR-01.3] Công thức AMM x*y=k — gọi router.getAmountsOut()
        const amountInBig = parseUnits(amountIn, tokenIn.decimals);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const amounts = await swapService.getAmountsOut(prov as any, amountInBig, [tokenIn.address, tokenOut.address]);
        if (cancelled) return;
        const outBig = amounts[1];
        setAmountOut(formatTokenAmount(outBig, tokenOut.decimals));
        if (reserveIn > 0n && reserveOut > 0n) {
          const impact = calcPriceImpact(amountInBig, outBig, reserveIn, reserveOut);
          setPriceImpact(impact);
        }
      } catch {
        if (!cancelled) { setAmountOut(""); setPriceImpact(0); }
      } finally {
        if (!cancelled) setIsQuoting(false);
      }
    }, QUOTE_DEBOUNCE_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [amountIn, tokenIn, tokenOut, provider, reserveIn, reserveOut]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * [FR-01.4] Minimum Received
   */
  const minimumReceived = React.useMemo(() => {
    if (!amountOut || !tokenOut || parseFloat(amountOut) <= 0) return null;
    try {
      const outBig = parseUnits(parseFloat(amountOut).toFixed(tokenOut.decimals), tokenOut.decimals);
      const slippageBps = BigInt(Math.round(parseFloat(slippage) * 100));
      const minOut = (outBig * (10000n - slippageBps)) / 10000n;
      return formatTokenAmount(minOut, tokenOut.decimals);
    } catch { return null; }
  }, [amountOut, tokenOut, slippage]);

  /**
   * [FR-01.4] Exchange Rate
   */
  const exchangeRate = React.useMemo(() => {
    if (!tokenIn || !tokenOut || !amountIn || !amountOut) return null;
    const inNum = parseFloat(amountIn);
    const outNum = parseFloat(amountOut.replace(/,/g, ""));
    if (inNum <= 0 || outNum <= 0) return null;
    const rate = outNum / inNum;
    return `1 ${tokenIn.symbol} ≈ ${rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${tokenOut.symbol}`;
  }, [tokenIn, tokenOut, amountIn, amountOut]);

  /**
   * [FR-01.4] Price Impact color class
   */
  const priceImpactClass = React.useMemo(() => {
    if (priceImpact < 1) return "text-emerald-500";
    if (priceImpact <= 5) return "text-amber-500";
    return "text-red-500";
  }, [priceImpact]);

  /**
   * [UC-02] Kiểm tra có cần approve không
   */
  const needsApprove = React.useMemo(() => {
    if (!tokenIn || !amountIn || parseFloat(amountIn) <= 0) return false;
    try {
      const amountInBig = parseUnits(amountIn, tokenIn.decimals);
      return allowance < amountInBig;
    } catch { return false; }
  }, [tokenIn, amountIn, allowance]);

  /**
   * Số dư không đủ
   */
  const hasInsufficientBalance = React.useMemo(() => {
    if (!tokenIn || !amountIn || parseFloat(amountIn) <= 0) return false;
    try {
      const amountInBig = parseUnits(amountIn, tokenIn.decimals);
      return balanceIn < amountInBig;
    } catch { return false; }
  }, [tokenIn, amountIn, balanceIn]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** [FR-01.2] Đảo chiều token In ↔ Out */
  const handleFlip = () => {
    const prevIn = tokenIn;
    const prevOut = tokenOut;
    const prevAmountOut = amountOut;
    setTokenIn(prevOut);
    setTokenOut(prevIn);
    setAmountIn(prevAmountOut.replace(/,/g, "") ?? "");
    setAmountOut("");
    setPriceImpact(0);
  };

  /**
   * [UC-02] Xử lý approve token
   */
  const handleApprove = async () => {
    if (!signer || !tokenIn || !ROUTER_ADDRESS) return;
    setIsTxLoading(true);
    setTxAction("approve");
    try {
      showApproveToast("pending", tokenIn.symbol);
      const tx = await swapService.approveToken(signer, tokenIn.address, ROUTER_ADDRESS, MaxUint256);
      showApproveToast("pending", tokenIn.symbol, tx.hash);
      await tx.wait();
      showApproveToast("success", tokenIn.symbol, tx.hash);
      if (provider && account) {
        const al = await swapService.getAllowance(provider, tokenIn.address, account, ROUTER_ADDRESS);
        setAllowance(al);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showApproveToast("error", tokenIn.symbol, undefined, msg);
    } finally {
      setIsTxLoading(false);
      setTxAction(null);
    }
  };

  /**
   * [UC-03] [FR-01.5] Thực thi swap — được gọi từ ConfirmSwapDialog.onConfirm
   * [Task 4.6] Dialog sẽ gọi hàm này sau khi user xác nhận
   */
  const handleSwapConfirmed = async () => {
    if (!signer || !account || !tokenIn || !tokenOut || !amountIn || !amountOut) return;
    if (hasInsufficientBalance) return;

    setIsTxLoading(true);
    setTxAction("swap");

    try {
      const amountInBig = parseUnits(amountIn, tokenIn.decimals);
      const slippageBps = BigInt(Math.round(parseFloat(slippage) * 100));

      // [FR-01.3] Gọi lại getAmountsOut ngay trước submit để lấy giá mới nhất
      let amountOutBig: bigint;
      try {
        const prov = provider ?? undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const amounts = await swapService.getAmountsOut(prov as any, amountInBig, [tokenIn.address, tokenOut.address]);
        amountOutBig = amounts[1];
      } catch {
        amountOutBig = parseUnits(parseFloat(amountOut.replace(/,/g, "")).toFixed(tokenOut.decimals), tokenOut.decimals);
      }

      // [FR-01.4] Minimum Received = amountOut * (1 - slippage%)
      const amountOutMin = (amountOutBig * (10000n - slippageBps)) / 10000n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);

      showSwapToast("pending", tokenIn.symbol, tokenOut.symbol);

      // [FR-01.5] Thực thi swap
      const tx = await swapService.swapExactTokensForTokens(
        signer,
        amountInBig,
        amountOutMin,
        [tokenIn.address, tokenOut.address],
        account,
        deadline,
      );

      showSwapToast("pending", tokenIn.symbol, tokenOut.symbol, tx.hash);
      await tx.wait();
      showSwapToast("success", tokenIn.symbol, tokenOut.symbol, tx.hash);

      // Đóng dialog sau khi TX thành công
      setShowConfirmDialog(false);

      // Reset form
      setAmountIn("");
      setAmountOut("");
      setPriceImpact(0);

      // [FR-01.5] Refresh balance sau swap
      if (provider && account) {
        const [newBalIn, newBalOut] = await Promise.all([
          swapService.getTokenBalance(provider, tokenIn.address, account),
          swapService.getTokenBalance(provider, tokenOut.address, account),
        ]);
        setBalanceIn(newBalIn);
        setBalanceOut(newBalOut);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showSwapToast("error", tokenIn.symbol, tokenOut.symbol, undefined, msg);
      // Đóng dialog khi lỗi để user thấy toast
      setShowConfirmDialog(false);
    } finally {
      setIsTxLoading(false);
      setTxAction(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Button State Logic [task-4.2.md §4]
  // ─────────────────────────────────────────────────────────────────────────

  const swapButtonConfig = React.useMemo(() => {
    if (!isConnected) {
      return { label: "Kết nối Ví", disabled: isConnecting, onClick: connectWallet, isGradient: true };
    }
    if (!tokenIn || !tokenOut) {
      return { label: "Chọn token", disabled: true, onClick: undefined, isGradient: false };
    }
    if (!amountIn || parseFloat(amountIn) <= 0) {
      return { label: "Nhập số lượng", disabled: true, onClick: undefined, isGradient: false };
    }
    if (poolExists === false) {
      return { label: "Pool chưa tồn tại", disabled: true, onClick: undefined, isGradient: false };
    }
    if (hasInsufficientBalance) {
      return { label: `Không đủ ${tokenIn.symbol}`, disabled: true, onClick: undefined, isGradient: false };
    }
    if (isTxLoading) {
      return {
        label: txAction === "approve" ? `Đang phê duyệt ${tokenIn.symbol}...` : "Đang hoán đổi...",
        disabled: true, onClick: undefined, isGradient: true,
      };
    }
    // [UC-02] Cần Approve
    if (needsApprove) {
      return { label: `Phê duyệt ${tokenIn.symbol}`, disabled: false, onClick: handleApprove, isGradient: true };
    }
    if (isQuoting) {
      return { label: "Đang tính...", disabled: true, onClick: undefined, isGradient: true };
    }
    // [Task 4.6] Sẵn sàng → mở ConfirmSwapDialog thay vì swap trực tiếp [FR-01.4]
    return {
      label: "Hoán đổi",
      disabled: !amountOut,
      onClick: () => setShowConfirmDialog(true),
      isGradient: true,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isConnected, isConnecting, tokenIn, tokenOut, amountIn, amountOut, poolExists,
    hasInsufficientBalance, isTxLoading, txAction, needsApprove, isQuoting,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const showSwapInfo = tokenIn && tokenOut && amountIn && amountOut && parseFloat(amountIn) > 0;

  return (
    // [frontend-design.md §2.1] bg-slate-50 từ RootLayout
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
      {/*
       * [FR-01] Swap Card
       * [frontend-design.md §2.1] bg-white rounded-2xl shadow-sm border border-slate-200
       */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        {/* ── Card Header ── */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-slate-900">Hoán Đổi</h1>
          {/* [FR-01.4] Settings icon → mở Slippage panel */}
          <div className="relative">
            <button
              onClick={() => setShowSlippage((v) => !v)}
              className={cn(
                "rounded-lg p-1.5 transition-all duration-200",
                "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
                showSlippage && "bg-sky-50 text-sky-500",
              )}
              title="Cài đặt Slippage"
            >
              <SettingsIcon className="size-4.5" />
            </button>
            {showSlippage && (
              <SlippageSettings
                slippage={slippage}
                onChange={setSlippage}
                onClose={() => setShowSlippage(false)}
              />
            )}
          </div>
        </div>

        {/* ── Input Token Section (Từ) [FR-01.2] ── */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-1 hover:border-slate-200 transition-colors duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Từ</span>
            {/* [FR-01.3] Balance display — gọi swapService.getTokenBalance() */}
            {account && tokenIn && (
              <button
                className="text-xs text-slate-500 font-mono hover:text-sky-500 transition-colors duration-200"
                onClick={() => {
                  if (balanceIn > 0n) setAmountIn(formatUnits(balanceIn, tokenIn.decimals));
                }}
                title="Điền tối đa"
              >
                Số dư: {formatBalance(balanceIn, tokenIn.decimals)} {tokenIn.symbol}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* [FR-01.2] TokenSelector — chọn token nguồn */}
            <TokenSelector
              selectedToken={tokenIn}
              onSelect={setTokenIn}
              disabledToken={tokenOut?.address}
              label=""
              walletAddress={account ?? undefined}
            />
            <div className="flex-1 min-w-0">
              <input
                id="amount-in"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                min="0"
                step="any"
                className={cn(
                  "w-full text-right text-2xl font-semibold bg-transparent outline-none",
                  "text-slate-900 placeholder:text-slate-300",
                  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                )}
              />
            </div>
          </div>
        </div>

        {/* ── Flip Button [FR-01.2] ── */}
        <div className="flex justify-center my-1">
          <button
            onClick={handleFlip}
            className="rounded-full bg-white border border-slate-200 p-1.5 shadow-sm hover:bg-slate-50 hover:border-sky-300 transition-all duration-200 hover:scale-[1.1] active:scale-95"
            title="Đảo chiều token"
          >
            <ArrowDownUpIcon className="size-4 text-slate-400 hover:text-sky-500 transition-colors duration-200" />
          </button>
        </div>

        {/* ── Output Token Section (Đến) [FR-01.2] ── */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mt-1 hover:border-slate-200 transition-colors duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Đến</span>
            {account && tokenOut && (
              <span className="text-xs text-slate-500 font-mono">
                Số dư: {formatBalance(balanceOut, tokenOut.decimals)} {tokenOut.symbol}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* [FR-01.2] TokenSelector — chọn token đích */}
            <TokenSelector
              selectedToken={tokenOut}
              onSelect={setTokenOut}
              disabledToken={tokenIn?.address}
              label=""
              walletAddress={account ?? undefined}
            />
            <div className="flex-1 min-w-0 text-right">
              {isQuoting ? (
                <Loader2Icon className="size-5 animate-spin text-slate-300 ml-auto" />
              ) : (
                <span className={cn(
                  "text-2xl font-semibold font-mono",
                  amountOut ? "text-slate-900" : "text-slate-300",
                )}>
                  {amountOut || "0"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Swap Info Panel [FR-01.4] ── */}
        {showSwapInfo && (
          <div className="mt-3 px-1 py-2 rounded-xl border border-slate-100 bg-slate-50/50 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
            {exchangeRate && <SwapInfoRow label="Tỷ giá" value={exchangeRate} />}
            <SwapInfoRow
              label="Price Impact"
              value={priceImpact > 0 ? `${priceImpact.toFixed(2)}%` : "<0.01%"}
              valueClass={priceImpactClass}
            />
            {minimumReceived && tokenOut && (
              <SwapInfoRow label="Nhận tối thiểu" value={`${minimumReceived} ${tokenOut.symbol}`} />
            )}
            <SwapInfoRow
              label="Slippage"
              value={`${slippage}%`}
              valueClass={parseFloat(slippage) > 5 ? "text-amber-500" : "text-slate-700"}
            />
            {priceImpact > 5 && (
              <div className="flex items-center gap-1.5 pt-1 text-amber-500">
                <InfoIcon className="size-3 shrink-0" />
                <span className="text-xs">Price Impact cao! Bạn có thể nhận được ít hơn dự kiến.</span>
              </div>
            )}
          </div>
        )}

        {/* ── Pool không tồn tại cảnh báo ── */}
        {poolExists === false && tokenIn && tokenOut && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-200 flex items-center gap-2">
            <InfoIcon className="size-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-600">
              Pool {tokenIn.symbol}/{tokenOut.symbol} chưa tồn tại. Thêm thanh khoản trước.
            </span>
          </div>
        )}

        {/* ── Swap Button [UC-02] [UC-03] [FR-01.5] ── */}
        {/*
         * Trạng thái tuần tự theo task-4.2.md §4
         * [Task 4.6] Trạng thái "Sẵn sàng" → mở ConfirmSwapDialog thay vì swap trực tiếp
         * [frontend-design.md §2.2] gradient sky-400 → blue-500
         * [frontend-design.md §4] hover:scale-[1.02] active:scale-[0.98]
         */}
        <button
          id="swap-button"
          onClick={() => swapButtonConfig.onClick?.()}
          disabled={swapButtonConfig.disabled}
          className={cn(
            "w-full mt-4 h-12 rounded-xl font-semibold text-base transition-all duration-300",
            swapButtonConfig.isGradient && !swapButtonConfig.disabled
              ? ["bg-gradient-to-r from-sky-400 to-blue-500 text-white", "hover:scale-[1.02] active:scale-[0.98]", "hover:shadow-lg hover:shadow-blue-500/25"]
              : swapButtonConfig.isGradient && swapButtonConfig.disabled
                ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white opacity-60 cursor-not-allowed"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
          )}
        >
          {isTxLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              {swapButtonConfig.label}
            </span>
          ) : isConnecting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              Đang kết nối...
            </span>
          ) : (
            swapButtonConfig.label
          )}
        </button>
      </div>

      {/* ── [Task 4.6] ConfirmSwapDialog [FR-01.4] [UC-03] ── */}
      {/*
       * Modal xác nhận trước khi gửi TX swap
       * Hiển thị: tokenIn → tokenOut, amountIn/Out, priceImpact, minReceived, slippage
       * onConfirm → handleSwapConfirmed() gửi TX on-chain
       * [frontend-design.md §4] Fade/Zoom animation từ shadcn Dialog
       */}
      {tokenIn && tokenOut && (
        <ConfirmSwapDialog
          open={showConfirmDialog}
          onOpenChange={(open) => {
            if (!isTxLoading) setShowConfirmDialog(open);
          }}
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          amountIn={amountIn}
          amountOut={amountOut}
          slippage={slippage}
          priceImpact={priceImpact}
          minimumReceived={minimumReceived}
          exchangeRate={exchangeRate}
          isLoading={isTxLoading && txAction === "swap"}
          onConfirm={handleSwapConfirmed}
        />
      )}
    </div>
  );
}
