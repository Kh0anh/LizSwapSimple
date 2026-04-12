// [NFR-03] Cấu hình Hardhat tối thiểu — Chi tiết networks và optimizer sẽ ở Task 1.2
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
};

export default config;
