# Task 5.3: Deploy Smart Contract lên BSC Testnet

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[NFR-03]` (Configurable testnet → mainnet), techstack.md §3
- **Task phụ thuộc:** Task 2.9
- **Đường dẫn File:** `hardhat.config.ts`, `.env`

## Mô tả chi tiết công việc

1. Nạp tBNB testnet vào deployer account.
2. Cấu hình `.env` với `BSC_TESTNET_RPC_URL` + `DEPLOYER_PRIVATE_KEY`.
3. `npm run deploy:testnet` → deploy Factory, Router, MockTokens lên BSC Testnet (chainId 97).
4. Cập nhật `deployedAddresses.json` với testnet addresses.
5. Cập nhật Frontend `.env`:
   ```env
   NEXT_PUBLIC_CHAIN_ID=97
   NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
   NEXT_PUBLIC_ROUTER_ADDRESS=0x_TESTNET_ROUTER
   NEXT_PUBLIC_FACTORY_ADDRESS=0x_TESTNET_FACTORY
   ```
6. Rebuild Frontend, verify trên BSCScan testnet rằng contracts tồn tại.

## Đầu ra mong muốn

Contracts deployed trên BSC Testnet, addresses cập nhật, Frontend trỏ đúng testnet.
