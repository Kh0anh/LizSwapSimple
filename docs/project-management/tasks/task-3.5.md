# Task 3.5: Contract Service Layer & ABI Integration

- **Người đảm nhận:** **Huy**
- **Mã Yêu cầu:** `[UC-02]` (Approve), `[UC-03]`, project-structure.md §2 (services/), C4-Component (Contract Services)
- **Task phụ thuộc:** Task 2.8 (ABI output), Task 3.3
- **Đường dẫn File:** `src/services/swapService.ts`, `src/services/contracts/*.json`

## Mô tả chi tiết công việc

> [!WARNING]
> Task này **phụ thuộc** vào Task 2.8 (Khanh deploy SC và xuất ABI). Huy có thể code skeleton trước với ABI placeholder, hoàn thiện khi nhận ABI thực.

1. **Copy ABI files** từ output của Task 2.8 vào `src/services/contracts/`:
   - `RouterABI.json`, `FactoryABI.json`, `PairABI.json`, `ERC20ABI.json`.
   - `deployedAddresses.json`.
2. **`swapService.ts`** — Class/module chứa logic tương tác blockchain:
   ```ts
   import { ethers } from 'ethers';
   import RouterABI from './contracts/RouterABI.json';
   import FactoryABI from './contracts/FactoryABI.json';
   import PairABI from './contracts/PairABI.json';
   import ERC20ABI from './contracts/ERC20ABI.json';
   ```
   - **Helper:** `getRouterContract(signer): ethers.Contract` — khởi tạo Contract instance.
   - **`approveToken(signer, tokenAddress, spenderAddress, amount)`** — Gọi `erc20.approve(spender, amount)` — `[UC-02]`.
   - **`getAllowance(provider, tokenAddress, ownerAddress, spenderAddress)`** — Check allowance hiện tại.
   - **`getAmountsOut(provider, amountIn, path[])`** — Gọi `router.getAmountsOut()` — `[FR-01.3]`.
   - **`swapExactTokensForTokens(signer, amountIn, amountOutMin, path[], to, deadline)`** — Gọi `router.swapExactTokensForTokens()` — `[FR-01.5]`.
   - **`addLiquidity(signer, tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline)`** — `[FR-02.4]`.
   - **`removeLiquidity(signer, tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline)`** — `[FR-03.2]`.
   - **`getReserves(provider, factoryAddress, tokenA, tokenB)`** — Lấy Pair address → gọi `pair.getReserves()`.
   - **`getTokenBalance(provider, tokenAddress, account)`** — Gọi `erc20.balanceOf(account)`.
   - **`quote(provider, amountA, reserveA, reserveB)`** — `[FR-02.2]`.

## Đầu ra mong muốn

Service layer hoàn chỉnh, expose đầy đủ API cho Frontend Pages gọi, abstract hóa ethers.js interaction.
