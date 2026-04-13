# 2. Container (Cấp 2 - Khối Chứa)

> **Phiên bản:** v1 | **Ngày tạo:** 9 tháng 4 năm 2026 | **Tác giả:** Khanh

Mổ xẻ "LizSwapSimple System" thành các vùng thực thi (Container) độc lập. Do dự án yêu cầu [NFR-01] (Không Backend Database) và [NFR-02] (Frontend Tĩnh Nhanh Chóng), kiến trúc ở cấp độ này rất tinh gọn.

```mermaid
C4Container
title Container diagram for LizSwapSimple System

Person(user, "User", "Trader hoặc Liquidity Provider.")

System_Boundary(c1, "LizSwapSimple System") {
    Container(ui, "Static Web App", "Next.js, Static HTML/JS", "Giao diện cung cấp cho người dùng tương tác, đáp ứng NFR-02. Chạy nội bộ trên trình duyệt.")
    Container(sc, "Smart Contract Ecosystem", "Solidity (EVM)", "Hệ sinh thái các contract lõi quản lý Pool và logic AMM trên mạng BSC thay cho Database NFR-01.")
}

System_Ext(wallet, "Web3 Wallet (MetaMask)", "Wallet Provider")
System_Ext(bsc, "BSC Network nodes", "RPC Provider")

Rel(user, ui, "Tương tác với ứng dụng web để kích hoạt UC-03, UC-04, UC-05", "Browser")
Rel(ui, wallet, "Kết nối ví (UC-01) và Approve (UC-02)", "window.ethereum")
Rel(ui, bsc, "Truy xuất số dư, trạng thái của contract", "JSON-RPC (ether.js/viem)")
Rel(wallet, bsc, "Broadcast giao dịch để tương tác với Smart Contract", "RPC")
Rel(bsc, sc, "Đọc/Ghi trạng thái State của DEX", "EVM Runtime")
```
