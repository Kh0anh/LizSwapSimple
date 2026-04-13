"use client";

import { Loader2, Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/hooks/useWeb3";

const baseButtonClassName =
  "rounded-full px-6 py-2.5 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/25";
const gradientClassName = "bg-gradient-to-r from-sky-400 to-blue-500 text-white";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * [UC-01] Wallet Connect Button
 * - Chua ket noi: hien thi CTA ket noi vi
 * - Dang ket noi: khoa button va hien thi spinner
 * - Da ket noi: hien thi dia chi rut gon va menu ngat ket noi
 */
export function WalletConnectButton() {
  const { account, isConnecting, isConnected, connectWallet, disconnectWallet } =
    useWeb3();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayAddress = useMemo(() => {
    if (!account) {
      return null;
    }

    return shortenAddress(account);
  }, [account]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setIsMenuOpen(false);
  };

  if (isConnecting) {
    return (
      <Button
        type="button"
        variant="gradient"
        className={`${baseButtonClassName} ${gradientClassName}`}
        disabled
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Đang kết nối...
      </Button>
    );
  }

  if (isConnected && displayAddress) {
    return (
      <div ref={menuRef} className="relative">
        <Button
          type="button"
          variant="outline"
          className={`${baseButtonClassName} border-slate-200 bg-white text-slate-900`}
          onClick={() => setIsMenuOpen((prevState) => !prevState)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <Wallet className="size-4" aria-hidden="true" />
          <span className="font-mono">{displayAddress}</span>
        </Button>

        {isMenuOpen ? (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleDisconnectWallet}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors duration-200 hover:bg-red-50"
            >
              Ngắt kết nối
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="gradient"
      className={`${baseButtonClassName} ${gradientClassName}`}
      onClick={() => {
        void handleConnectWallet();
      }}
    >
      Kết nối Ví
    </Button>
  );
}