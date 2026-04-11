# Task 2.4: LizSwapPair.sol (Lõi AMM)

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[FR-01.3]` (Công thức x*y=k), `[UC-03]` Swap, `[UC-04]` Add, `[UC-05]` Remove, C3 - Pair
- **Task phụ thuộc:** Task 2.2, Task 2.3
- **Đường dẫn File:** `contracts/core/LizSwapPair.sol`

## Mô tả chi tiết công việc

1. **Kế thừa:** `LizSwapERC20` (để mint/burn LP Token), `ReentrancyGuard` từ OpenZeppelin (techstack.md §1).
2. **State Variables:**
   - `address public factory` — địa chỉ Factory đã deploy Pair này.
   - `address public token0`, `address public token1` — hai Token tạo Pool.
   - `uint112 private reserve0`, `uint112 private reserve1` — Reserves hiện tại.
   - `uint32 private blockTimestampLast`.
   - `uint256 public kLast` — k tại thời điểm cuối.
   - `uint256 public constant MINIMUM_LIQUIDITY = 10**3` — chống chia 0.
3. **Modifier:**
   - Sử dụng `nonReentrant` từ `ReentrancyGuard` trên `mint()`, `burn()`, `swap()`.
4. **Events:** `Mint`, `Burn`, `Swap`, `Sync` (đã định nghĩa tại ILizSwapPair).
5. **Functions:**
   - `initialize(address _token0, address _token1)` — chỉ Factory gọi được.
   - `getReserves() public view returns (uint112, uint112, uint32)` — trả reserve0, reserve1, timestamp. Frontend dùng để tính toán `[FR-01.3]`.
   - `_update(uint balance0, uint balance1, uint112 _reserve0, uint112 _reserve1) private` — cập nhật reserves, emit `Sync`.
   - `mint(address to) external nonReentrant returns (uint liquidity)` — xử lý `[UC-04]`:
     - Tính `liquidity` theo `Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY` (lần đầu) hoặc `Math.min(amount0 * totalSupply / reserve0, amount1 * totalSupply / reserve1)`.
     - Gọi `_mint(to, liquidity)`.
     - Emit `Mint`.
   - `burn(address to) external nonReentrant returns (uint amount0, uint amount1)` — xử lý `[UC-05]`:
     - Tính `amount0 = liquidity * balance0 / totalSupply`, `amount1 = liquidity * balance1 / totalSupply`.
     - Transfer Token về cho `to`.
     - Gọi `_burn(address(this), liquidity)`.
     - Emit `Burn`.
   - `swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external nonReentrant` — xử lý `[UC-03]`:
     - Validate ít nhất 1 amountOut > 0.
     - Validate `to != token0 && to != token1`.
     - Transfer tokenOut cho `to`.
     - Tính balance mới, kiểm tra Constant Product: `balance0Adjusted * balance1Adjusted >= reserve0 * reserve1 * 1000**2` (tính phí 0.3%).
     - Gọi `_update()`, emit `Swap`.

## Đầu ra mong muốn

Lõi AMM hoàn chỉnh — mint LP, burn LP, swap token — có ReentrancyGuard bảo vệ.
