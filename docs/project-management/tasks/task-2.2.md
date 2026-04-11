# Task 2.2: LizSwapERC20.sol (LP Token Base)

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[FR-02.4]` (Mint LP Token), C3 - Pair component, techstack.md §1
- **Task phụ thuộc:** Task 2.1
- **Đường dẫn File:** `contracts/core/LizSwapERC20.sol`

## Mô tả chi tiết công việc

1. Kế thừa `ERC20` từ `@openzeppelin/contracts/token/ERC20/ERC20.sol`.
2. Constructor nhận `name = "LizSwap LP Token"`, `symbol = "LIZ-LP"`.
3. Expose hàm `_mint(address to, uint256 amount)` internal — cho `LizSwapPair` gọi khi Add Liquidity.
4. Expose hàm `_burn(address from, uint256 amount)` internal — cho `LizSwapPair` gọi khi Remove Liquidity.
5. **Lưu ý:** Khác Uniswap V2 gốc (tự code ERC20), bản này **kế thừa OpenZeppelin** để đáp ứng chuẩn bảo mật (techstack.md §1).

## Đầu ra mong muốn

Contract biên dịch, LP Token theo chuẩn ERC20, sẵn sàng cho LizSwapPair kế thừa.
