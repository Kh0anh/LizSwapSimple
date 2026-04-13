# 1. System Context (Cấp 1 - Ngữ Cảnh Hệ Thống)

> **Phiên bản:** v1 | **Ngày tạo:** 9 tháng 4 năm 2026 | **Tác giả:** Khanh

Mô tả bức tranh toàn cảnh về việc ai sẽ sử dụng hệ thống và hệ thống tương tác với các yếu tố bên ngoài nào, đảm bảo đáp ứng các Use Case cốt lõi trong SRS.

```mermaid
C4Context
title System Context diagram for LizSwapSimple

Person(user, "User", "Trader (Swap - [UC-03]) hoặc LP (Add/Remove Liquidity - [UC-04, UC-05]).")

System(lizswap, "LizSwapSimple", "Nền tảng DEX hỗ trợ giao dịch và tạo lập thị trường (AMM).")

System_Ext(bsc, "Binance Smart Chain (BSC)", "Mạng lưới blockchain công khai thực thi Smart Contract.")
System_Ext(wallet, "Web3 Wallet (MetaMask)", "Ví quản lý Private Key và ký Transaction [UC-01, UC-02].")

Rel(user, lizswap, "Gửi yêu cầu Swap [UC-03] / Add Liquidity [UC-04] / Remove [UC-05]", "HTTPS/UI")
Rel(user, wallet, "Phê duyệt giao dịch (Approve) [UC-02]", "Extension/App")
Rel(lizswap, wallet, "Yêu cầu kết nối [UC-01] & Ký giao dịch", "EIP-1193")
Rel(lizswap, bsc, "Truy vấn trạng thái, đọc phí, giả lập TX", "JSON-RPC")
Rel(wallet, bsc, "Gửi Signed Transaction lên mạng", "JSON-RPC")
```
