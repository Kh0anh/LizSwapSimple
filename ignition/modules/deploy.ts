// [NFR-03] Script triển khai cấu hình theo mạng lưới
// [project-structure.md §1] Hardhat Ignition script
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LizSwapDeployModule = buildModule("LizSwapDeployModule", (m) => {
  // Deploy Factory
  const factory = m.contract("LizSwapFactory", []);

  // Deploy Mock WETH (dùng như native token wrapper trong Router)
  const weth = m.contract("MockERC20", ["Wrapped WETH", "WETH", 1000000n * 10n**18n], { id: "WETH" });

  // Deploy Router
  const router = m.contract("LizSwapRouter", [factory, weth]);

  // Deploy Mocks
  const mockUSDT = m.contract("MockERC20", ["Mock USDT", "mUSDT", 1000000n * 10n**18n], { id: "mUSDT" });
  const mockDAI = m.contract("MockERC20", ["Mock DAI", "mDAI", 1000000n * 10n**18n], { id: "mDAI" });

  return { factory, router, weth, mockUSDT, mockDAI };
});

export default LizSwapDeployModule;
