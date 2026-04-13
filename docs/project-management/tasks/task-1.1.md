# Task 1.1: Khởi tạo Monorepo và Package Configuration

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[NFR-02]`, `[NFR-03]`
- **Task phụ thuộc:** Không có
- **Đường dẫn File:** `package.json`, `tsconfig.json`

## Mô tả chi tiết công việc

1. Khởi tạo `package.json` tại root với các scripts alias:
   - `"compile"`: `npx hardhat compile` — biên dịch Solidity
   - `"test"`: `npx hardhat test` — chạy unit test Smart Contract
   - `"node"`: `npx hardhat node` — chạy local blockchain
   - `"deploy:local"`: `npx hardhat ignition deploy ./ignition/modules/deploy.ts --network localhost`
   - `"deploy:testnet"`: tương tự với `--network bscTestnet`
   - `"dev"`: `next dev` — chạy frontend dev server
   - `"build"`: `next build` — build static export
2. Cài dependencies bắt buộc theo `techstack.md`:
   - **Blockchain:** `hardhat`, `@nomicfoundation/hardhat-toolbox`, `@openzeppelin/contracts`
   - **Frontend:** `next`, `react`, `react-dom`, `ethers@6`, `tailwindcss`, `postcss`, `autoprefixer`
   - **UI:** `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` (dependencies cho shadcn/ui)
   - **Dev:** `typescript`, `@types/react`, `@types/node`
3. Tạo `tsconfig.json` chung, cấu hình path alias `@/*` → `./src/*` cho Frontend.

## Đầu ra mong muốn

Toàn đội có thể `npm install` thành công, `npx hardhat compile` không lỗi, `npm run dev` khởi được Next.js.
