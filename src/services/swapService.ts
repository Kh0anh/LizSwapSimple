import {
  Contract,
  JsonRpcProvider,
  ZeroAddress,
  getAddress,
  isAddress,
  type BigNumberish,
  type ContractRunner,
  type ContractTransactionResponse,
  type Provider,
  type Signer,
} from "ethers";

import ERC20ABI from "./contracts/ERC20ABI.json";
import FactoryABI from "./contracts/FactoryABI.json";
import PairABI from "./contracts/PairABI.json";
import RouterABI from "./contracts/RouterABI.json";
import deployedAddresses from "./contracts/deployedAddresses.json";

type DeployedAddressMap = {
  factory?: string;
  router?: string;
  mockUSDT?: string;
  mockDAI?: string;
  weth?: string;
};

export type PairReserves = {
  pairAddress: string;
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  reserveA: bigint;
  reserveB: bigint;
  blockTimestampLast: bigint;
};

const DEFAULT_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";
const addressMap = deployedAddresses as DeployedAddressMap;

let readProvider: JsonRpcProvider | null = null;

function normalizeAddress(address: string | null | undefined): string {
  if (!address || !isAddress(address)) {
    return ZeroAddress;
  }

  return getAddress(address);
}

function requireAddress(address: string, label: string): string {
  const normalized = normalizeAddress(address);

  if (normalized === ZeroAddress) {
    throw new Error(`${label} is invalid or missing.`);
  }

  return normalized;
}

function getReadProvider(provider?: Provider): Provider {
  if (provider) {
    return provider;
  }

  if (!readProvider) {
    readProvider = new JsonRpcProvider(DEFAULT_RPC_URL);
  }

  return readProvider;
}

function resolveRouterAddress(override?: string): string {
  const fromOverride = normalizeAddress(override);
  if (fromOverride !== ZeroAddress) {
    return fromOverride;
  }

  const fromEnv = normalizeAddress(process.env.NEXT_PUBLIC_ROUTER_ADDRESS);
  if (fromEnv !== ZeroAddress) {
    return fromEnv;
  }

  const fromFile = normalizeAddress(addressMap.router);
  if (fromFile !== ZeroAddress) {
    return fromFile;
  }

  throw new Error(
    "Router address is not configured. Set NEXT_PUBLIC_ROUTER_ADDRESS or src/services/contracts/deployedAddresses.json.",
  );
}

function resolveFactoryAddress(override?: string): string {
  const fromOverride = normalizeAddress(override);
  if (fromOverride !== ZeroAddress) {
    return fromOverride;
  }

  const fromEnv = normalizeAddress(process.env.NEXT_PUBLIC_FACTORY_ADDRESS);
  if (fromEnv !== ZeroAddress) {
    return fromEnv;
  }

  const fromFile = normalizeAddress(addressMap.factory);
  if (fromFile !== ZeroAddress) {
    return fromFile;
  }

  throw new Error(
    "Factory address is not configured. Set NEXT_PUBLIC_FACTORY_ADDRESS or src/services/contracts/deployedAddresses.json.",
  );
}

function normalizePath(path: string[]): string[] {
  if (path.length < 2) {
    throw new Error("Swap path must contain at least 2 token addresses.");
  }

  return path.map((address, index) =>
    requireAddress(address, `path[${index}]`),
  );
}

function createRouterContract(runner: ContractRunner, routerAddress?: string): Contract {
  return new Contract(resolveRouterAddress(routerAddress), RouterABI, runner);
}

function createFactoryContract(
  runner: ContractRunner,
  factoryAddress?: string,
): Contract {
  return new Contract(resolveFactoryAddress(factoryAddress), FactoryABI, runner);
}

function createPairContract(pairAddress: string, runner: ContractRunner): Contract {
  return new Contract(requireAddress(pairAddress, "pairAddress"), PairABI, runner);
}

function createErc20Contract(tokenAddress: string, runner: ContractRunner): Contract {
  return new Contract(requireAddress(tokenAddress, "tokenAddress"), ERC20ABI, runner);
}

async function approveToken(
  signer: Signer,
  tokenAddress: string,
  spenderAddress: string,
  amount: BigNumberish,
): Promise<ContractTransactionResponse> {
  // [UC-02] approve token allowance cho Router/Pair trước khi write actions.
  const token = createErc20Contract(tokenAddress, signer);
  const tx = await token.approve(requireAddress(spenderAddress, "spenderAddress"), amount);
  return tx as ContractTransactionResponse;
}

async function getAllowance(
  provider: Provider,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
): Promise<bigint> {
  const token = createErc20Contract(tokenAddress, getReadProvider(provider));
  const allowance = await token.allowance(
    requireAddress(ownerAddress, "ownerAddress"),
    requireAddress(spenderAddress, "spenderAddress"),
  );
  return allowance as bigint;
}

async function getAmountsOut(
  provider: Provider,
  amountIn: BigNumberish,
  path: string[],
): Promise<bigint[]> {
  const router = createRouterContract(getReadProvider(provider));
  const amounts = await router.getAmountsOut(amountIn, normalizePath(path));
  return amounts as bigint[];
}

async function swapExactTokensForTokens(
  signer: Signer,
  amountIn: BigNumberish,
  amountOutMin: BigNumberish,
  path: string[],
  to: string,
  deadline: BigNumberish,
): Promise<ContractTransactionResponse> {
  const router = createRouterContract(signer);
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    normalizePath(path),
    requireAddress(to, "to"),
    deadline,
  );
  return tx as ContractTransactionResponse;
}

