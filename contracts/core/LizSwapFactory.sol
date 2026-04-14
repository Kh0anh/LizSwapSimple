// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// LizSwapFactory.sol — Task 2.3: Factory Contract
// Giải quyết: C4-Component (Factory component)
//
// Contract Factory chịu trách nhiệm:
//   1. Tạo mới các Pair Pool (LizSwapPair) theo từng cặp token [C4-Factory]
//   2. Lưu trữ registry địa chỉ toàn bộ Pool đã được tạo
//   3. Cung cấp hàm truy vấn getPair và allPairs cho Router và Frontend
//
// Lưu ý kiến trúc:
//   - Factory import ILizSwapFactory để đảm bảo implement đúng interface
//   - Factory dùng CREATE opcode (new LizSwapPair()) thay vì CREATE2 cho đơn giản
//   - Import LizSwapPair.sol trực tiếp (Task 2.4 đã hoàn thành)
// ============================================================================

import "../interfaces/ILizSwapFactory.sol";
import "./LizSwapPair.sol";

/**
 * @title LizSwapFactory
 * @notice Contract Factory quản lý registry các cặp token (Pair Pool) trong
 *         hệ sinh thái LizSwapSimple DEX.
 *
 * @dev Implements ILizSwapFactory. Chịu trách nhiệm:
 *      - Deploy LizSwapPair mới qua `new` (CREATE opcode)
 *      - Lưu địa chỉ Pair vào mapping getPair (cả hai chiều)
 *      - Emit PairCreated event cho mỗi Pool mới [C4-Component - Factory]
 *
 *      Khác biệt so với Uniswap V2 gốc:
 *      - Uniswap V2 dùng CREATE2 với bytecode assembly để tạo Pair
 *      - LizSwapSimple dùng `new LizSwapPair()` (CREATE) để đơn giản hơn cho mục đích học thuật
 *      - Không có `feeToSetter` / `feeTo` — phí được xử lý toàn bộ trong Pool (0.3% cố định)
 */
