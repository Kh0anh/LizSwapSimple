# Cấu Trúc Dự Án Chi Tiết (Project Structure)

> **Phiên bản:** v1 | **Ngày tạo:** 9 tháng 4 năm 2026 | **Tác giả:** Khanh

Tài liệu này ánh xạ các thành phần từ **SRS** (Đặc tả yêu cầu), **Tech Stack** và **Kiến trúc C4** vào cấu trúc thư mục vật lý thực tế của dự án `LizSwapSimple`. Dự án sử dụng mô hình Monorepo chứa cả mã nguồn phân tán (Smart Contracts) và nền tảng Frontend tập trung.

## 🗂️ Tổng Quan Thư Mục Gốc

```text
LizSwapSimple\
├── contracts/               # Mã nguồn Smart Contract (Tương ứng C3 - Ecosystem)
├── ignition/                # Kịch bản triển khai tự động Hardhat
├── src/                     # Cấu trúc Frontend tĩnh (Tương ứng C3 - Web App Container)
├── docs/                    # Tài liệu đặc tả và kiến trúc thiết kế
└── [Các file cấu hình root] # Quản lý môi trường, Docker
```

## 1. Mảng Smart Contract (`contracts/`)

Quản lý toàn bộ vòng đời của DEX theo yêu cầu không có Backend tĩnh (`[NFR-01]`). Được lập trình bằng **Solidity 0.8.20+** và triển khai qua **Hardhat**. Sử dụng chuẩn bảo mật của openzeppelin.

```text
contracts/
├── core/
│   ├── LizSwapFactory.sol   # Tạo Pool Pair mới và cung cấp địa chỉ (C3 - Factory).
│   ├── LizSwapPair.sol      # Lõi tính toán AMM, lưu trữ số dư tĩnh ($x \times y = k$), xử lý chức năng [FR-01.3].
│   └── LizSwapERC20.sol     # Lớp token kế thừa ERC20 chuẩn cho LP Token.
├── periphery/
│   ├── LizSwapRouter.sol    # Contract ngoại vi: Tiếp nhận logic lệnh Swap [UC-03] và Quản lý thanh khoản [UC-04], [UC-05].
│   └── libraries/           # Thư viện tính toán Math an toàn.
├── interfaces/              # Định nghĩa giao dịch chuẩn giữa contract nội khối (ILizSwapFactory.sol,...).
└── mock/                    # Các Token nội bộ mô phỏng (MockERC20) phát triển cho môi trường Local / Testnet.
```

## 2. Mảng Frontend Application (`src/`)

Hệ thống giao diện Web Tĩnh hoạt động mượt mà, phản hồi lập tức với Blockchain Node qua RPC (`[NFR-02]`). Xây dựng dựa trên **Next.js**, **ethers.js v6**, và hệ sinh thái thư viện **shadcn/ui**.

```text
src/
├── app/                     # Page Routing (Next.js App / Pages)
│   ├── layout.tsx           # Layout chung duy trì trạng thái Navbar chung (Kèm nút Connect Wallet)
│   ├── page.tsx             # Trang Home chính: Phụ trách giao diện thẻ hoán đổi Swap [FR-01].
│   └── pool/                 
│       └── page.tsx         # Trang Pool (App route): Gọi nút thao tác Thêm/Rút Thanh Khoản [FR-02], [FR-03].
├── components/
│   ├── ui/                  # Tập hợp component render giao diện trích xuất từ shadcn/ui.
│   └── web3/                # Mảng Component logic bọc chuẩn EIP-1193, vd: WalletConnectButton.
├── hooks/
│   └── useWeb3.ts           # Hook React đọc và theo dõi state window.ethereum (Xử lý [UC-01]), lắng nghe Provider.
└── services/
    ├── contracts/           # Chứa file ABI (.json) compile ra từ Smart Contract.
    └── swapService.ts       # Lớp Service thuần TypeScript: Tạo giao dịch Approval [UC-02] hoặc Swap thông qua Ethers.
```

## 3. Quản Trị Cấu Hình và Triển Khai (Root Config)

Các tệp điều khiển chu trình biên dịch (Build) và triển khai (Deploy) hệ thống đáp ứng thuộc tính cấu hình mở liên tục (`[NFR-03]`). Sử dụng container **Docker** và hệ thống quản lý **Node Package Manager (npm)**.

```text
.
├── .env.example             # Template file chứa biến môi trường Next.js URL RPC và Target Contract Address.
├── docker-compose.yml       # Tệp lệnh Compose giúp triển khai container dự án Frontend trong 1 node độc lập.
├── Dockerfile               # Bản trích xuất build Next.js ra môi trường image nhẹ (node-alpine).
├── hardhat.config.ts        # Quản trị mạng thử nghiệm (BSC Testnet, Local), tích hợp config Etherscan và Solidity compiler.
├── package.json             # Danh sách dependencies dùng chung, script alias build web và blockchain.
└── tsconfig.json            # Base mapping siêu type cho Typescript toàn khối thư mục frontend lẫn hardhat.
```

## 💡 Kết Nối Tích Hợp
- Toàn bộ thiết kế mảng `services/` của Frontend sẽ mapping call thẳng vào `contracts/periphery/LizSwapRouter.sol`.
- Base `.env` là mạch máu chính phân phối data Network đồng loại xuống Hardhat (cho Script deploy) và Next.js (cho client runtime).
