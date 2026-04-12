# Task 1.2: Cấu hình Hardhat Environment

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[NFR-03]` (Configurable), Tech Stack §1
- **Task phụ thuộc:** Task 1.1
- **Đường dẫn File:** `hardhat.config.ts`

## Mô tả chi tiết công việc

1. Cấu hình Solidity compiler version `0.8.20` (hoặc cao hơn), tối ưu optimizer `runs: 200`.
2. Định nghĩa networks:
   - `hardhat` (default) — local node.
   - `localhost` — `url: "http://127.0.0.1:8545"`.
   - `bscTestnet` — `url: process.env.BSC_TESTNET_RPC_URL`, `chainId: 97`, `accounts: [process.env.DEPLOYER_PRIVATE_KEY]`.
   - `bscMainnet` — `url: process.env.BSC_MAINNET_RPC_URL`, `chainId: 56`, `accounts: [process.env.DEPLOYER_PRIVATE_KEY]`.
3. Mọi giá trị nhạy cảm (RPC URL, Private Key) đọc từ `process.env` — tuyệt đối **không hardcode** theo `[NFR-03]`.

## Đầu ra mong muốn

Chạy `npx hardhat compile` thành công, `npx hardhat node` khởi được local blockchain tại `localhost:8545`.
