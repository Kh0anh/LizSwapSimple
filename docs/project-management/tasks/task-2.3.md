# Task 2.3: LizSwapFactory.sol

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** C3 - Factory component
- **Task phụ thuộc:** Task 2.2
- **Đường dẫn File:** `contracts/core/LizSwapFactory.sol`

## Mô tả chi tiết công việc

1. **State Variables:**
   - `mapping(address => mapping(address => address)) public getPair` — registry lưu địa chỉ Pair.
   - `address[] public allPairs` — danh sách toàn bộ Pair đã tạo.
2. **Events:**
   - `event PairCreated(address indexed token0, address indexed token1, address pair, uint256)` — emit khi tạo Pool mới.
3. **Functions:**
   - `createPair(address tokenA, address tokenB) external returns (address pair)`:
     - Validate `tokenA != tokenB`, validate cả hai khác `address(0)`.
     - Sort token: `(token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA)`.
     - Kiểm tra `getPair[token0][token1] == address(0)` (chưa tồn tại).
     - Deploy `LizSwapPair` mới bằng `new LizSwapPair()` hoặc `create2`.
     - Gọi `pair.initialize(token0, token1)`.
     - Lưu vào `getPair` mapping (cả hai chiều) và push vào `allPairs`.
     - Emit `PairCreated`.
   - `allPairsLength() external view returns (uint256)`.

## Đầu ra mong muốn

Factory deploy được Pair mới, registry hoạt động.
