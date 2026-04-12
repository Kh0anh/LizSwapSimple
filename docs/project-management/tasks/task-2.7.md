# Task 2.7: MockERC20 Token

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** project-structure.md §1 (mock/)
- **Task phụ thuộc:** Task 1.2
- **Đường dẫn File:** `contracts/mock/MockERC20.sol`

## Mô tả chi tiết công việc

1. Contract kế thừa `ERC20` từ OpenZeppelin.
2. Constructor nhận `name`, `symbol`, `initialSupply`.
3. `mint(address to, uint256 amount)` public — cho deployer mint token tùy ý khi test.
4. Sử dụng cho môi trường Local Hardhat & BSC Testnet làm Token A / Token B giả lập.

## Đầu ra mong muốn

MockERC20 deploy được, mint token cho test. Ít nhất tạo 2 Mock Token (ví dụ: "MockUSDT" và "MockDAI").
