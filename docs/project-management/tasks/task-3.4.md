# Task 3.4: WalletConnectButton Component

- **Người đảm nhận:** **Huy**
- **Mã Yêu cầu:** `[UC-01]`, `[FR-01.1]`, project-structure.md §2 (components/web3/)
- **Task phụ thuộc:** Task 3.3
- **Đường dẫn File:** `src/components/web3/WalletConnectButton.tsx`

## Mô tả chi tiết công việc

1. Sử dụng hook `useWeb3()` để lấy state `{ account, isConnecting, isConnected, connectWallet, disconnectWallet }`.
2. **Trạng thái UI:**
   - **Chưa kết nối:** Hiển thị button `"Kết nối Ví"` gradient `bg-gradient-to-r from-sky-400 to-blue-500 text-white`.
   - **Đang kết nối:** Button disable, hiển thị `<Loader2 className="animate-spin" />` (lucide-react) — theo `frontend-design.md §4`.
   - **Đã kết nối:** Hiển thị địa chỉ rút gọn `0x1234...abcd` (6 chars đầu + 4 chars cuối) với `font-mono`, kèm icon `<Wallet />` (lucide). Click → dropdown menu với option "Ngắt kết nối".
3. **Styling:**
   - Button: `rounded-full px-6 py-2.5 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/25`.
   - Dùng shadcn/ui `<Button>` variant nếu đã cài.

## Đầu ra mong muốn

Component kết nối ví hoạt động xuyên suốt app, hiển thị trạng thái phù hợp.
