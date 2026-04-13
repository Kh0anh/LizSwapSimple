# Task 1.3: Tạo Template Biến Môi Trường

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[NFR-03]` (Configurable)
- **Task phụ thuộc:** Task 1.2
- **Đường dẫn File:** `.env.example`, `.gitignore`

## Mô tả chi tiết công việc

1. Tạo `.env.example` chứa template:
   ```env
   # === Blockchain ===
   BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
   BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/
   DEPLOYER_PRIVATE_KEY=0x_YOUR_DEPLOYER_PRIVATE_KEY

   # === Frontend (Next.js Public) ===
   NEXT_PUBLIC_CHAIN_ID=97
   NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
   NEXT_PUBLIC_ROUTER_ADDRESS=0x_DEPLOYED_ROUTER_ADDRESS
   NEXT_PUBLIC_FACTORY_ADDRESS=0x_DEPLOYED_FACTORY_ADDRESS
   ```
2. Cập nhật `.gitignore` thêm: `.env`, `node_modules/`, `artifacts/`, `cache/`, `typechain-types/`, `.next/`, `out/`.
3. Tạo `.env` copy từ `.env.example` với giá trị local dev mặc định.

## Đầu ra mong muốn

Toàn đội copy `.env.example` → `.env` để bắt đầu phát triển trên local Hardhat Network.
