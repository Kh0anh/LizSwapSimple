"use client";

import * as React from "react";
import {
  JsonRpcProvider,
  ZeroAddress,
  formatUnits,
  isAddress,
  parseUnits,
  type Provider,
} from "ethers";
import { Loader2Icon, PlusIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  showApproveToast,
  showLiquidityToast,
  showTxToast,
} from "@/components/web3/TransactionToast";
import { TokenSelector } from "@/components/web3/TokenSelector";
import { useWeb3 } from "@/hooks/useWeb3";
import {
  swapService,
  type PairReserves,
} from "@/services/swapService";
import deployedAddresses from "@/services/contracts/deployedAddresses.json";
import tokenList from "@/services/contracts/tokenList.json";
import type { TokenInfo } from "@/types/token";

type DeployAddressMap = {
  factory?: string;
  router?: string;
};

const TOKENS = tokenList as TokenInfo[];
const DEPLOYED = deployedAddresses as DeployAddressMap;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";
const SLIPPAGE_BPS = 100n;
const DEADLINE_SECONDS = 20 * 60;

const DEFAULT_TOKEN_A = TOKENS.find((token) => token.symbol === "USDT") ?? TOKENS[0] ?? null;
const DEFAULT_TOKEN_B = TOKENS.find((token) => token.symbol === "DAI") ?? TOKENS[1] ?? null;

function resolveConfiguredAddress(
  envValue: string | undefined,
  fileValue: string | undefined,
): string {
  if (envValue && isAddress(envValue) && envValue !== ZeroAddress) {
    return envValue;
  }

  if (fileValue && isAddress(fileValue) && fileValue !== ZeroAddress) {
    return fileValue;
  }

  return "";
}

function isAmountInput(value: string): boolean {
  return /^\d*\.?\d*$/.test(value);
}

function parseAmountUnits(value: string, decimals: number): bigint | null {
  if (!value.trim()) {
    return null;
  }

  try {
    return parseUnits(value, decimals);
  } catch {
    return null;
  }
}

function formatAmountForInput(value: bigint, decimals: number): string {
  const raw = formatUnits(value, decimals);
  return raw
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

function formatAmountDisplay(value: bigint, decimals: number): string {
  const raw = formatUnits(value, decimals);
  const [whole, fraction = ""] = raw.split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFraction = fraction.slice(0, 6).replace(/0+$/, "");
  return trimmedFraction.length > 0
    ? `${groupedWhole}.${trimmedFraction}`
    : groupedWhole;
}

function formatRatio(value: number, maxFractionDigits = 6): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits: maxFractionDigits,
  });
}

