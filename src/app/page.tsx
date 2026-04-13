"use client";

/**
 * [FR-01] Home Page — LizSwapSimple DEX (Swap Page Scaffold)
 *
 * Task 4.1 Demo: Tích hợp TokenSelector component để verify hoạt động.
 * Task 4.2 sẽ hoàn thiện toàn bộ Swap UI (quote, price impact, execute).
 *
 * Yêu cầu liên quan:
 * - [FR-01.2] Chọn token Input / Output — dùng TokenSelector
 */

import * as React from "react";
import { ArrowDownUpIcon } from "lucide-react";

import { TokenSelector } from "@/components/web3/TokenSelector";
import type { TokenInfo } from "@/types/token";

export default function HomePage() {
  // [FR-01.2] State: token đang chọn ở ô Input và Output
  const [tokenIn, setTokenIn] = React.useState<TokenInfo | null>(null);
  const [tokenOut, setTokenOut] = React.useState<TokenInfo | null>(null);

  return (
    // [frontend-design.md §2.1] bg-slate-50 từ RootLayout
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      {/*
       * [FR-01] SwapCard placeholder
       * [frontend-design.md §2.1] bg-white card + shadow-sm + border-slate-200
       * [frontend-design.md §4] rounded-2xl
       */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-slate-900">Swap</h1>
          {/* Task 4.2 sẽ thêm Settings (Slippage) ở đây */}
        </div>

        {/* Input Token Section */}
        {/**
         * [FR-01.2] Ô Token nguồn (From)
         * TokenSelector chọn token + Input nhập số lượng (Task 4.2)
         */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Từ</span>
            {/* Task 4.2: hiển thị balance của tokenIn */}
          </div>
          <div className="flex items-center gap-3">
            {/* [FR-01.2] TokenSelector — chọn token nguồn */}
            <TokenSelector
              selectedToken={tokenIn}
              onSelect={setTokenIn}
              disabledToken={tokenOut?.address}
              label=""
            />
            {/* Task 4.2: Input amount sẽ thêm ở đây */}
            <div className="flex-1 text-right">
              <span className="text-2xl font-semibold text-slate-300">0</span>
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        {/**
         * [FR-01.2] Nút đảo chiều swap (In ↔ Out)
         * [frontend-design.md §4] hover:scale-[1.05] micro-animation
         */}
        <div className="flex justify-center my-1">
          <button
            className="rounded-full bg-white border border-slate-200 p-1.5 shadow-sm hover:bg-slate-50 transition-all duration-200 hover:scale-[1.05] active:scale-95"
            onClick={() => {
              // [FR-01.2] Đảo chiều token In/Out
              const temp = tokenIn;
              setTokenIn(tokenOut);
              setTokenOut(temp);
            }}
          >
            <ArrowDownUpIcon className="size-4 text-slate-500" />
          </button>
        </div>

        {/* Output Token Section */}
        {/**
         * [FR-01.2] Ô Token đích (To)
         */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Đến</span>
          </div>
          <div className="flex items-center gap-3">
            {/* [FR-01.2] TokenSelector — chọn token đích */}
            <TokenSelector
              selectedToken={tokenOut}
              onSelect={setTokenOut}
              disabledToken={tokenIn?.address}
              label=""
            />
            {/* Task 4.2: Output amount (calculated) sẽ thêm ở đây */}
            <div className="flex-1 text-right">
              <span className="text-2xl font-semibold text-slate-300">0</span>
            </div>
          </div>
        </div>

        {/* Swap Button Placeholder */}
        {/**
         * [UC-03] Nút Swap chính — sẽ hoàn thiện ở Task 4.2
         * [frontend-design.md §2.2] gradient sky-400 → blue-500
         * [frontend-design.md §4] hover:scale-[1.02] active:scale-[0.98]
         */}
        <button
          disabled
          className="w-full mt-4 h-12 rounded-xl font-semibold text-white
            bg-gradient-to-r from-sky-400 to-blue-500
            opacity-40 cursor-not-allowed"
        >
          {tokenIn && tokenOut ? "Nhập số lượng" : "Chọn token"}
        </button>

        {/* Task note */}
        <p className="text-center text-xs text-slate-400 mt-3">
          Task 4.2 sẽ hoàn thiện logic Swap đầy đủ
        </p>
      </div>
    </div>
  );
}