async function addLiquidity(
  signer: Signer,
  tokenA: string,
  tokenB: string,
  amountADesired: BigNumberish,
  amountBDesired: BigNumberish,
  amountAMin: BigNumberish,
  amountBMin: BigNumberish,
  to: string,
  deadline: BigNumberish,
): Promise<ContractTransactionResponse> {
  const router = createRouterContract(signer);
  const tx = await router.addLiquidity(
    requireAddress(tokenA, "tokenA"),
    requireAddress(tokenB, "tokenB"),
    amountADesired,
    amountBDesired,
    amountAMin,
    amountBMin,
    requireAddress(to, "to"),
    deadline,
  );
  return tx as ContractTransactionResponse;
}

async function removeLiquidity(
  signer: Signer,
  tokenA: string,
  tokenB: string,
  liquidity: BigNumberish,
  amountAMin: BigNumberish,
  amountBMin: BigNumberish,
  to: string,
  deadline: BigNumberish,
): Promise<ContractTransactionResponse> {
  const router = createRouterContract(signer);
  const tx = await router.removeLiquidity(
    requireAddress(tokenA, "tokenA"),
    requireAddress(tokenB, "tokenB"),
    liquidity,
    amountAMin,
    amountBMin,
    requireAddress(to, "to"),
    deadline,
  );
  return tx as ContractTransactionResponse;
}

async function getReserves(
  provider: Provider,
  factoryAddress: string,
  tokenA: string,
  tokenB: string,
): Promise<PairReserves> {
  const read = getReadProvider(provider);
  const normalizedTokenA = requireAddress(tokenA, "tokenA");
  const normalizedTokenB = requireAddress(tokenB, "tokenB");

  const factory = createFactoryContract(read, factoryAddress);
  const pairAddress = normalizeAddress(
    (await factory.getPair(normalizedTokenA, normalizedTokenB)) as string,
  );

  if (pairAddress === ZeroAddress) {
    return {
      pairAddress: ZeroAddress,
      token0: ZeroAddress,
      token1: ZeroAddress,
      reserve0: 0n,
      reserve1: 0n,
      reserveA: 0n,
      reserveB: 0n,
      blockTimestampLast: 0n,
    };
  }

  const pair = createPairContract(pairAddress, read);
  const [reserve0, reserve1, blockTimestampLast] =
    (await pair.getReserves()) as [bigint, bigint, bigint];
  const token0 = normalizeAddress((await pair.token0()) as string);
  const token1 = normalizeAddress((await pair.token1()) as string);

  const reserveA = normalizedTokenA === token0 ? reserve0 : reserve1;
  const reserveB = normalizedTokenA === token0 ? reserve1 : reserve0;

  return {
    pairAddress,
    token0,
    token1,
    reserve0,
    reserve1,
    reserveA,
    reserveB,
    blockTimestampLast,
  };
}

async function quote(
  provider: Provider,
  amountA: BigNumberish,
  reserveA: BigNumberish,
  reserveB: BigNumberish,
): Promise<bigint> {
  const router = createRouterContract(getReadProvider(provider));
  const quoted = await router.quote(amountA, reserveA, reserveB);
  return quoted as bigint;
}

async function getTokenBalance(
  provider: Provider,
  tokenAddress: string,
  account: string,
): Promise<bigint>;
async function getTokenBalance(tokenAddress: string, account: string): Promise<bigint>;
async function getTokenBalance(
  providerOrTokenAddress: Provider | string,
  tokenAddressOrAccount: string,
  maybeAccount?: string,
): Promise<bigint> {
  const provider =
    typeof providerOrTokenAddress === "string"
      ? getReadProvider()
      : getReadProvider(providerOrTokenAddress);

  const tokenAddress =
    typeof providerOrTokenAddress === "string"
      ? providerOrTokenAddress
      : tokenAddressOrAccount;

  const account =
    typeof providerOrTokenAddress === "string"
      ? tokenAddressOrAccount
      : maybeAccount;

  const normalizedAccount = requireAddress(account ?? "", "account");
  const normalizedTokenAddress = normalizeAddress(tokenAddress);

  // Hỗ trợ token native (địa chỉ zero) cho UI hiển thị số dư BNB.
  if (normalizedTokenAddress === ZeroAddress) {
    return provider.getBalance(normalizedAccount);
  }

  // Return zero when address has no contract code on the current network
  // to avoid BAD_DATA from calling ERC20 methods on non-contract addresses.
  const code = await provider.getCode(normalizedTokenAddress);
  if (code === "0x") {
    return 0n;
  }

  const token = createErc20Contract(normalizedTokenAddress, provider);
  try {
    const balance = await token.balanceOf(normalizedAccount);
    return balance as bigint;
  } catch (error) {
    const codeValue =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";

    if (codeValue === "BAD_DATA") {
      return 0n;
    }

    throw error;
  }
}

export const swapService = {
  getRouterContract: (signer: Signer): Contract => createRouterContract(signer),
  getFactoryContract: (
    runner: ContractRunner,
    factoryAddress?: string,
  ): Contract => createFactoryContract(runner, factoryAddress),
  approveToken,
  getAllowance,
  getAmountsOut,
  swapExactTokensForTokens,
  addLiquidity,
  removeLiquidity,
  getReserves,
  getTokenBalance,
  quote,
};

export type SwapService = typeof swapService;
