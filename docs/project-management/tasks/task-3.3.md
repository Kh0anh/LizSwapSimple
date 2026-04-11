# Task 3.3: useWeb3 Hook (Web3 State Management)

- **Người đảm nhận:** **Huy**
- **Mã Yêu cầu:** `[UC-01]` (Kết nối ví), `[FR-01.1]`, project-structure.md §2 (hooks/useWeb3.ts), C4-Component (Web3 Hooks)
- **Task phụ thuộc:** Task 1.4
- **Đường dẫn File:** `src/hooks/useWeb3.ts`

## Mô tả chi tiết công việc

Hook này là **trung tâm** quản lý trạng thái blockchain cho toàn app, xử lý `[UC-01]`.

1. **State quản lý:**
   - `account: string | null` — địa chỉ ví hiện tại.
   - `chainId: number | null` — chain ID hiện tại.
   - `provider: ethers.BrowserProvider | null` — Provider từ `window.ethereum`.
   - `signer: ethers.JsonRpcSigner | null` — Signer để ký transaction.
   - `isConnecting: boolean` — trạng thái loading.
   - `isConnected: boolean` — đã kết nối chưa.
   - `error: string | null`.
2. **Functions:**
   - `connectWallet()`:
     - Check `window.ethereum` exists → nếu không, set error "Vui lòng cài đặt MetaMask".
     - `const provider = new ethers.BrowserProvider(window.ethereum)`.
     - `await provider.send("eth_requestAccounts", [])` — trigger MetaMask popup `[UC-01]`.
     - `const signer = await provider.getSigner()`.
     - `const address = await signer.getAddress()`.
     - `const network = await provider.getNetwork(); chainId = Number(network.chainId)`.
     - Validate `chainId === Number(process.env.NEXT_PUBLIC_CHAIN_ID)` — nếu sai, prompt switch network.
   - `disconnectWallet()` — reset state.
3. **Event Listeners (side effects):**
   - `window.ethereum.on('accountsChanged', ...)` — cập nhật account.
   - `window.ethereum.on('chainChanged', ...)` — cập nhật chainId, reload provider.
   - Cleanup listeners on unmount.
4. **Return:** `{ account, chainId, provider, signer, isConnecting, isConnected, error, connectWallet, disconnectWallet }`.

## Đầu ra mong muốn

Hook reusable, gọi `connectWallet()` trigger MetaMask, quản lý toàn bộ Web3 state.
