"use client";

/**
 * Pool Page — LizSwapSimple DEX
 * Task 4.3 + Task 4.4 + Task 4.6
 *
 * Yêu cầu liên quan:
 * - [UC-04] Thêm Thanh khoản — Add Liquidity
 * - [UC-05] Rút Thanh khoản — Remove Liquidity
 * - [FR-02] Cung Cấp Thanh Khoản
 * - [FR-03] Rút Thanh Khoản
 * - [FR-02.4] ConfirmLiquidityDialog hiển thị tóm tắt trước khi gửi TX (Task 4.6)
 */

import * as React from "react";
import {
  Contract,
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
// [Task 4.6] Import ConfirmLiquidityDialog [FR-02.4]
import { ConfirmLiquidityDialog } from "@/components/web3/ConfirmLiquidityDialog";
import { useWeb3 } from "@/hooks/useWeb3";
import PairABI from "@/services/contracts/PairABI.json";
import deployedAddresses from "@/services/contracts/deployedAddresses.json";
import tokenList from "@/services/contracts/tokenList.json";
import { swapService, type PairReserves } from "@/services/swapService";
import type { TokenInfo } from "@/types/token";

type DeployAddressMap = {
  factory?: string;
  router?: string;
};

type LiquidityPosition = {
  pairAddress: string;
  token0: TokenInfo;
  token1: TokenInfo;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  userLpBalance: bigint;
  pooledToken0: bigint;
  pooledToken1: bigint;
  sharePercent: number;
};

const TOKENS = tokenList as TokenInfo[];
const DEPLOYED = deployedAddresses as DeployAddressMap;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";
const ALLOW_DEPLOYED_FALLBACK =
  process.env.NEXT_PUBLIC_ALLOW_DEPLOYED_FALLBACK === "true";
const SLIPPAGE_BPS = 100n;
const DEADLINE_SECONDS = 20 * 60;

const DEFAULT_TOKEN_A =
  TOKENS.find((token) => token.symbol === "USDT") ?? TOKENS[0] ?? null;
const DEFAULT_TOKEN_B =
  TOKENS.find((token) => token.symbol === "DAI") ?? TOKENS[1] ?? null;

function resolveConfiguredAddress(
  envValue: string | undefined,
  fileValue: string | undefined,
): string {
  if (envValue && isAddress(envValue) && envValue !== ZeroAddress) {
    return envValue;
  }

  if (
    ALLOW_DEPLOYED_FALLBACK &&
    fileValue &&
    isAddress(fileValue) &&
    fileValue !== ZeroAddress
  ) {
    return fileValue;
  }

  return "";
}

function isAmountInput(value: string): boolean {
  return /^\d*\.?\d*$/.test(value);
}

function isPercentInput(value: string): boolean {
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
  return raw.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
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

function resolveTokenMeta(address: string): TokenInfo {
  const found = TOKENS.find(
    (token) => token.address.toLowerCase() === address.toLowerCase(),
  );

  if (found) {
    return found;
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return {
    address,
    symbol: shortAddress,
    name: address,
    decimals: 18,
  };
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

  const [poolReserves, setPoolReserves] = React.useState<PairReserves | null>(
    null,
  );
  const [balanceA, setBalanceA] = React.useState<bigint>(0n);
  const [balanceB, setBalanceB] = React.useState<bigint>(0n);
  const [lpReceivedEstimate, setLpReceivedEstimate] = React.useState<bigint | null>(
    null,
  );

  const [liquidityPositions, setLiquidityPositions] = React.useState<
    LiquidityPosition[]
  >([]);
  const [selectedPairAddress, setSelectedPairAddress] = React.useState("");
  const [removePercentInput, setRemovePercentInput] = React.useState("25");
  const [lpAllowance, setLpAllowance] = React.useState<bigint>(0n);
  const [isLoadingLpAllowance, setIsLoadingLpAllowance] = React.useState(false);

  const [isLoadingPool, setIsLoadingPool] = React.useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStep, setSubmitStep] = React.useState("");
  const [uiError, setUiError] = React.useState<string | null>(null);

  // [Task 4.6] State mở/đóng ConfirmLiquidityDialog [FR-02.4]
  const [showConfirmLiquidityDialog, setShowConfirmLiquidityDialog] = React.useState(false);

  const readProvider = React.useMemo<Provider>(
    () => provider ?? new JsonRpcProvider(RPC_URL),
    [provider],
  );

  // [UC-02] Luong approve/allowance phai uu tien provider cua vi nguoi dung.
  const walletReadProvider = React.useMemo<Provider | null>(
    () => signer?.provider ?? provider ?? null,
    [provider, signer],
  );

  const routerAddress = React.useMemo(
    () =>
      resolveConfiguredAddress(
        process.env.NEXT_PUBLIC_ROUTER_ADDRESS,
        DEPLOYED.router,
      ),
    [],
  );

  const factoryAddress = React.useMemo(
    () =>
      resolveConfiguredAddress(
        process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
        DEPLOYED.factory,
      ),
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
    tokenA &&
      tokenB &&
      tokenA.address.toLowerCase() !== tokenB.address.toLowerCase(),
  );

  const hasExistingPool = Boolean(
    poolReserves &&
      poolReserves.pairAddress !== ZeroAddress &&
      poolReserves.reserveA > 0n &&
      poolReserves.reserveB > 0n,
  );

  const isCreatingPool = hasValidPair && !isLoadingPool && !hasExistingPool;

  const selectedPosition = React.useMemo(() => {
    if (liquidityPositions.length === 0) {
      return null;
    }

    const found = liquidityPositions.find(
      (position) =>
        position.pairAddress.toLowerCase() === selectedPairAddress.toLowerCase(),
    );

    return found ?? liquidityPositions[0];
  }, [liquidityPositions, selectedPairAddress]);

  const removePercent = React.useMemo(() => {
    const parsed = Number(removePercentInput);

    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.max(0, Math.min(100, parsed));
  }, [removePercentInput]);

  const removeBps = React.useMemo(
    () => BigInt(Math.round(removePercent * 100)),
    [removePercent],
  );

  const removeLpAmount = React.useMemo(() => {
    if (!selectedPosition || removeBps <= 0n) {
      return 0n;
    }

    return (selectedPosition.userLpBalance * removeBps) / 10000n;
  }, [removeBps, selectedPosition]);

  const previewToken0Amount = React.useMemo(() => {
    if (!selectedPosition || selectedPosition.totalSupply <= 0n || removeLpAmount <= 0n) {
      return 0n;
    }

    return (selectedPosition.reserve0 * removeLpAmount) / selectedPosition.totalSupply;
  }, [removeLpAmount, selectedPosition]);

  const previewToken1Amount = React.useMemo(() => {
    if (!selectedPosition || selectedPosition.totalSupply <= 0n || removeLpAmount <= 0n) {
      return 0n;
    }

    return (selectedPosition.reserve1 * removeLpAmount) / selectedPosition.totalSupply;
  }, [removeLpAmount, selectedPosition]);

  const balanceTextA = tokenA ? formatAmountDisplay(balanceA, tokenA.decimals) : "0";
  const balanceTextB = tokenB ? formatAmountDisplay(balanceB, tokenB.decimals) : "0";

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

    try {
      const [nextBalanceA, nextBalanceB] = await Promise.all([
        swapService.getTokenBalance(readProvider, tokenA.address, account),
        swapService.getTokenBalance(readProvider, tokenB.address, account),
      ]);

      setBalanceA(nextBalanceA);
      setBalanceB(nextBalanceB);
    } catch {
      setBalanceA(0n);
      setBalanceB(0n);
    }
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
        error instanceof Error ? error.message : "Không thể đọc trạng thái Pool.",
      );
    } finally {
      setIsLoadingPool(false);
    }
  }, [factoryAddress, hasValidPair, readProvider, tokenA, tokenB]);

  const refreshPositions = React.useCallback(async () => {
    if (!account || !factoryAddress) {
      setLiquidityPositions([]);
      setSelectedPairAddress("");
      return;
    }

    setIsLoadingPositions(true);

    try {
      const factory = swapService.getFactoryContract(readProvider, factoryAddress);
      const length = Number((await factory.allPairsLength()) as bigint);
      const nextPositions: LiquidityPosition[] = [];

      for (let index = 0; index < length; index += 1) {
        const pairAddress = (await factory.allPairs(index)) as string;

        if (!isAddress(pairAddress) || pairAddress === ZeroAddress) {
          continue;
        }

        const pair = new Contract(pairAddress, PairABI, readProvider);
        const userLpBalance = (await pair.balanceOf(account)) as bigint;

        if (userLpBalance <= 0n) {
          continue;
        }

        const totalSupply = (await pair.totalSupply()) as bigint;

        if (totalSupply <= 0n) {
          continue;
        }

        const reserves = (await pair.getReserves()) as [bigint, bigint, bigint];
        const token0Address = (await pair.token0()) as string;
        const token1Address = (await pair.token1()) as string;

        const token0 = resolveTokenMeta(token0Address);
        const token1 = resolveTokenMeta(token1Address);

        const pooledToken0 = (reserves[0] * userLpBalance) / totalSupply;
        const pooledToken1 = (reserves[1] * userLpBalance) / totalSupply;
        const sharePercent =
          Number((userLpBalance * 1_000_000n) / totalSupply) / 10_000;

        nextPositions.push({
          pairAddress,
          token0,
          token1,
          reserve0: reserves[0],
          reserve1: reserves[1],
          totalSupply,
          userLpBalance,
          pooledToken0,
          pooledToken1,
          sharePercent,
        });
      }

      setLiquidityPositions(nextPositions);
      setSelectedPairAddress((previous) => {
        if (nextPositions.length === 0) {
          return "";
        }

        if (
          previous &&
          nextPositions.some(
            (position) =>
              position.pairAddress.toLowerCase() === previous.toLowerCase(),
          )
        ) {
          return previous;
        }

        return nextPositions[0].pairAddress;
      });
    } catch (error) {
      setLiquidityPositions([]);
      setSelectedPairAddress("");
      setUiError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách LP positions.",
      );
    } finally {
      setIsLoadingPositions(false);
    }
  }, [account, factoryAddress, readProvider]);

  React.useEffect(() => {
    if (!routerAddress) {
      setUiError("Chưa cấu hình NEXT_PUBLIC_ROUTER_ADDRESS.");
      return;
    }

    if (!factoryAddress) {
      setUiError("Chưa cấu hình NEXT_PUBLIC_FACTORY_ADDRESS.");
      return;
    }

    setUiError(null);
  }, [factoryAddress, routerAddress]);

  React.useEffect(() => {
    void refreshPool();
  }, [refreshPool]);

  React.useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  React.useEffect(() => {
    if (activeTab !== "remove") {
      return;
    }

    void refreshPositions();
  }, [activeTab, refreshPositions]);

  React.useEffect(() => {
    if (!selectedPosition) {
      setLpAllowance(0n);
      return;
    }

    if (!account || !routerAddress || !walletReadProvider) {
      setLpAllowance(0n);
      return;
    }

    let cancelled = false;

    const loadLpAllowance = async () => {
      setIsLoadingLpAllowance(true);

      try {
        const allowance = await swapService.getAllowance(
          walletReadProvider,
          selectedPosition.pairAddress,
          account,
          routerAddress,
        );

        if (!cancelled) {
          setLpAllowance(allowance);
        }
      } catch {
        if (!cancelled) {
          setLpAllowance(0n);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLpAllowance(false);
        }
      }
    };

    void loadLpAllowance();

    return () => {
      cancelled = true;
    };
  }, [account, routerAddress, selectedPosition, walletReadProvider]);

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

    if (!tokenA || !tokenB || !signer || !account || !walletReadProvider) {
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
        walletReadProvider,
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
        walletReadProvider,
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

      showLiquidityToast("success", "add", tokenA.symbol, tokenB.symbol, addTx.hash);

      setLpReceivedEstimate(estimatedLiquidity);
      setAmountAInput("");
      setAmountBInput("");

      await Promise.all([refreshPool(), refreshBalances(), refreshPositions()]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Thêm thanh khoản thất bại.";

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
    refreshBalances,
    refreshPool,
    refreshPositions,
    routerAddress,
    signer,
    tokenA,
    tokenB,
    walletReadProvider,
  ]);

  const handleRemoveLiquidity = React.useCallback(async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!selectedPosition || !signer || !account || !walletReadProvider) {
      setUiError("Vui lòng chọn vị thế thanh khoản.");
      return;
    }

    if (!routerAddress) {
      setUiError("Chưa cấu hình NEXT_PUBLIC_ROUTER_ADDRESS.");
      return;
    }

    if (removeLpAmount <= 0n) {
      setUiError("Vui lòng chọn tỷ lệ LP cần rút.");
      return;
    }

    if (previewToken0Amount <= 0n || previewToken1Amount <= 0n) {
      setUiError("Số lượng ước tính nhận về không hợp lệ.");
      return;
    }

    setUiError(null);
    setIsSubmitting(true);

    try {
      setSubmitStep("Kiểm tra allowance LP token...");

      const allowance = await swapService.getAllowance(
        walletReadProvider,
        selectedPosition.pairAddress,
        account,
        routerAddress,
      );

      if (allowance < removeLpAmount) {
        setSubmitStep("Phê duyệt LP token...");
        showApproveToast(
          "pending",
          `${selectedPosition.token0.symbol}/${selectedPosition.token1.symbol} LP`,
        );

        const approveTx = await swapService.approveToken(
          signer,
          selectedPosition.pairAddress,
          routerAddress,
          removeLpAmount,
        );

        await approveTx.wait();

        showApproveToast(
          "success",
          `${selectedPosition.token0.symbol}/${selectedPosition.token1.symbol} LP`,
          approveTx.hash,
        );
      }

      const amount0Min = (previewToken0Amount * (10000n - SLIPPAGE_BPS)) / 10000n;
      const amount1Min = (previewToken1Amount * (10000n - SLIPPAGE_BPS)) / 10000n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);

      setSubmitStep("Gửi giao dịch rút thanh khoản...");
      showLiquidityToast(
        "pending",
        "remove",
        selectedPosition.token0.symbol,
        selectedPosition.token1.symbol,
      );

      const removeTx = await swapService.removeLiquidity(
        signer,
        selectedPosition.token0.address,
        selectedPosition.token1.address,
        removeLpAmount,
        amount0Min,
        amount1Min,
        account,
        deadline,
      );

      await removeTx.wait();

      showLiquidityToast(
        "success",
        "remove",
        selectedPosition.token0.symbol,
        selectedPosition.token1.symbol,
        removeTx.hash,
      );

      setRemovePercentInput("25");
      await Promise.all([refreshPositions(), refreshPool(), refreshBalances()]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Rút thanh khoản thất bại.";

      setUiError(message);
      showLiquidityToast(
        "error",
        "remove",
        selectedPosition.token0.symbol,
        selectedPosition.token1.symbol,
        undefined,
        message,
      );
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  }, [
    account,
    connectWallet,
    isConnected,
    previewToken0Amount,
    previewToken1Amount,
    refreshBalances,
    refreshPool,
    refreshPositions,
    removeLpAmount,
    routerAddress,
    selectedPosition,
    signer,
    walletReadProvider,
  ]);

  const addActionLabel = React.useMemo(() => {
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

  const removeActionLabel = React.useMemo(() => {
    if (isConnecting) {
      return "Đang kết nối ví...";
    }

    if (!isConnected) {
      return "Kết nối Ví";
    }

    if (isSubmitting) {
      return submitStep || "Đang xử lý...";
    }

    if (!selectedPosition) {
      return "Chọn vị thế";
    }

    if (removeLpAmount <= 0n) {
      return "Chọn tỷ lệ rút";
    }

    if (isLoadingLpAllowance) {
      return "Đang kiểm tra allowance...";
    }

    if (lpAllowance < removeLpAmount) {
      return "Phê duyệt LP Token";
    }

    return "Rút Thanh Khoản";
  }, [
    isConnected,
    isConnecting,
    isLoadingLpAllowance,
    isSubmitting,
    lpAllowance,
    removeLpAmount,
    selectedPosition,
    submitStep,
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
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-900">My Positions</h2>
                {isLoadingPositions && (
                  <Loader2Icon className="size-4 animate-spin text-slate-400" />
                )}
              </div>

              {liquidityPositions.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Chưa có LP position nào trong ví hiện tại.
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {liquidityPositions.map((position) => {
                    const isSelected =
                      selectedPosition?.pairAddress.toLowerCase() ===
                      position.pairAddress.toLowerCase();

                    return (
                      <button
                        key={position.pairAddress}
                        onClick={() => setSelectedPairAddress(position.pairAddress)}
                        className={[
                          "w-full rounded-xl border px-3 py-2 text-left transition-colors duration-200",
                          isSelected
                            ? "border-sky-300 bg-sky-50"
                            : "border-slate-200 bg-white hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {position.token0.symbol} / {position.token1.symbol}
                          </span>
                          <span className="text-xs font-mono text-slate-600">
                            LP: {formatAmountDisplay(position.userLpBalance, 18)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Your share: {formatRatio(position.sharePercent, 4)}%
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-mono">
                          {position.token0.symbol}: {formatAmountDisplay(position.pooledToken0, position.token0.decimals)} | {" "}
                          {position.token1.symbol}: {formatAmountDisplay(position.pooledToken1, position.token1.decimals)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedPosition && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Cặp được chọn</span>
                  <span className="font-semibold text-slate-900">
                    {selectedPosition.token0.symbol} / {selectedPosition.token1.symbol}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => setRemovePercentInput(String(value))}
                      className={[
                        "rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors duration-200",
                        removePercent === value
                          ? "border-sky-300 bg-sky-50 text-sky-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {value}%
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={removePercent}
                  onChange={(event) => setRemovePercentInput(event.target.value)}
                  className="w-full accent-sky-500"
                />

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Tỷ lệ rút</span>
                  <Input
                    value={removePercentInput}
                    onChange={(event) => {
                      const next = event.target.value.trim();
                      if (isPercentInput(next)) {
                        setRemovePercentInput(next);
                      }
                    }}
                    className="h-8 w-24 text-right font-mono"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">LP sẽ đốt</span>
                    <span className="text-slate-900">
                      {formatAmountDisplay(removeLpAmount, 18)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ước tính nhận {selectedPosition.token0.symbol}</span>
                    <span className="text-slate-900">
                      {formatAmountDisplay(
                        previewToken0Amount,
                        selectedPosition.token0.decimals,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ước tính nhận {selectedPosition.token1.symbol}</span>
                    <span className="text-slate-900">
                      {formatAmountDisplay(
                        previewToken1Amount,
                        selectedPosition.token1.decimals,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {(walletError || uiError) && (
              <div className="rounded-xl bg-red-500/10 border border-red-200 text-red-700 text-xs px-3 py-2 mt-3 wrap-break-word">
                {walletError ?? uiError}
              </div>
            )}

            <button
              disabled={isSubmitting || isConnecting || isLoadingPositions}
              onClick={() => {
                if (!isConnected) {
                  void connectWallet();
                  return;
                }

                void handleRemoveLiquidity();
              }}
              className={[
                "w-full mt-4 rounded-xl py-3 text-lg font-semibold",
                "border border-red-200 bg-white text-red-600",
                "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-red-50",
                (isSubmitting || isConnecting || isLoadingPositions) &&
                  "opacity-80 cursor-not-allowed",
              ].join(" ")}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {(isSubmitting || isConnecting) && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {removeActionLabel}
              </span>
            </button>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Token A</span>
                <span className="text-xs text-slate-500 font-mono">Số dư: {balanceTextA}</span>
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
                <span className="text-xs text-slate-500 font-mono">Số dư: {balanceTextB}</span>
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

            {/*
             * [Task 4.6] Nút "Thêm Thanh Khoản" giờ mở ConfirmLiquidityDialog
             * thay vì gọi handleAddLiquidity() trực tiếp [FR-02.4]
             */}
            <button
              disabled={isSubmitting || isConnecting}
              onClick={() => {
                if (!isConnected) {
                  void connectWallet();
                  return;
                }
                // [Task 4.6] Mở ConfirmLiquidityDialog khi đã đủ thông tin
                if (tokenA && tokenB && parsedAmountA && parsedAmountB) {
                  setShowConfirmLiquidityDialog(true);
                } else {
                  void handleAddLiquidity();
                }
              }}
              className={[
                "w-full mt-4 rounded-xl py-3 text-lg font-semibold text-white",
                "bg-gradient-to-r from-sky-400 to-blue-500",
                "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/25",
                (isSubmitting || isConnecting) && "opacity-80 cursor-not-allowed",
              ].join(" ")}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {(isSubmitting || isConnecting) && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {addActionLabel}
              </span>
            </button>
          </>
        )}
      </div>

      {/* ── [Task 4.6] ConfirmLiquidityDialog [FR-02.4] [UC-04] ── */}
      {/*
       * Modal xác nhận trước khi gửi TX Add Liquidity
       * Hiển thị: tokenA/B + amountA/B, LP token estimate, Share of Pool, Exchange Rate
       * onConfirm → handleAddLiquidity() gửi TX on-chain
       * [frontend-design.md §4] Fade/Zoom animation từ shadcn Dialog
       */}
      {tokenA && tokenB && (
        <ConfirmLiquidityDialog
          open={showConfirmLiquidityDialog}
          onOpenChange={(open) => {
            if (!isSubmitting) setShowConfirmLiquidityDialog(open);
          }}
          tokenA={tokenA}
          tokenB={tokenB}
          amountA={amountAInput}
          amountB={amountBInput}
          shareText={shareText}
          lpEstimate={
            lpReceivedEstimate !== null
              ? formatAmountDisplay(lpReceivedEstimate, 18)
              : null
          }
          exchangeRate={exchangeRateText}
          isLoading={isSubmitting}
          loadingStep={submitStep}
          onConfirm={() => {
            void handleAddLiquidity().then(() => {
              // Đóng dialog sau khi xử lý xong (thành công hoặc lỗi)
              setShowConfirmLiquidityDialog(false);
            });
          }}
        />
      )}
    </div>
  );
}
