# Task 2.8: Deployment Script (Hardhat Ignition)

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** project-structure.md §1 (ignition/), `[NFR-03]`
- **Task phụ thuộc:** Task 2.6, Task 2.7
- **Đường dẫn File:** `ignition/modules/deploy.ts`

## Mô tả chi tiết công việc

1. Deploy thứ tự:
   - Deploy `LizSwapFactory`.
   - Deploy `LizSwapRouter(factoryAddress, WETHAddress)` — WETHAddress dùng mock hoặc zero address nếu chưa cần native token.
   - Deploy `MockERC20("MockUSDT", "mUSDT", 1000000e18)`.
   - Deploy `MockERC20("MockDAI", "mDAI", 1000000e18)`.
2. Console log toàn bộ deployed addresses.
3. Script tự động export file JSON chứa addresses vào `src/services/contracts/deployedAddresses.json`:
   ```json
   {
     "factory": "0x...",
     "router": "0x...",
     "mockUSDT": "0x...",
     "mockDAI": "0x..."
   }
   ```
4. Copy ABI files từ `artifacts/contracts/` vào `src/services/contracts/`:
   - `LizSwapRouter.json` (ABI)
   - `LizSwapFactory.json` (ABI)
   - `LizSwapPair.json` (ABI)
   - `ERC20.json` (ABI)

## Đầu ra mong muốn

`npm run deploy:local` deploy thành công, output ABI + address files cho Frontend consume.
