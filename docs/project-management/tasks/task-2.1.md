# Task 2.1: Contract Interfaces

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** C4-Component (toàn bộ SC boundary)
- **Task phụ thuộc:** Task 1.2
- **Đường dẫn File:** `contracts/interfaces/ILizSwapFactory.sol`, `contracts/interfaces/ILizSwapPair.sol`, `contracts/interfaces/ILizSwapRouter.sol`, `contracts/interfaces/ILizSwapERC20.sol`

## Mô tả chi tiết công việc

1. **`ILizSwapFactory.sol`**:
   - `event PairCreated(address indexed token0, address indexed token1, address pair, uint256 pairIndex)`
   - `function getPair(address tokenA, address tokenB) external view returns (address pair)`
   - `function createPair(address tokenA, address tokenB) external returns (address pair)`
   - `function allPairs(uint256) external view returns (address pair)`
   - `function allPairsLength() external view returns (uint256)`

2. **`ILizSwapPair.sol`**:
   - `event Mint(address indexed sender, uint256 amount0, uint256 amount1)` — phát ra khi Add Liquidity `[UC-04]`
   - `event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)` — phát ra khi Remove Liquidity `[UC-05]`
   - `event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)` — phát khi Swap `[UC-03]`
   - `event Sync(uint112 reserve0, uint112 reserve1)` — đồng bộ reserve
   - `function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)` — đọc reserve cho `[FR-01.3]`
   - `function mint(address to) external returns (uint256 liquidity)`
   - `function burn(address to) external returns (uint256 amount0, uint256 amount1)`
   - `function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external`
   - `function token0() external view returns (address)`
   - `function token1() external view returns (address)`
   - `function factory() external view returns (address)`

3. **`ILizSwapERC20.sol`**:
   - Kế thừa chuẩn IERC20 từ OpenZeppelin, thêm `function DOMAIN_SEPARATOR()` và `function PERMIT_TYPEHASH()` nếu cần (tùy chọn cho permit).

4. **`ILizSwapRouter.sol`**:
   - `function factory() external view returns (address)`
   - `function WETH() external view returns (address)`
   - `function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)` — `[FR-02.4]`
   - `function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)` — `[FR-03.2]`
   - `function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)` — `[FR-01.5]`
   - `function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)` — `[FR-01.3]`
   - `function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)` — `[FR-01.4]`
   - `function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)` — `[FR-02.2]`

## Đầu ra mong muốn

Tất cả Interface contracts biên dịch thành công, định nghĩa đầy đủ function signatures + events cho toàn bộ ecosystem.
