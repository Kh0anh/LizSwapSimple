/**
 * Token Types — LizSwapSimple DEX
 * Task 4.1: TokenSelector Component [FR-01.2] [FR-02.1]
 *
 * Định nghĩa kiểu dữ liệu Token dùng xuyên suốt toàn bộ ứng dụng:
 * - TokenSelector Component (Task 4.1)
 * - Swap Page (Task 4.2) — [UC-03] chọn token nguồn/đích
 * - Pool Page (Task 4.3, 4.4) — [UC-04] [UC-05] chọn cặp token
 * - Contract Service (Task 3.5) — tham số cho swapService
 */

/**
 * [FR-01.2] [FR-02.1] TokenInfo — Thông tin đầy đủ của một ERC20/BEP20 Token
 *
 * @property address - Địa chỉ contract trên BSC (0x...) hoặc "0x000...000" cho BNB native
 * @property symbol  - Ký hiệu ngắn gọn (USDT, DAI, BNB)
 * @property name    - Tên đầy đủ (Mock USDT, Mock DAI)
 * @property decimals - Số chữ số thập phân (thường 18, USDT = 6)
 * @property logoUrl - URL icon token (từ TrustWallet assets hoặc placeholder)
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}
