// ============================================================================
// [NFR-03] Cấu hình Hardhat Environment — Task 1.2
// Solidity 0.8.20+ với optimizer, networks localhost/bscTestnet/bscMainnet
// Mọi giá trị nhạy cảm đọc từ configVariable — tuyệt đối không hardcode
// ============================================================================
import { configVariable, defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

// Tải cấu hình từ .env
dotenv.config();

// Helper an toàn: Ưu tiên đọc từ process.env (file .env), nếu không có mới fall-back về configVariable của Hardhat v3
const getEnv = (key: string, defaultValue?: string): string => {
  if (process.env[key]) return process.env[key] as string;
  try {
    return configVariable(key);
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing environment variable: ${key}. Please define it in .env or via config-variable.`);
  }
};

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  test: {
    mocha: {
      timeout: 60000,
    },
  },

  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },

    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },

    bscTestnet: {
      type: "http",
      url: getEnv("BSC_TESTNET_RPC_URL", "https://data-seed-prebsc-1-s1.binance.org:8545"),
      chainId: 97,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },

    bscMainnet: {
      type: "http",
      url: getEnv("BSC_MAINNET_RPC_URL", "https://bsc-dataseed.binance.org/"),
      chainId: 56,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
});
