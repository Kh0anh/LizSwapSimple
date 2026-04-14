// [NFR-03] Script tự động xuất ABI và testnet/local addresses cho Frontend
// [project-structure.md §1 & §2] Giao tiếp tự động giữa Blockchain và UI
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const deploymentsDir = path.join(rootDir, "ignition", "deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    console.error("No deployments found. Please run ignition deploy first.");
    return;
  }

  // Find the generated deployment folder (e.g. chain-31337 or chain-97)
  // Usually Ignition creates a folder for each network. We pick the latest or only one.
  // Actually, we can just read the generic output or pick first folder.
  const chainDirs = fs.readdirSync(deploymentsDir).filter(dir => dir.startsWith("chain-"));
  if (chainDirs.length === 0) {
    console.error("No chain deployment found.");
    return;
  }
  
  // Sort by modification time to get the latest
  const latestChainDir = chainDirs.sort((a, b) => {
    return fs.statSync(path.join(deploymentsDir, b)).mtimeMs - fs.statSync(path.join(deploymentsDir, a)).mtimeMs;
  })[0];

  const addressesFile = path.join(deploymentsDir, latestChainDir, "deployed_addresses.json");
  if (!fs.existsSync(addressesFile)) {
    console.error(`deployed_addresses.json not found in ${latestChainDir}`);
    return;
  }

  const rawAddresses = JSON.parse(fs.readFileSync(addressesFile, "utf-8"));
  
  // Map IGNITION's output IDs to our required format
  // Ignition output: "LizSwapDeployModule#LizSwapFactory": "0x..."
  const mappedAddresses: Record<string, string> = {};
  
  for (const [key, address] of Object.entries(rawAddresses)) {
    if (key.includes("Factory")) mappedAddresses.factory = address as string;
    else if (key.includes("Router")) mappedAddresses.router = address as string;
    else if (key.includes("WETH")) mappedAddresses.weth = address as string;
    else if (key.includes("mUSDT")) mappedAddresses.mockUSDT = address as string;
    else if (key.includes("mDAI")) mappedAddresses.mockDAI = address as string;
  }

  const outputDir = path.join(rootDir, "src", "services", "contracts");
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Export addresses
  const outputPath = path.join(outputDir, "deployedAddresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(mappedAddresses, null, 2));
  console.log(`✅ Exported addresses to ${outputPath}`);
  console.log(mappedAddresses);

  // 2. Export ABIs
  const abiSources = [
    { name: "LizSwapFactory.json", src: "core/LizSwapFactory.sol/LizSwapFactory.json" },
    { name: "LizSwapPair.json", src: "core/LizSwapPair.sol/LizSwapPair.json" },
    { name: "LizSwapRouter.json", src: "periphery/LizSwapRouter.sol/LizSwapRouter.json" },
    { name: "ERC20.json", src: "@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json" }
  ];

  for (const abi of abiSources) {
    const srcPath = path.join(rootDir, "artifacts", "contracts", ...abi.src.split("/").slice(0, 2) /* core/LizSwapFactory.sol */, abi.src.split("/")[2] /* LizSwapFactory.json */);
    
    // Check if openzeppelin ERC20 path exists
    let actualSrcPath = path.join(rootDir, "artifacts", "contracts", abi.src);
    if (abi.name === "ERC20.json") {
        actualSrcPath = path.join(rootDir, "artifacts", "@openzeppelin", "contracts", "token", "ERC20", "ERC20.sol", "ERC20.json");
        if (!fs.existsSync(actualSrcPath)) {
            actualSrcPath = path.join(rootDir, "artifacts", "contracts", "mock", "MockERC20.sol", "MockERC20.json"); // fallback
        }
    } else {
        actualSrcPath = path.join(rootDir, "artifacts", "contracts", ...abi.src.split("/"));
    }

    if (fs.existsSync(actualSrcPath)) {
      // Clean up the ABI file (optional: just copy)
      const artifact = JSON.parse(fs.readFileSync(actualSrcPath, "utf-8"));
      fs.writeFileSync(path.join(outputDir, abi.name), JSON.stringify(artifact.abi, null, 2));
      console.log(`✅ Exported ABI: ${abi.name}`);
    } else {
      console.warn(`⚠️ ABI artifact not found: ${actualSrcPath}`);
    }
  }
}

main().catch(console.error);
