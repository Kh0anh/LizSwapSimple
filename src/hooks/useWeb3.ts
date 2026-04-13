"use client";

import { BrowserProvider, JsonRpcSigner, getAddress } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";

type Eip1193RequestArguments = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

interface Eip1193Provider {
  request: (args: Eip1193RequestArguments) => Promise<unknown>;
  on: (
    eventName: "accountsChanged" | "chainChanged",
    listener: (...args: unknown[]) => void,
  ) => void;
  removeListener: (
    eventName: "accountsChanged" | "chainChanged",
    listener: (...args: unknown[]) => void,
  ) => void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export interface UseWeb3Result {
  account: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const ETH_REQUEST_ACCOUNTS = "eth_requestAccounts";
const ETH_ACCOUNTS = "eth_accounts";

function normalizeAccounts(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function formatProviderError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    if (code === 4001) {
      return "Ban da tu choi ket noi vi.";
    }

    if (code === -32002) {
      return "MetaMask dang cho xac nhan. Vui long mo extension vi.";
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Khong the ket noi vi. Vui long thu lai.";
}

export function useWeb3(): UseWeb3Result {
  const expectedChainId = useMemo(() => {
    const rawValue = process.env.NEXT_PUBLIC_CHAIN_ID;

    if (!rawValue) {
      return null;
    }

    const parsed = Number(rawValue);
    return Number.isInteger(parsed) ? parsed : null;
  }, []);

  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = Boolean(account && provider && signer);

  const resetState = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);
    setIsConnecting(false);
  }, []);

  const validateChain = useCallback(
    (nextChainId: number) => {
      if (expectedChainId !== null && nextChainId !== expectedChainId) {
        setError(
          `Sai mang. Vui long chuyen MetaMask sang chainId ${expectedChainId}.`,
        );
        return false;
      }

      setError(null);
      return true;
    },
    [expectedChainId],
  );

  const syncStateFromProvider = useCallback(
    async (nextProvider: BrowserProvider) => {
      const nextSigner = await nextProvider.getSigner();
      const nextAccount = getAddress(await nextSigner.getAddress());
      const network = await nextProvider.getNetwork();
      const nextChainId = Number(network.chainId);

      setProvider(nextProvider);
      setSigner(nextSigner);
      setAccount(nextAccount);
      setChainId(nextChainId);
      validateChain(nextChainId);
    },
    [validateChain],
  );

  const requestNetworkSwitch = useCallback(async () => {
    if (
      expectedChainId === null ||
      typeof window === "undefined" ||
      !window.ethereum
    ) {
      return;
    }

    const chainIdHex = `0x${expectedChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError) {
      if (
        typeof switchError === "object" &&
        switchError !== null &&
        "code" in switchError &&
        (switchError as { code?: unknown }).code === 4902
      ) {
        setError(
          `Mang chainId ${expectedChainId} chua co trong vi. Vui long them mang truoc.`,
        );
        return;
      }

      setError(`Vui long chuyen vi sang chainId ${expectedChainId}.`);
    }
  }, [expectedChainId]);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("Vui long cai dat MetaMask.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const nextProvider = new BrowserProvider(window.ethereum);
      await nextProvider.send(ETH_REQUEST_ACCOUNTS, []);
      await syncStateFromProvider(nextProvider);

      const network = await nextProvider.getNetwork();
      const nextChainId = Number(network.chainId);

      if (expectedChainId !== null && nextChainId !== expectedChainId) {
        await requestNetworkSwitch();
      }
    } catch (connectError) {
      setError(formatProviderError(connectError));
    } finally {
      setIsConnecting(false);
    }
  }, [expectedChainId, requestNetworkSwitch, syncStateFromProvider]);

  const disconnectWallet = useCallback(() => {
    resetState();
  }, [resetState]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    const bootstrap = async () => {
      try {
        const nextProvider = new BrowserProvider(window.ethereum as Eip1193Provider);
        const accounts = normalizeAccounts(await nextProvider.send(ETH_ACCOUNTS, []));

        if (accounts.length === 0) {
          return;
        }

        await syncStateFromProvider(nextProvider);
      } catch (bootstrapError) {
        setError(formatProviderError(bootstrapError));
      }
    };

    void bootstrap();
  }, [syncStateFromProvider]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    const injectedProvider = window.ethereum;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const changedAccounts = normalizeAccounts(args[0]);

      if (changedAccounts.length === 0) {
        resetState();
        return;
      }

      try {
        const nextProvider = new BrowserProvider(injectedProvider);
        await syncStateFromProvider(nextProvider);
      } catch (accountsError) {
        setError(formatProviderError(accountsError));
      }
    };

    const handleChainChanged = async (...args: unknown[]) => {
      const rawChainId = args[0];

      if (typeof rawChainId === "string") {
        const parsedChainId = Number.parseInt(rawChainId, 16);

        if (!Number.isNaN(parsedChainId)) {
          setChainId(parsedChainId);
          validateChain(parsedChainId);
        }
      }

      try {
        const nextProvider = new BrowserProvider(injectedProvider);
        const accounts = normalizeAccounts(await nextProvider.send(ETH_ACCOUNTS, []));

        if (accounts.length === 0) {
          resetState();
          return;
        }

        await syncStateFromProvider(nextProvider);
      } catch (chainError) {
        setError(formatProviderError(chainError));
      }
    };

    injectedProvider.on("accountsChanged", handleAccountsChanged);
    injectedProvider.on("chainChanged", handleChainChanged);

    return () => {
      injectedProvider.removeListener("accountsChanged", handleAccountsChanged);
      injectedProvider.removeListener("chainChanged", handleChainChanged);
    };
  }, [resetState, syncStateFromProvider, validateChain]);

  return {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
  };
}
