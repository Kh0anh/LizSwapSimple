// ============================================================================
// [NFR-03] Cấu hình Hardhat Environment — Task 1.2
// Solidity 0.8.20+ với optimizer, networks localhost/bscTestnet/bscMainnet
// Mọi giá trị nhạy cảm đọc từ biến môi trường (process.env) qua file .env
// ============================================================================
import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

// Nạp các biến môi trường từ .env
dotenv.config();

export default defineConfig({
  // Plugins — Hardhat v3 yêu cầu khai báo rõ ràng trong mảng plugins
  plugins: [hardhatToolboxMochaEthers],

  // ---------------------------------------------------------------------------
  // [NFR-03] / Tech Stack §1 — Solidity Compiler 0.8.20, Optimizer runs: 200
  // ---------------------------------------------------------------------------
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Mocha test runner configuration — Hardhat v3 dùng `test.mocha` (không phải `mocha`)
  // Timeout 60s để cho phép deploy contract phức tạp trên mạng in-process
  // ---------------------------------------------------------------------------
  test: {
    mocha: {
      timeout: 60000,
    },
  },

  // ---------------------------------------------------------------------------
  // [NFR-03] — Định nghĩa Networks: hardhat (default), localhost, BSC Testnet,
  // BSC Mainnet. RPC URL và Private Key đọc từ file .env.
  // ---------------------------------------------------------------------------
  networks: {
    // Network mặc định — Hardhat in-process simulation
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },

    // Local node — kết nối đến `npx hardhat node` đang chạy tại 127.0.0.1:8545
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },

    // BSC Testnet (chainId: 97) — dùng cho giai đoạn test
    bscTestnet: {
      type: "http",
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },

    // BSC Mainnet (chainId: 56) — dùng cho giai đoạn production
    bscMainnet: {
      type: "http",
      url: process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
});
