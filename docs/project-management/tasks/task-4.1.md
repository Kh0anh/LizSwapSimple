# Task 4.1: TokenSelector Component

- **Người đảm nhận:** **Hộp**
- **Mã Yêu cầu:** `[FR-01.2]` (Chọn Token nguồn/đích), `[FR-02.1]` (Chọn cặp Token)
- **Task phụ thuộc:** Task 3.6
- **Đường dẫn File:** `src/components/web3/TokenSelector.tsx`

## Mô tả chi tiết công việc

1. **Props:**
   - `selectedToken: TokenInfo | null` — token đang chọn
   - `onSelect: (token: TokenInfo) => void`
   - `disabledToken?: string` — address token đã chọn ở field kia (tránh trùng)
2. **`TokenInfo` type:** `{ address: string; symbol: string; name: string; decimals: number; logoUrl?: string }`.
3. **UI:**
   - Hiển thị button với token symbol + icon chọn. Click → mở `<Dialog>` (shadcn/ui) hiển thị danh sách token.
   - Danh sách token hardcode từ file config `src/services/contracts/tokenList.json` (Khanh cung cấp MockUSDT, MockDAI addresses).
   - Mỗi item hiển thị: icon placeholder, symbol, name, user balance (gọi `swapService.getTokenBalance()`).
4. **Styling:**
   - Button: `rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 transition-colors duration-200`.
   - Dialog: `rounded-2xl`, dùng `<DialogContent>` shadcn/ui.
   - Balance hiển thị `font-mono text-sm text-slate-500`.

## Đầu ra mong muốn

Component chọn token reusable, hiển thị balance, dùng chung cho cả Swap và Pool page.
