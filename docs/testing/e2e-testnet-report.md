# E2E Test Report — BSC Testnet

> **Task:** 5.4 — E2E Test trên BSC Testnet  
> **Ngày thực hiện:** 14/04/2026  
> **Môi trường:** BSC Testnet (Chain ID: 97)  
> **Kết quả chung:** ✅ Contracts đã deployed và verified trên BSCScan

---

## 📋 Thông Tin Đội Test

| Vai trò | Địa chỉ ví | Ghi chú |
|---|---|---|
| Deployer (Khanh) | `0xF05a57446105cdbe5bd486f434c306c1290a1ea0` | Đã deploy contracts, mint token |
| Tester 1 (Hộp) | _(điền sau khi test)_ | Người thực hiện swap |
| Tester 2 (Huy) | _(điền sau khi test)_ | Người thực hiện add/remove liquidity |

---

## ✅ Xác Nhận Deploy BSC Testnet (Task 5.3 Output)

Toàn bộ contracts đã được deploy và **confirm trên BSCScan Testnet** bởi Khanh:

| Contract | Address | Transactions | BSCScan |
|---|---|---|---|
| LizSwapFactory | `0x8b419c98c94Bd26Fd10eaB41C2A97826faf80105` | Contract deployed | [Xem →](https://testnet.bscscan.com/address/0x8b419c98c94Bd26Fd10eaB41C2A97826faf80105) |
| LizSwapRouter | `0xAaa9015dB17062ea4C5342bC47Db688574d70515` | **5 txs** (deploy + 4 addLiquidity) | [Xem →](https://testnet.bscscan.com/address/0xAaa9015dB17062ea4C5342bC47Db688574d70515) |
| Mock USDT (mUSDT) | `0x0656835a1972d7e9379aF7C5F36F9861411Cc497` | **3 txs** (deploy + 2 mint) | [Xem →](https://testnet.bscscan.com/address/0x0656835a1972d7e9379aF7C5F36F9861411Cc497) |
| Mock DAI (mDAI) | `0x6205c6E44117D4bb56d2A1274C2C17c09173593a` | **3 txs** (deploy + 2 mint) | [Xem →](https://testnet.bscscan.com/address/0x6205c6E44117D4bb56d2A1274C2C17c09173593a) |
| mUSDT/mDAI Pair | `0x1D32b7F1d0e6873b732c0e6321b3a9dfb7e70675` | Tạo qua Factory | [Xem →](https://testnet.bscscan.com/address/0x1d32b7f1d0e6873b732c0e6321b3a9dfb7e70675) |

---

## 📊 Transactions Deploy Đã Verify trên BSCScan

### TX 1 — addLiquidity lần 1 (seed pool mUSDT/mDAI)
- **Hash:** [`0x20771e70...`](https://testnet.bscscan.com/tx/0x20771e708283bf370dbfdfb9eacc0a6aec5fe47ac8f0f2b2363c02a8bfc67cda)
- **Block:** `101615733`
- **From:** Deployer `0xF05a5744...`
- **Internal TXs:** Router → Factory (tạo Pair) → mUSDT transfer → mDAI transfer

### TX 2 — addLiquidity lần 2 (tăng thanh khoản)
- **Hash:** [`0x06b96e06...`](https://testnet.bscscan.com/tx/0x06b96e06c206f3f0e9b5d5cd93f101c2a565a82b739664f1d14067f237aa777e)
- **Block:** `101615968`
- **From:** Deployer `0xF05a5744...`
- **Internal TXs:** Router → Pair `0x1CC57d8e...` + `0x1CC57d8e...` (second LP)

### TX 3 — addLiquidity lần 3 (seed pool thứ 3)
- **Hash:** [`0xdc9a84d1...`](https://testnet.bscscan.com/tx/0xdc9a84d1916a474d90096a59b3ff7766edf3a6a7983c2d92b997a6d9e43c8ba8)
- **Block:** `101616108`
- **From:** Deployer `0xF05a5744...`
- **Internal TXs:** Router → mDAI, mUSDT transfers → Factory, Pair `0x1D32b7F1...`
- **Pair được tạo:** `0x1D32b7F1d0e6873b732c0e6321b3a9dfb7e70675` (mUSDT/mDAI)

---

## 🧪 Kết Quả Test Theo Use Case

### [UC-01] Kết Nối Ví MetaMask

| # | Test Step | Kỳ vọng | Kết quả |
|---|---|---|---|
| TC-01.1 | Mở app, chưa kết nối ví | Nút "Kết nối Ví" hiển thị | ⬜ Chưa test |
| TC-01.2 | Click "Kết nối Ví" | MetaMask popup | ⬜ Chưa test |
| TC-01.3 | Chấp nhận kết nối | Navbar hiển thị địa chỉ rút gọn | ⬜ Chưa test |
| TC-01.4 | Kiểm tra network | BSC Testnet Chain ID 97 | ⬜ Chưa test |

**Ghi chú:** _Cần tester thực hiện và điền kết quả_

---

### [UC-02] Phê Duyệt Token (Approve)

| # | Test Step | Kỳ vọng | Kết quả | TX Hash |
|---|---|---|---|---|
| TC-02.1 | Chọn mUSDT→mDAI, nhập amount | Nút "Phê duyệt mUSDT" hiển thị | ⬜ Chưa test | |
| TC-02.2 | Click approve | MetaMask popup approve | ⬜ Chưa test | |
| TC-02.3 | Confirm MetaMask | Toast pending | ⬜ Chưa test | |
| TC-02.4 | TX confirm (~3 giây BSC) | Toast success + link BSCScan | ⬜ Chưa test | |

---

### [UC-03] Hoán Đổi Token (Swap)

**Điều kiện:** Pool mUSDT/mDAI ✅ đã có thanh khoản (từ 3 addLiquidity TXs trên)

| # | Test Step | Kỳ vọng | Kết quả | TX Hash |
|---|---|---|---|---|
| TC-03.1 | Chọn From: mUSDT, To: mDAI, `10` | Quote hiển thị, Price Impact | ⬜ Chưa test | |
| TC-03.2 | Kiểm tra Swap Info Panel | Price Impact, Min Received, Slippage | ⬜ Chưa test | |
| TC-03.3 | Click "Hoán đổi" | **ConfirmSwapDialog mở** | ⬜ Chưa test | |
| TC-03.4 | Xác nhận trong dialog | MetaMask popup TX | ⬜ Chưa test | |
| TC-03.5 | Chờ TX confirm | Toast success + BSCScan link | ⬜ Chưa test | `0x...` |

---

### [UC-04] Thêm Thanh Khoản (Add Liquidity)

**Tình trạng hiện tại:** Deployer đã seed 3 addLiquidity TXs lên pool mUSDT/mDAI ✅

| # | Test Step | Kỳ vọng | Kết quả | TX Hash |
|---|---|---|---|---|
| TC-04.1 | Tab "Thêm Thanh Khoản" | Form 2 token | ⬜ Chưa test | |
| TC-04.5 | Click "Thêm Thanh Khoản" | **ConfirmLiquidityDialog mở** | ⬜ Chưa test | |
| TC-04.7 | Xác nhận trong dialog | Approve → addLiquidity chain | ⬜ Chưa test | |
| TC-04.10 | Verify addLiquidity TX | Method: `addLiquidity` trên BSCScan | ⬜ Chưa test | `0x...` |

---

### [UC-05] Rút Thanh Khoản (Remove Liquidity)

| # | Test Step | Kỳ vọng | Kết quả | TX Hash |
|---|---|---|---|---|
| TC-05.1 | Tab "Rút Thanh Khoản" | LP Positions hiển thị | ⬜ Chưa test | |
| TC-05.5 | Click "Rút Thanh Khoản" | Approve LP → removeLiquidity | ⬜ Chưa test | `0x...` |

---

## 📈 Thông Số Hiệu Năng BSC Testnet

Dữ liệu thu thập từ 3 TX addLiquidity đã confirm trên BSCScan:

| Chỉ số | Giá trị đo được |
|---|---|
| Block confirmation time | ~3 giây (BSC Testnet) |
| Block TX 1 → TX 2 | Block 101615733 → 101615968 (+235 blocks) |
| Block TX 2 → TX 3 | Block 101615968 → 101616108 (+140 blocks) |
| Deployer address | `0xF05a57446105cdbe5bd486f434c306c1290a1ea0` |

_Gas costs và latency chi tiết sẽ được điền bởi Hộp/Huy sau khi test E2E thực tế_

---

## 🔗 Links Quan Trọng

- **BSCScan Testnet:** https://testnet.bscscan.com
- **tBNB Faucet:** https://testnet.binance.org/faucet-smart
- **mUSDT/mDAI Pair:** https://testnet.bscscan.com/address/0x1d32b7f1d0e6873b732c0e6321b3a9dfb7e70675
- **Router TXs:** https://testnet.bscscan.com/txs?a=0xAaa9015dB17062ea4C5342bC47Db688574d70515

---

## ✅ Kết Luận

| Hạng mục | Trạng thái |
|---|---|
| Smart Contracts deployed trên BSC Testnet | ✅ Xác nhận qua BSCScan |
| Pool mUSDT/mDAI đã được seed thanh khoản | ✅ 3 addLiquidity TXs trên BSCScan |
| Pair `0x1D32b7F1...` tồn tại và có reserves | ✅ Verify qua internal TXs |
| Frontend config đúng testnet env | ⬜ Cần Hộp/Huy xác nhận |
| E2E test UC-01 → UC-05 thực tế | ⬜ Cần Hộp/Huy thực hiện và điền kết quả |

**Hành động tiếp theo:**
1. Hộp/Huy tạo `.env` theo template, chạy `npm run dev`
2. Kết nối MetaMask BSC Testnet, lấy tBNB faucet
3. Nhận mUSDT/mDAI từ Khanh mint (địa chỉ ví gửi cho Khanh)
4. Thực hiện test theo [checklist](./e2e-testnet-checklist.md), điền kết quả
5. Gửi report hoàn chỉnh cho Khanh review
