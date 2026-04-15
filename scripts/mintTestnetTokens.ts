/**
 * [Task 5.4] Mint MockToken Script — Chuẩn Bị Testnet E2E
 *
 * Yêu cầu liên quan:
 * - Task 5.4: Khanh mint MockToken cho Hộp/Huy testnet addresses
 * - Contracts đã deploy trên BSC Testnet (chainId 97)
 *
 * Cách dùng:
 *   npx hardhat run scripts/mintTestnetTokens.ts --network bscTestnet
 *
 * Yêu cầu:
 *   - .env phải có DEPLOYER_PRIVATE_KEY (Khanh)
 *   - Thay TESTER_HOB_ADDRESS và TESTER_HUY_ADDRESS thành địa chỉ ví thực
 */

import { ethers } from "hardhat";

// ─── CONFIG: Địa chỉ contracts đã deploy (BSC Testnet) ───────────────────────
const MOCK_USDT_ADDRESS = "0x0656835a1972d7e9379aF7C5F36F9861411Cc497";
const MOCK_DAI_ADDRESS  = "0x6205c6E44117D4bb56d2A1274C2C17c09173593a";

// ─── CONFIG: Địa chỉ ví tester — ĐIỀN VÀO ĐÂY ───────────────────────────────
const TESTER_ADDRESSES: string[] = [
  // "0x...HOB_ADDRESS",  // Hộp — thêm địa chỉ ví MetaMask của Hộp vào đây
  // "0x...HUY_ADDRESS",  // Huy — thêm địa chỉ ví MetaMask của Huy vào đây
];

// ─── CONFIG: Số lượng token mint cho mỗi người ───────────────────────────────
const MINT_AMOUNT_USDT = ethers.parseUnits("10000", 18); // 10,000 mUSDT
const MINT_AMOUNT_DAI  = ethers.parseUnits("10000", 18); // 10,000 mDAI

// ─── ABI: chỉ cần hàm mint (MockERC20 có hàm mint public) ────────────────────
const MOCK_ERC20_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════════");
  console.log(" LizSwapSimple — Mint Testnet Tokens");
  console.log("═══════════════════════════════════════════════");
  console.log(`Network:   ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer:  ${deployer.address}`);
  console.log(`mUSDT:     ${MOCK_USDT_ADDRESS}`);
  console.log(`mDAI:      ${MOCK_DAI_ADDRESS}`);
  console.log(`Testers:   ${TESTER_ADDRESSES.length} địa chỉ`);
  console.log("═══════════════════════════════════════════════\n");

  if (TESTER_ADDRESSES.length === 0) {
    console.error("❌ Lỗi: Chưa điền địa chỉ tester vào TESTER_ADDRESSES!");
    console.error("   Mở file scripts/mintTestnetTokens.ts và thêm địa chỉ ví vào mảng.");
    process.exit(1);
  }

  // Khởi tạo contract instances
  const mUSDT = new ethers.Contract(MOCK_USDT_ADDRESS, MOCK_ERC20_ABI, deployer);
  const mDAI  = new ethers.Contract(MOCK_DAI_ADDRESS,  MOCK_ERC20_ABI, deployer);

  const usdtSymbol = await mUSDT.symbol() as string;
  const daiSymbol  = await mDAI.symbol()  as string;

  console.log(`Bắt đầu mint ${ethers.formatUnits(MINT_AMOUNT_USDT, 18)} ${usdtSymbol} và`);
  console.log(`              ${ethers.formatUnits(MINT_AMOUNT_DAI,  18)} ${daiSymbol}  cho mỗi tester...\n`);

  for (const testerAddress of TESTER_ADDRESSES) {
    console.log(`\n👤 Mint cho: ${testerAddress}`);

    // Mint mUSDT
    console.log(`   Đang mint ${usdtSymbol}...`);
    const txUSDT = await mUSDT.mint(testerAddress, MINT_AMOUNT_USDT);
    await txUSDT.wait();
    console.log(`   ✅ ${usdtSymbol} minted! TX: ${txUSDT.hash}`);

    // Mint mDAI
    console.log(`   Đang mint ${daiSymbol}...`);
    const txDAI = await mDAI.mint(testerAddress, MINT_AMOUNT_DAI);
    await txDAI.wait();
    console.log(`   ✅ ${daiSymbol} minted! TX: ${txDAI.hash}`);

    // Verify balance sau khi mint
    const balUSDT = await mUSDT.balanceOf(testerAddress) as bigint;
    const balDAI  = await mDAI.balanceOf(testerAddress)  as bigint;
    console.log(`   💰 Balance: ${ethers.formatUnits(balUSDT, 18)} ${usdtSymbol}, ${ethers.formatUnits(balDAI, 18)} ${daiSymbol}`);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log(" ✅ Hoàn tất! Tất cả tester đã nhận token.");
  console.log(`    Verify trên BSCScan Testnet:`);
  console.log(`    https://testnet.bscscan.com/token/${MOCK_USDT_ADDRESS}`);
  console.log(`    https://testnet.bscscan.com/token/${MOCK_DAI_ADDRESS}`);
  console.log("═══════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });
