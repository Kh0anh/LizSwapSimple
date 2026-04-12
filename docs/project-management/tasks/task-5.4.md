# Task 5.4: E2E Test trên BSC Testnet

- **Người đảm nhận:** **Hộp**, **Huy**
- **Mã Yêu cầu:** Tất cả UC, FR trên môi trường testnet thật
- **Task phụ thuộc:** Task 5.3
- **Đường dẫn File:** N/A

## Mô tả chi tiết công việc

1. MetaMask chuyển sang BSC Testnet (chainId 97).
2. Khanh mint MockToken cho Hộp/Huy testnet addresses.
3. Lặp lại toàn bộ test flow (UC-01 → UC-05) trên testnet thật.
4. Verify TX trên BSCScan: `https://testnet.bscscan.com/tx/...`.
5. Kiểm tra gas costs, latency, confirm time.

## Đầu ra mong muốn

Toàn bộ luồng hoạt động trên BSC Testnet thật, TX verify được trên BSCScan.