contract LizSwapFactory is ILizSwapFactory {
    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------

    /**
     * @notice Registry mapping từ cặp (tokenA, tokenB) → địa chỉ Pair Pool.
     * @dev Được lưu theo cả hai chiều: getPair[token0][token1] == getPair[token1][token0].
     *      Trả về address(0) nếu Pool chưa tồn tại.
     *      [C4-Component - Factory: "Tạo và theo dõi registry của tất cả các Pair"]
     */
    mapping(address => mapping(address => address)) private _getPair;

    /**
     * @notice Danh sách tuần tự tất cả các Pair Pool đã được tạo.
     * @dev Dùng để enumerate toàn bộ Pool trong hệ thống.
     *      Index 0-based. Length = allPairsLength().
     */
    address[] private _allPairs;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @notice Khởi tạo Factory. Không có tham số vì Factory tự quản lý hoàn toàn.
     * @dev Không mint hay deploy gì ở đây. Chỉ là khởi tạo contract trống.
     */
    constructor() {}

    // -------------------------------------------------------------------------
    // View Functions — ILizSwapFactory implementation
    // -------------------------------------------------------------------------

    /**
     * @notice Truy vấn địa chỉ Pair Pool của một cặp token.
     * @dev Thứ tự tokenA/tokenB không quan trọng (cả hai chiều đều lưu).
     *      Trả về address(0) nếu Pool chưa tồn tại.
     *      [C4-Component - Router gọi Factory.getPair() để lấy địa chỉ Pool]
     *
     * @param tokenA Địa chỉ token A (thứ tự bất kỳ)
     * @param tokenB Địa chỉ token B (thứ tự bất kỳ)
     * @return pair  Địa chỉ LizSwapPair tương ứng (address(0) nếu chưa có)
     */
    function getPair(address tokenA, address tokenB)
        external
        view
        override
        returns (address pair)
    {
        // Lấy từ mapping — cả hai chiều đều cho kết quả như nhau
        return _getPair[tokenA][tokenB];
    }

    /**
     * @notice Truy vấn địa chỉ Pair theo chỉ số trong mảng allPairs.
     * @dev Index 0-based. Revert nếu index >= allPairsLength().
     *
     * @param index Chỉ số trong mảng allPairs
     * @return pair Địa chỉ LizSwapPair tại index đó
     */
    function allPairs(uint256 index)
        external
        view
        override
        returns (address pair)
    {
        return _allPairs[index];
    }

    /**
     * @notice Tổng số Pair Pool đã được tạo trong hệ thống.
     * @return Số lượng Pool (= độ dài mảng allPairs)
     */
    function allPairsLength() external view override returns (uint256) {
        return _allPairs.length;
    }

    // -------------------------------------------------------------------------
    // Mutating Functions — Core Factory Logic
    // -------------------------------------------------------------------------

    /**
     * @notice Tạo mới một Pair Pool cho cặp tokenA/tokenB.
     *
     * @dev Luồng thực thi [C4-Component - Factory]:
     *      1. Validate input: tokenA != tokenB, cả hai != address(0)
     *      2. Sort token: token0 < token1 (theo địa chỉ) → đảm bảo canonical order
     *      3. Kiểm tra Pool chưa tồn tại: getPair[token0][token1] == address(0)
     *      4. Deploy LizSwapPair mới bằng `new LizSwapPair()`
     *      5. Gọi pair.initialize(token0, token1) để set token addresses trong Pair
     *      6. Lưu địa chỉ vào _getPair mapping (cả hai chiều)
     *      7. Push vào _allPairs array
     *      8. Emit PairCreated event
     *
     *      Tại sao sort token?
     *      Đảm bảo mỗi cặp (A,B) chỉ có DUY NHẤT một địa chỉ Pool, bất kể
     *      caller truyền (A,B) hay (B,A). Token có địa chỉ nhỏ hơn luôn là token0.
     *
     * @param tokenA Địa chỉ token A (thứ tự bất kỳ)
     * @param tokenB Địa chỉ token B (thứ tự bất kỳ)
     * @return pair  Địa chỉ LizSwapPair vừa được deploy
     */
    function createPair(address tokenA, address tokenB)
        external
        override
        returns (address pair)
    {
        // --- Bước 1: Validate input ---
        // [C4-Component - Factory] Kiểm tra tokenA và tokenB hợp lệ
        require(tokenA != tokenB, "LizSwapFactory: IDENTICAL_ADDRESSES");
        require(tokenA != address(0) && tokenB != address(0), "LizSwapFactory: ZERO_ADDRESS");

        // --- Bước 2: Sort token để đảm bảo canonical order ---
        // token0 luôn có địa chỉ nhỏ hơn token1 (so sánh uint160)
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);

        // --- Bước 3: Kiểm tra Pool chưa tồn tại ---
        require(
            _getPair[token0][token1] == address(0),
            "LizSwapFactory: PAIR_EXISTS"
        );

        // --- Bước 4: Deploy LizSwapPair mới ---
        // Import LizSwapPair tại thời điểm runtime (Task 2.4).
        // Sử dụng CREATE opcode (`new`) thay vì CREATE2 cho đơn giản (mục đích học thuật).
        // LizSwapPair phải được import ở đây khi Task 2.4 hoàn thành.
        LizSwapPair newPair = new LizSwapPair();
        pair = address(newPair);

        // --- Bước 5: Gọi initialize() để set token addresses trong Pair ---
        // Gọi trực tiếp trên LizSwapPair contract (Task 2.4 đã implement đầy đủ).
        // LizSwapPair.initialize() chỉ được gọi một lần duy nhất ngay sau deploy.
        LizSwapPair(pair).initialize(token0, token1);

        // --- Bước 6: Lưu vào registry (cả hai chiều) ---
        // [C4-Component - Factory: "Tạo và theo dõi registry của tất cả các Pair"]
        _getPair[token0][token1] = pair; // chiều chuẩn
        _getPair[token1][token0] = pair; // chiều ngược — cùng Pool

        // --- Bước 7: Push vào danh sách tổng hợp ---
        _allPairs.push(pair);

        // --- Bước 8: Emit event PairCreated ---
        // pairIndex = allPairs.length (chỉ số 1-based theo convention Uniswap V2)
        emit PairCreated(token0, token1, pair, _allPairs.length);
    }
}
