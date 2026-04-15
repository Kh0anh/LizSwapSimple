# E2E Test Checklist — BSC Testnet (Chain ID: 97)

> **Task:** 5.4 — E2E Test trên BSC Testnet  
> **Mã Yêu cầu:** Tất cả UC, FR trên môi trường testnet thật  
> **Người thực hiện:** Hộp, Huy  
> **Ngày tạo:** 14/04/2026  

---

## 📋 Thông Tin Môi Trường Testnet

| Thông tin | Giá trị |
|---|---|
| Network | BSC Testnet |
| Chain ID | `97` |
| RPC URL | `https://data-seed-prebsc-1-s1.binance.org:8545/` |
| BSCScan | `https://testnet.bscscan.com` |
| tBNB Faucet | `https://testnet.binance.org/faucet-smart` |

### Địa chỉ Smart Contract đã Deploy

| Contract | Address | BSCScan |
|---|---|---|
| LizSwapFactory | `0x8b419c98c94Bd26Fd10eaB41C2A97826faf80105` | [Xem →](https://testnet.bscscan.com/address/0x8b419c98c94Bd26Fd10eaB41C2A97826faf80105) |
| LizSwapRouter | `0xAaa9015dB17062ea4C5342bC47Db688574d70515` | [Xem →](https://testnet.bscscan.com/address/0xAaa9015dB17062ea4C5342bC47Db688574d70515) |
| Mock USDT (mUSDT) | `0x0656835a1972d7e9379aF7C5F36F9861411Cc497` | [Xem →](https://testnet.bscscan.com/address/0x0656835a1972d7e9379aF7C5F36F9861411Cc497) |
| Mock DAI (mDAI) | `0x6205c6E44117D4bb56d2A1274C2C17c09173593a` | [Xem →](https://testnet.bscscan.com/address/0x6205c6E44117D4bb56d2A1274C2C17c09173593a) |
| Warped ETH (wETH) | `0x570e73b778f99aAec8469A8fcFDeD6Dc7a25e6b1` | [Xem →](https://testnet.bscscan.com/address/0x570e73b778f99aAec8469A8fcFDeD6Dc7a25e6b1) |

---

## 🔧 Bước Chuẩn Bị Môi Trường

### B0. Cấu hình MetaMask

```
Network Name: BSC Testnet
RPC URL:      https://data-seed-prebsc-1-s1.binance.org:8545/
Chain ID:     97
Symbol:       tBNB
Block Explorer: https://testnet.bscscan.com
```

**Checklist chuẩn bị:**
- [ ] B0.1 — MetaMask đã chuyển sang BSC Testnet (Chain ID 97)
- [ ] B0.2 — Địa chỉ ví tester Hộp (ghi vào báo cáo)
- [ ] B0.3 — Địa chỉ ví tester Huy (ghi vào báo cáo)
- [ ] B0.4 — Khanh đã mint mUSDT + mDAI cho ví Hộp và Huy
- [ ] B0.5 — Lấy tBNB từ faucet để trả gas
- [ ] B0.6 — Frontend đang chạy với đúng env testnet (xem `.env.example`)

### B0.5 — Lấy tBNB

```bash
# 1. Truy cập https://testnet.binance.org/faucet-smart
# 2. Nhập địa chỉ ví → nhận 0.1 tBNB
# 3. Kiểm tra balance trên BSCScan
```

### B0.6 — Cấu hình Frontend `.env`

```env
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
NEXT_PUBLIC_ROUTER_ADDRESS=0xAaa9015dB17062ea4C5342bC47Db688574d70515
NEXT_PUBLIC_FACTORY_ADDRESS=0x8b419c98c94Bd26Fd10eaB41C2A97826faf80105
NEXT_PUBLIC_ALLOW_DEPLOYED_FALLBACK=true
```

---

## 🧪 Test Cases theo Use Case

---

### [UC-01] Kết Nối Ví MetaMask

**Mã yêu cầu:** `[FR-01.1]`

| # | Test Step | Kỳ vọng | Kết quả | Ghi chú |
|---|---|---|---|---|
| TC-01.1 | Mở `http://localhost:3000`, không kết nối ví | Nút "Kết nối Ví" hiển thị trên Navbar và trên Swap Card | ✅/❌ | |
| TC-01.2 | Click "Kết nối Ví" | MetaMask popup mở, yêu cầu kết nối | ✅/❌ | |
| TC-01.3 | Chấp nhận kết nối trong MetaMask | Navbar hiển thị `0x...XXXX` (địa chỉ rút gọn), nút chuyển thành địa chỉ | ✅/❌ | |
| TC-01.4 | Kiểm tra Network trong MetaMask | Đang kết nối BSC Testnet (Chain ID 97) | ✅/❌ | |
| TC-01.5 | Kiểm tra balance hiển thị trên Swap Card | Hiển thị đúng số dư mUSDT / mDAI sau khi chọn token | ✅/❌ | |

---

### [UC-02] Phê Duyệt Token (Approve)

**Mã yêu cầu:** `[FR-01.4]`

| # | Test Step | Kỳ vọng | Kết quả | TX Hash |
|---|---|---|---|---|
| TC-02.1 | Chọn mUSDT → mDAI, nhập amount = `10` | Nút hiển thị "Phê duyệt mUSDT" (lần đầu chưa approve) | ✅/❌ | |
| TC-02.2 | Click "Phê duyệt mUSDT" | MetaMask popup approve, ConfirmSwapDialog KHÔNG mở | ✅/❌ | |
| TC-02.3 | Xác nhận approve trong MetaMask | Toast "Đang phê duyệt mUSDT..." hiển thị | ✅/❌ | |
| TC-02.4 | Chờ TX confirm (~3-5 giây trên BSC Testnet) | Toast "Phê duyệt thành công" với link BSCScan | ✅/❌ | |
| TC-02.5 | Verify TX trên BSCScan | TX type: `approve`, to: Router address | ✅/❌ | `0x...` |
| TC-02.6 | Sau approve, nút chuyển thành "Hoán đổi" | Allowance đã đủ, không cần approve lại | ✅/❌ | |

---

### [UC-03] Hoán Đổi Token (Swap)

**Mã yêu cầu:** `[FR-01.2]`, `[FR-01.3]`, `[FR-01.4]`, `[FR-01.5]`

**Điều kiện tiên quyết:** Pool mUSDT/mDAI đã có thanh khoản

| # | Test Step | Kỳ vọng | Kết quả | TX Hash |
|---|---|---|---|---|
| TC-03.1 | Chọn From: mUSDT, To: mDAI, Amount: `10` | getBestAmountsOut tính output, hiển thị tỷ giá, Price Impact | ✅/❌ | |
| TC-03.2 | Kiểm tra Swap Info Panel | Hiển thị Price Impact (%), Nhận tối thiểu, Tỷ giá, Slippage 0.5% | ✅/❌ | |
| TC-03.3 | Click "Hoán đổi" | ConfirmSwapDialog mở, hiển thị đầy đủ thông tin | ✅/❌ | |
| TC-03.4 | Kiểm tra ConfirmSwapDialog | Token In/Out, Price Impact, Min Received, Slippage, Exchange Rate | ✅/❌ | |
| TC-03.5 | Click "Xác nhận Hoán đổi" trong dialog | MetaMask popup TX | ✅/❌ | |
| TC-03.6 | Confirm TX trong MetaMask | Toast "Đang hoán đổi..." hiển thị | ✅/❌ | |
| TC-03.7 | Chờ TX confirm | Toast "Hoán đổi thành công" với link BSCScan | ✅/❌ | `0x...` |
| TC-03.8 | Verify TX trên BSCScan | Method: `swapExactTokensForTokens`, path: mUSDT→mDAI | ✅/❌ | |
| TC-03.9 | Kiểm tra balance sau swap | mUSDT giảm 10, mDAI tăng tương ứng | ✅/❌ | |
| TC-03.10 | Slippage test | Đặt slippage 0.1%, swap lớn → TX revert (nếu price impact > 0.1%) | ✅/❌ | |

**Swap ngược chiều:**
| TC-03.11 | Swap mDAI → mUSDT, amount `5` | Tương tự TC-03.1 → TC-03.9 | ✅/❌ | `0x...` |

---

### [UC-04] Thêm Thanh Khoản (Add Liquidity)

**Mã yêu cầu:** `[FR-02]`

| # | Test Step | Kỳ vọng | Kết quả | TX Hash |
|---|---|---|---|---|
| TC-04.1 | Chuyển sang `/pool`, Tab "Thêm Thanh Khoản" | Form nhập 2 token hiển thị | ✅/❌ | |
| TC-04.2 | Chọn Token A: mUSDT, Token B: mDAI | TokenSelector hoạt động | ✅/❌ | |
| TC-04.3 | Nhập Amount A = `100` | Amount B tự động quote theo tỷ lệ pool | ✅/❌ | |
| TC-04.4 | Kiểm tra info panel | Tỷ giá, Share of Pool hiển thị | ✅/❌ | |
| TC-04.5 | Click "Thêm Thanh Khoản" | ConfirmLiquidityDialog mở | ✅/❌ | |
| TC-04.6 | Kiểm tra ConfirmLiquidityDialog | Token A/B amounts, LP estimate, Share of Pool | ✅/❌ | |
| TC-04.7 | Click "Xác nhận" trong dialog | Approve mUSDT → Approve mDAI → addLiquidity | ✅/❌ | |
| TC-04.8 | Verify Approve TX mUSDT | Method: `approve`, to: Router | ✅/❌ | `0x...` |
| TC-04.9 | Verify Approve TX mDAI | Method: `approve`, to: Router | ✅/❌ | `0x...` |
| TC-04.10 | Verify addLiquidity TX | Method: `addLiquidity`, Factory tạo Pair nếu chưa có | ✅/❌ | `0x...` |
| TC-04.11 | Kiểm tra LP Token balance | LP Token tăng sau khi thêm thành công | ✅/❌ | |
| TC-04.12 | Kiểm tra Factory trên BSCScan | `allPairsLength` tăng, Pair address mới xuất hiện | ✅/❌ | |

---

### [UC-05] Rút Thanh Khoản (Remove Liquidity)

**Mã yêu cầu:** `[FR-03]`

**Điều kiện tiên quyết:** Đã có LP Token từ UC-04

| # | Test Step | Kỳ vọng | Kết quả | TX Hash |
|---|---|---|---|---|
| TC-05.1 | Tab "Rút Thanh Khoản", kết nối ví | Danh sách LP Positions hiển thị | ✅/❌ | |
| TC-05.2 | Chọn pair mUSDT/mDAI | Hiển thị LP balance, Share, Tokens pooled | ✅/❌ | |
| TC-05.3 | Chọn 50% | Slider và input cập nhật đồng bộ | ✅/❌ | |
| TC-05.4 | Xem preview | Preview Token0/Token1 nhận về | ✅/❌ | |
| TC-05.5 | Click "Rút Thanh Khoản" | Approve LP Token nếu cần → removeLiquidity | ✅/❌ | |
| TC-05.6 | Verify approve LP TX | Method: `approve`, spender: Router | ✅/❌ | `0x...` |
| TC-05.7 | Verify removeLiquidity TX | Method: `removeLiquidity`, burn LP | ✅/❌ | `0x...` |
| TC-05.8 | Balance sau rút | mUSDT + mDAI tăng, LP Token giảm 50% | ✅/❌ | |

---

## 📊 Kiểm Tra Hiệu Năng BSC Testnet

| Chỉ số | Giá trị đo được | Ngưỡng chấp nhận |
|---|---|---|
| Block confirmation time | ___ giây | < 5 giây |
| Gas price trung bình | ___ Gwei | Theo network |
| Gas used - approve | ___ gas | |
| Gas used - swap | ___ gas | |
| Gas used - addLiquidity | ___ gas | |
| Gas used - removeLiquidity | ___ gas | |
| UI latency (getAmountsOut) | ___ ms | < 2000ms |

---

## 🐛 Bug Log

*Ghi lại các bug phát hiện trong quá trình test E2E:*

| # | Mô tả Bug | Severity | Status | Link Issue |
|---|---|---|---|---|
| | | | | |

---

## ✅ Kết Quả Tổng Hợp

| Use Case | Trạng thái | Ghi chú |
|---|---|---|
| [UC-01] Kết nối ví | ⬜ Chưa test | |
| [UC-02] Approve Token | ⬜ Chưa test | |
| [UC-03] Swap Token | ⬜ Chưa test | |
| [UC-04] Add Liquidity | ⬜ Chưa test | |
| [UC-05] Remove Liquidity | ⬜ Chưa test | |

**Kết luận:** ⬜ Đang test  
**Ngày hoàn thành:** ___/___/2026