export default function PoolPage() {
  const {
    account,
    connectWallet,
    error: walletError,
    isConnected,
    isConnecting,
    provider,
    signer,
  } = useWeb3();

  const [activeTab, setActiveTab] = React.useState<"add" | "remove">("add");
  const [tokenA, setTokenA] = React.useState<TokenInfo | null>(DEFAULT_TOKEN_A);
  const [tokenB, setTokenB] = React.useState<TokenInfo | null>(DEFAULT_TOKEN_B);
  const [amountAInput, setAmountAInput] = React.useState("");
  const [amountBInput, setAmountBInput] = React.useState("");
  const [poolReserves, setPoolReserves] = React.useState<PairReserves | null>(null);
  const [balanceA, setBalanceA] = React.useState<bigint>(0n);
  const [balanceB, setBalanceB] = React.useState<bigint>(0n);
  const [isLoadingPool, setIsLoadingPool] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStep, setSubmitStep] = React.useState("");
  const [uiError, setUiError] = React.useState<string | null>(null);
  const [lpReceivedEstimate, setLpReceivedEstimate] = React.useState<bigint | null>(null);

  const readProvider = React.useMemo<Provider>(
    () => provider ?? new JsonRpcProvider(RPC_URL),
    [provider],
  );

  const routerAddress = React.useMemo(
    () => resolveConfiguredAddress(process.env.NEXT_PUBLIC_ROUTER_ADDRESS, DEPLOYED.router),
    [],
  );

  const factoryAddress = React.useMemo(
    () => resolveConfiguredAddress(process.env.NEXT_PUBLIC_FACTORY_ADDRESS, DEPLOYED.factory),
    [],
  );

  const parsedAmountA = React.useMemo(
    () => (tokenA ? parseAmountUnits(amountAInput, tokenA.decimals) : null),
    [amountAInput, tokenA],
  );

  const parsedAmountB = React.useMemo(
    () => (tokenB ? parseAmountUnits(amountBInput, tokenB.decimals) : null),
    [amountBInput, tokenB],
  );

  const hasValidPair = Boolean(
    tokenA && tokenB && tokenA.address.toLowerCase() !== tokenB.address.toLowerCase(),
  );

  const hasExistingPool = Boolean(
    poolReserves &&
      poolReserves.pairAddress !== ZeroAddress &&
      poolReserves.reserveA > 0n &&
      poolReserves.reserveB > 0n,
  );

  const isCreatingPool = hasValidPair && !isLoadingPool && !hasExistingPool;

  const balanceTextA = tokenA
    ? formatAmountDisplay(balanceA, tokenA.decimals)
    : "0";

  const balanceTextB = tokenB
    ? formatAmountDisplay(balanceB, tokenB.decimals)
    : "0";

  const exchangeRateText = React.useMemo(() => {
    if (!tokenA || !tokenB) {
      return "--";
    }

    if (hasExistingPool && poolReserves) {
      const reserveAFloat = Number(formatUnits(poolReserves.reserveA, tokenA.decimals));
      const reserveBFloat = Number(formatUnits(poolReserves.reserveB, tokenB.decimals));

      if (reserveAFloat > 0 && reserveBFloat > 0) {
        const rate = reserveBFloat / reserveAFloat;
        return `1 ${tokenA.symbol} = ${formatRatio(rate)} ${tokenB.symbol}`;
      }
    }

    if (parsedAmountA && parsedAmountA > 0n && parsedAmountB && parsedAmountB > 0n) {
      const amountAFloat = Number(formatUnits(parsedAmountA, tokenA.decimals));
      const amountBFloat = Number(formatUnits(parsedAmountB, tokenB.decimals));

      if (amountAFloat > 0 && amountBFloat > 0) {
        const rate = amountBFloat / amountAFloat;
        return `1 ${tokenA.symbol} = ${formatRatio(rate)} ${tokenB.symbol}`;
      }
    }

    return "--";
  }, [
    hasExistingPool,
    parsedAmountA,
    parsedAmountB,
    poolReserves,
    tokenA,
    tokenB,
  ]);

  const shareText = React.useMemo(() => {
    if (!parsedAmountA || !parsedAmountB || !tokenA || !tokenB) {
      return "--";
    }

    if (isCreatingPool) {
      return "~100% (khởi tạo Pool)";
    }

    if (hasExistingPool && poolReserves) {
      const reserveAFloat = Number(formatUnits(poolReserves.reserveA, tokenA.decimals));
      const reserveBFloat = Number(formatUnits(poolReserves.reserveB, tokenB.decimals));
      const amountAFloat = Number(formatUnits(parsedAmountA, tokenA.decimals));
      const amountBFloat = Number(formatUnits(parsedAmountB, tokenB.decimals));

      if (
        reserveAFloat > 0 &&
        reserveBFloat > 0 &&
        amountAFloat > 0 &&
        amountBFloat > 0
      ) {
        const shareA = amountAFloat / (reserveAFloat + amountAFloat);
        const shareB = amountBFloat / (reserveBFloat + amountBFloat);
        const share = Math.min(shareA, shareB) * 100;
        return `~${formatRatio(share, 2)}%`;
      }
    }

    return "--";
  }, [
    hasExistingPool,
    isCreatingPool,
    parsedAmountA,
    parsedAmountB,
    poolReserves,
    tokenA,
    tokenB,
  ]);

  const refreshBalances = React.useCallback(async () => {
    if (!account || !tokenA || !tokenB) {
      setBalanceA(0n);
      setBalanceB(0n);
      return;
    }

    const [nextBalanceA, nextBalanceB] = await Promise.all([
      swapService.getTokenBalance(readProvider, tokenA.address, account),
      swapService.getTokenBalance(readProvider, tokenB.address, account),
    ]);

    setBalanceA(nextBalanceA);
    setBalanceB(nextBalanceB);
  }, [account, readProvider, tokenA, tokenB]);

  const refreshPool = React.useCallback(async () => {
    if (!tokenA || !tokenB || !hasValidPair || !factoryAddress) {
      setPoolReserves(null);
      return;
    }

    setIsLoadingPool(true);
    try {
      const reserves = await swapService.getReserves(
        readProvider,
        factoryAddress,
        tokenA.address,
        tokenB.address,
      );
      setPoolReserves(reserves);
    } catch (error) {
      setPoolReserves(null);
      setUiError(
        error instanceof Error
          ? error.message
          : "Không thể đọc trạng thái Pool.",
      );
    } finally {
      setIsLoadingPool(false);
    }
  }, [factoryAddress, hasValidPair, readProvider, tokenA, tokenB]);

  React.useEffect(() => {
    void refreshPool();
  }, [refreshPool]);

  React.useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  React.useEffect(() => {
    if (!hasExistingPool || !poolReserves || !tokenB) {
      return;
    }

    if (!parsedAmountA || parsedAmountA <= 0n) {
      setAmountBInput("");
      return;
    }

    let cancelled = false;

    const autoQuote = async () => {
      try {
        const quotedAmountB = await swapService.quote(
          readProvider,
          parsedAmountA,
          poolReserves.reserveA,
          poolReserves.reserveB,
        );

        if (!cancelled) {
          setAmountBInput(formatAmountForInput(quotedAmountB, tokenB.decimals));
        }
      } catch {
        if (!cancelled) {
          setAmountBInput("");
        }
      }
    };

    void autoQuote();

    return () => {
      cancelled = true;
    };
  }, [hasExistingPool, parsedAmountA, poolReserves, readProvider, tokenB]);

  const handleAddLiquidity = React.useCallback(async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!tokenA || !tokenB || !signer || !account) {
      setUiError("Thiếu thông tin ví hoặc token.");
      return;
    }

    if (!routerAddress) {
      setUiError("Chưa cấu hình NEXT_PUBLIC_ROUTER_ADDRESS.");
      return;
    }

    if (tokenA.address.toLowerCase() === tokenB.address.toLowerCase()) {
      setUiError("Vui lòng chọn 2 token khác nhau.");
      return;
    }

    if (tokenA.address === ZeroAddress || tokenB.address === ZeroAddress) {
      setUiError("MVP hiện chỉ hỗ trợ thêm thanh khoản cho token ERC20.");
      showTxToast("error", {
        description: "Thêm thanh khoản",
        errorMessage: "BNB native chưa hỗ trợ trong luồng addLiquidity.",
      });
      return;
    }

    const amountAWei = parseAmountUnits(amountAInput, tokenA.decimals);
    const amountBWei = parseAmountUnits(amountBInput, tokenB.decimals);

    if (!amountAWei || !amountBWei || amountAWei <= 0n || amountBWei <= 0n) {
      setUiError("Vui lòng nhập số lượng hợp lệ cho cả 2 token.");
      return;
    }

    setUiError(null);
    setIsSubmitting(true);
    setLpReceivedEstimate(null);

    try {
      setSubmitStep("Kiểm tra allowance token A...");
      const allowanceA = await swapService.getAllowance(
        readProvider,
        tokenA.address,
        account,
        routerAddress,
      );

      if (allowanceA < amountAWei) {
        setSubmitStep(`Phê duyệt ${tokenA.symbol}...`);
        showApproveToast("pending", tokenA.symbol);
        const approveTxA = await swapService.approveToken(
          signer,
          tokenA.address,
          routerAddress,
          amountAWei,
        );
        await approveTxA.wait();
        showApproveToast("success", tokenA.symbol, approveTxA.hash);
      }

      setSubmitStep("Kiểm tra allowance token B...");
      const allowanceB = await swapService.getAllowance(
        readProvider,
        tokenB.address,
        account,
        routerAddress,
      );

      if (allowanceB < amountBWei) {
        setSubmitStep(`Phê duyệt ${tokenB.symbol}...`);
        showApproveToast("pending", tokenB.symbol);
        const approveTxB = await swapService.approveToken(
          signer,
          tokenB.address,
          routerAddress,
          amountBWei,
        );
        await approveTxB.wait();
        showApproveToast("success", tokenB.symbol, approveTxB.hash);
      }

      let estimatedLiquidity: bigint | null = null;

      try {
        const routerContract = swapService.getRouterContract(signer);
        const staticResult = (await routerContract.addLiquidity.staticCall(
          tokenA.address,
          tokenB.address,
          amountAWei,
          amountBWei,
          (amountAWei * (10000n - SLIPPAGE_BPS)) / 10000n,
          (amountBWei * (10000n - SLIPPAGE_BPS)) / 10000n,
          account,
          BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS),
        )) as [bigint, bigint, bigint];
        estimatedLiquidity = staticResult[2];
      } catch {
        estimatedLiquidity = null;
      }

      const amountAMin = (amountAWei * (10000n - SLIPPAGE_BPS)) / 10000n;
      const amountBMin = (amountBWei * (10000n - SLIPPAGE_BPS)) / 10000n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);

      setSubmitStep("Gửi giao dịch thêm thanh khoản...");
      showLiquidityToast("pending", "add", tokenA.symbol, tokenB.symbol);

      const addTx = await swapService.addLiquidity(
        signer,
        tokenA.address,
        tokenB.address,
        amountAWei,
        amountBWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
      );

      await addTx.wait();

      showLiquidityToast(
        "success",
        "add",
        tokenA.symbol,
        tokenB.symbol,
        addTx.hash,
      );

      setLpReceivedEstimate(estimatedLiquidity);
      setAmountAInput("");
      setAmountBInput("");

      await Promise.all([refreshPool(), refreshBalances()]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Thêm thanh khoản thất bại.";

      setUiError(message);
      showLiquidityToast(
        "error",
        "add",
        tokenA.symbol,
        tokenB.symbol,
        undefined,
        message,
      );
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  }, [
    account,
    amountAInput,
    amountBInput,
    connectWallet,
    isConnected,
    readProvider,
    refreshBalances,
    refreshPool,
    routerAddress,
    signer,
    tokenA,
    tokenB,
  ]);

  const mainActionLabel = React.useMemo(() => {
    if (isConnecting) {
      return "Đang kết nối ví...";
    }

    if (!isConnected) {
      return "Kết nối Ví";
    }

    if (isSubmitting) {
      return submitStep || "Đang xử lý...";
    }

    if (!tokenA || !tokenB) {
      return "Chọn token";
    }

    if (!parsedAmountA || !parsedAmountB) {
      return "Nhập số lượng";
    }

    return "Thêm Thanh Khoản";
  }, [
    isConnected,
    isConnecting,
    isSubmitting,
    parsedAmountA,
    parsedAmountB,
    submitStep,
    tokenA,
    tokenB,
  ]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 mb-5">
          <button
            onClick={() => setActiveTab("add")}
            className={[
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
              activeTab === "add"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            Thêm Thanh Khoản
          </button>
          <button
            onClick={() => setActiveTab("remove")}
            className={[
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
              activeTab === "remove"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            Rút Thanh Khoản
          </button>
        </div>

        {activeTab === "remove" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Tính năng Rút Thanh Khoản sẽ hoàn thiện ở Task 4.4.
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Token A</span>
                <span className="text-xs text-slate-500 font-mono">
                  Số dư: {balanceTextA}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <TokenSelector
                  selectedToken={tokenA}
                  onSelect={setTokenA}
                  disabledToken={tokenB?.address}
                  walletAddress={account ?? undefined}
                />
                <Input
                  value={amountAInput}
                  onChange={(event) => {
                    const next = event.target.value.trim();
                    if (isAmountInput(next)) {
                      setAmountAInput(next);
                      setLpReceivedEstimate(null);
                    }
                  }}
                  placeholder="0.0"
                  className="h-10 text-right text-base font-semibold bg-transparent border-none shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex justify-center my-2">
              <div className="rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
                <PlusIcon className="size-4 text-slate-500" />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Token B</span>
                <span className="text-xs text-slate-500 font-mono">
                  Số dư: {balanceTextB}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <TokenSelector
                  selectedToken={tokenB}
                  onSelect={setTokenB}
                  disabledToken={tokenA?.address}
                  walletAddress={account ?? undefined}
                />
                <Input
                  value={amountBInput}
                  onChange={(event) => {
                    const next = event.target.value.trim();
                    if (isAmountInput(next) && !hasExistingPool) {
                      setAmountBInput(next);
                      setLpReceivedEstimate(null);
                    }
                  }}
                  placeholder={hasExistingPool ? "Tự động quote" : "0.0"}
                  readOnly={hasExistingPool}
                  className="h-10 text-right text-base font-semibold bg-transparent border-none shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tỷ giá hiện tại</span>
                <span className="text-slate-900 font-mono">{exchangeRateText}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Phần chia Pool</span>
                <span className="text-slate-900 font-mono">{shareText}</span>
              </div>
            </div>

            {isCreatingPool && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-200 text-amber-700 text-xs px-3 py-2 mt-3">
                Bạn đang tạo Pool mới!
              </div>
            )}

            {(walletError || uiError) && (
              <div className="rounded-xl bg-red-500/10 border border-red-200 text-red-700 text-xs px-3 py-2 mt-3 wrap-break-word">
                {walletError ?? uiError}
              </div>
            )}

            {lpReceivedEstimate !== null && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-200 text-emerald-700 text-xs px-3 py-2 mt-3">
                LP Token nhận được (ước tính): {formatAmountDisplay(lpReceivedEstimate, 18)}
              </div>
            )}

            <button
              disabled={isSubmitting || isConnecting}
              onClick={() => {
                if (!isConnected) {
                  void connectWallet();
                  return;
                }

                void handleAddLiquidity();
              }}
              className={[
                "w-full mt-4 rounded-xl py-3 text-lg font-semibold text-white",
                "bg-linear-to-r from-sky-400 to-blue-500",
                "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/25",
                (isSubmitting || isConnecting) && "opacity-80 cursor-not-allowed",
              ].join(" ")}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {(isSubmitting || isConnecting) && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {mainActionLabel}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
