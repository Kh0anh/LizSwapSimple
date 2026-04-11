# Task 5.1: End-to-End Integration Test (Local)

- **Người đảm nhận:** **Khanh** (chủ trì), Hộp, Huy
- **Mã Yêu cầu:** Tất cả `[UC-01]` → `[UC-05]`
- **Task phụ thuộc:** Tất cả Phase 2, 3, 4
- **Đường dẫn File:** N/A (manual testing)

## Mô tả chi tiết công việc

1. Khanh chạy `npx hardhat node` → `npm run deploy:local`.
2. Hộp/Huy chạy `npm run dev`, kết nối MetaMask vào `localhost:8545`.
3. Test luồng đầy đủ:
   - `[UC-01]`: Connect MetaMask → hiển thị address.
   - `[UC-02]`: Approve MockUSDT cho Router.
   - `[UC-03]`: Swap MockUSDT → MockDAI → verify balance thay đổi → Toast success.
   - `[UC-04]`: Approve cả hai token → Add Liquidity → nhận LP Token → verify position hiển thị.
   - `[UC-05]`: Approve LP Token → Remove Liquidity → nhận lại token → verify position giảm.
4. Test edge cases:
   - Swap khi không đủ balance → revert, Toast error.
   - Swap vượt slippage → revert.
   - Approve rồi mới swap (không approve trước → button hiện "Phê duyệt").
   - Disconnect ví → UI update.

## Đầu ra mong muốn

Tất cả 5 UC luồng chính hoạt động end-to-end trên local Hardhat Network.
