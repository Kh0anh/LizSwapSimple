# 3. Component (Cấp 3 - Thành Phần)

> **Phiên bản:** v1 | **Ngày tạo:** 9 tháng 4 năm 2026 | **Tác giả:** Khanh

Tập trung đi sâu vào hai Container cốt lõi: **Static Web App** (Frontend) và **Smart Contract Ecosystem**. Ở đây sẽ diễn giải rõ cách các luồng chức năng (FR) được xử lý bởi component nào.

## 3.1. Phân rã Smart Contract Ecosystem
Lõi AMM dựa trên kiến trúc của Uniswap V2.

```mermaid
C4Component
title Component diagram for Smart Contract Ecosystem

Container_Boundary(sc, "Smart Contract Ecosystem") {
    Component(router, "LizSwapRouter", "Solidity", "Lớp ngoại vi. Logic xử lý lệnh Swap [FR-01.5], Add Liquidity [FR-02.4] và Remove Liquidity [FR-03.3].")
    Component(factory, "LizSwapFactory", "Solidity", "Tạo và theo dõi registry của tất cả các Pair (Pool).")
    Component(pair, "LizSwapPair (Pool)", "Solidity", "Xử lý lõi AMM (x*y=k), giữ tiền và kiểm soát token của LP.")
}

System_Ext(tokenA, "Token ERC20/BEP20 A", "Asset")
System_Ext(tokenB, "Token ERC20/BEP20 B", "Asset")

Rel(router, factory, "Lấy địa chỉ Pool (getPair)")
Rel(factory, pair, "Deploy & tạo địa chỉ Pool mới (createPair)")
Rel(router, pair, "Truyền lệnh Swap [UC-03], Add/Remove [UC-04, UC-05]")
Rel(pair, tokenA, "Chuyển tiền qua lại")
Rel(pair, tokenB, "Chuyển tiền qua lại")
```

## 3.2. Phân rã Static Web App
Các khối giao diện đảm bảo tính linh hoạt [NFR-03].

```mermaid
C4Component
title Component diagram for Static Web App

Container_Boundary(ui, "Static Web App (Next.js)") {
    Component(ui_pages, "Next.js Pages", "React", "Page Home xử lý [FR-01]. Page Pool xử lý [FR-02, FR-03].")
    Component(ui_hooks, "Web3 Hooks/Context", "React / Wagmi", "Nhận dạng địa chỉ ví [FR-01.1].")
    Component(ui_services, "Contract Services", "ether.js / viem", "Định tuyến transaction, trigger Approve [UC-02].")
}

Rel(ui_pages, ui_hooks, "Sử dụng state của blockchain thông qua Hook")
Rel(ui_pages, ui_services, "Mô tả tham số giao dịch, xác định Minimum Received [FR-01.4]")
Rel(ui_hooks, ui_services, "Cung cấp Signer hoặc Provider")
```


