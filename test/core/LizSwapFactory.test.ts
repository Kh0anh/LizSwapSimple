// ============================================================================
// LizSwapFactory.test.ts — Task 2.3: Unit Test Smoke cho Factory
// Giải quyết: C4-Component (Factory boundary)
//
// Test các chức năng cốt lõi của LizSwapFactory:
//   1. Deploy Factory thành công
//   2. createPair() deploy Pair và lưu registry đúng
//   3. getPair() trả về địa chỉ đúng (cả hai chiều)
//   4. allPairsLength() tăng sau mỗi Pair mới
//   5. PairCreated event được emit đúng
//   6. Validation: token giống nhau, zero address, pair đã tồn tại
//
// Lưu ý Hardhat v3:
//   - Không dùng `import { ethers } from "hardhat"` (Hardhat v1/v2 pattern)
//   - Dùng `hre.network.connect()` để lấy ethers helpers — 1 lần duy nhất
//   - Chia sẻ `connection` và `ethers` qua toàn bộ test suite
// ============================================================================

import { expect } from "chai";
import hre from "hardhat";

describe("LizSwapFactory", function () {
  // Địa chỉ giả để test — không cần MockERC20 thật cho Factory test cơ bản
  const TOKEN_A = "0x0000000000000000000000000000000000000001";
  const TOKEN_B = "0x0000000000000000000000000000000000000002";
  const TOKEN_C = "0x0000000000000000000000000000000000000003";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  // Connection chia sẻ — Hardhat v3 API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ethers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let factory: any;

  before(async function () {
    // Kết nối 1 lần duy nhất, dùng chung cho toàn bộ suite này
    const connection = await hre.network.connect();
    ethers = connection.ethers;
  });

  beforeEach(async function () {
    // Deploy LizSwapFactory mới trước mỗi test
    const FactoryContract = await ethers.getContractFactory("LizSwapFactory");
    factory = await FactoryContract.deploy();
    await factory.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // 1. Deploy
  // ---------------------------------------------------------------------------

  describe("Deploy", function () {
    it("Deploy thành công, allPairsLength ban đầu = 0", async function () {
      expect(await factory.allPairsLength()).to.equal(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. createPair — happy path
  // ---------------------------------------------------------------------------

  describe("createPair — happy path", function () {
    it("Tạo Pair mới thành công và trả về địa chỉ Pair hợp lệ", async function () {
      // [C4-Factory] Factory deploy Pair mới
      const tx = await factory.createPair(TOKEN_A, TOKEN_B);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Địa chỉ Pair phải khác address(0)
      const pairAddress = await factory.getPair(TOKEN_A, TOKEN_B);
      expect(pairAddress).to.not.equal(ZERO_ADDRESS);
    });

    it("getPair trả về cùng địa chỉ theo cả hai chiều (A,B) và (B,A)", async function () {
      // [C4-Factory] Cả hai chiều phải cho kết quả giống nhau
      await factory.createPair(TOKEN_A, TOKEN_B);

      const pairAB = await factory.getPair(TOKEN_A, TOKEN_B);
      const pairBA = await factory.getPair(TOKEN_B, TOKEN_A);

      expect(pairAB).to.equal(pairBA);
      expect(pairAB).to.not.equal(ZERO_ADDRESS);
    });

    it("allPairsLength tăng lên 1 sau khi tạo Pair đầu tiên", async function () {
      await factory.createPair(TOKEN_A, TOKEN_B);
      expect(await factory.allPairsLength()).to.equal(1);
    });

    it("allPairsLength tăng lên 2 sau khi tạo Pair thứ hai", async function () {
      await factory.createPair(TOKEN_A, TOKEN_B);
      await factory.createPair(TOKEN_A, TOKEN_C);
      expect(await factory.allPairsLength()).to.equal(2);
    });

    it("allPairs(index) trả về đúng địa chỉ Pair vừa tạo", async function () {
      await factory.createPair(TOKEN_A, TOKEN_B);

      const pairFromGetPair = await factory.getPair(TOKEN_A, TOKEN_B);
      const pairFromAllPairs = await factory.allPairs(0);

      expect(pairFromAllPairs).to.equal(pairFromGetPair);
    });

    it("Pair mới có factory = địa chỉ Factory", async function () {
      await factory.createPair(TOKEN_A, TOKEN_B);
      const pairAddress = await factory.getPair(TOKEN_A, TOKEN_B);

      // Attach vào contract Pair bằng cùng connection
      const pairContract = await ethers.getContractAt(
        "LizSwapPair",
        pairAddress
      );
      const factoryAddr = await pairContract.factory();
      expect(factoryAddr).to.equal(await factory.getAddress());
    });

    it("Pair mới có token0 và token1 được sort đúng (token0 < token1)", async function () {
      // TOKEN_A < TOKEN_B (về mặt địa chỉ số học)
      await factory.createPair(TOKEN_A, TOKEN_B);
      const pairAddress = await factory.getPair(TOKEN_A, TOKEN_B);

      const pairContract = await ethers.getContractAt(
        "LizSwapPair",
        pairAddress
      );
      const token0 = await pairContract.token0();
      const token1 = await pairContract.token1();

      // token0 phải là address nhỏ hơn
      expect(token0.toLowerCase()).to.equal(TOKEN_A.toLowerCase());
      expect(token1.toLowerCase()).to.equal(TOKEN_B.toLowerCase());
    });

    it("Emit PairCreated event với đúng tham số", async function () {
      // [C4-Factory] Emit event khi tạo Pool mới
      await expect(factory.createPair(TOKEN_A, TOKEN_B))
        .to.emit(factory, "PairCreated")
        .withArgs(
          TOKEN_A,        // token0 (sort nhỏ hơn)
          TOKEN_B,        // token1 (sort lớn hơn)
          (value: string) => value !== ZERO_ADDRESS, // pair address khác 0
          1               // pairIndex = allPairs.length sau khi push
        );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. createPair — validation / error cases
  // ---------------------------------------------------------------------------

  describe("createPair — validation errors", function () {
    it("Revert khi tokenA == tokenB (IDENTICAL_ADDRESSES)", async function () {
      await expect(
        factory.createPair(TOKEN_A, TOKEN_A)
      ).to.be.revertedWith("LizSwapFactory: IDENTICAL_ADDRESSES");
    });

    it("Revert khi tokenA là zero address (ZERO_ADDRESS)", async function () {
      await expect(
        factory.createPair(ZERO_ADDRESS, TOKEN_B)
      ).to.be.revertedWith("LizSwapFactory: ZERO_ADDRESS");
    });

    it("Revert khi tokenB là zero address (ZERO_ADDRESS)", async function () {
      await expect(
        factory.createPair(TOKEN_A, ZERO_ADDRESS)
      ).to.be.revertedWith("LizSwapFactory: ZERO_ADDRESS");
    });

    it("Revert khi Pair đã tồn tại (PAIR_EXISTS)", async function () {
      await factory.createPair(TOKEN_A, TOKEN_B);
      await expect(
        factory.createPair(TOKEN_A, TOKEN_B)
      ).to.be.revertedWith("LizSwapFactory: PAIR_EXISTS");
    });

    it("Revert khi Pair đã tồn tại ngay cả khi truyền theo thứ tự ngược (B,A)", async function () {
      await factory.createPair(TOKEN_A, TOKEN_B);
      // Thứ tự ngược nhưng cùng cặp → PAIR_EXISTS
      await expect(
        factory.createPair(TOKEN_B, TOKEN_A)
      ).to.be.revertedWith("LizSwapFactory: PAIR_EXISTS");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. getPair — chưa tồn tại
  // ---------------------------------------------------------------------------

  describe("getPair — chưa tồn tại", function () {
    it("getPair trả về address(0) khi Pool chưa được tạo", async function () {
      const pairAddress = await factory.getPair(TOKEN_A, TOKEN_B);
      expect(pairAddress).to.equal(ZERO_ADDRESS);
    });
  });
});
