// ============================================================================
// LizSwapPair.test.ts — Task 2.4: Unit Test Smoke cho Pair (Lõi AMM)
// Giải quyết: [FR-01.3] (x*y=k), [UC-03] Swap, [UC-04] Add, [UC-05] Remove
//
// Test các chức năng cốt lõi của LizSwapPair:
//   1. Deploy Pair thông qua Factory → initialize đúng
//   2. mint() — Thêm thanh khoản lần đầu và lần tiếp theo [UC-04]
//   3. burn() — Rút thanh khoản [UC-05]
//   4. swap() — Hoán đổi token theo x*y=k với phí 0.3% [UC-03]
//   5. getReserves() — Đọc reserves đúng [FR-01.3]
//   6. sync() — Đồng bộ reserves
//   7. Validation cases — INSUFFICIENT_LIQUIDITY, K invariant, etc.
//
// Lưu ý Hardhat v3:
//   - Dùng `hre.network.connect()` để lấy ethers helpers
//   - Sử dụng MockERC20 để tạo token test
// ============================================================================

import { expect } from "chai";
import hre from "hardhat";

describe("LizSwapPair", function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ethers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let factory: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenA: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenB: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pair: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let owner: any;

  // Hằng số dùng trong test
  const MINIMUM_LIQUIDITY = 1000n; // 10**3
  const INITIAL_SUPPLY = 10000n * 10n ** 18n; // 10,000 tokens mỗi loại

  before(async function () {
    const connection = await hre.network.connect();
    ethers = connection.ethers;
  });

  beforeEach(async function () {
    // Lấy signer (owner)
    const signers = await ethers.getSigners();
    owner = signers[0];

    // Deploy MockERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    await tokenA.waitForDeployment();
    tokenB = await MockERC20.deploy("Token B", "TKB");
    await tokenB.waitForDeployment();

    // Đảm bảo tokenA < tokenB (sort theo địa chỉ)
    const addrA = await tokenA.getAddress();
    const addrB = await tokenB.getAddress();
    if (addrA.toLowerCase() > addrB.toLowerCase()) {
      [tokenA, tokenB] = [tokenB, tokenA];
    }

    // Mint token cho owner
    await tokenA.mint(owner.address, INITIAL_SUPPLY);
    await tokenB.mint(owner.address, INITIAL_SUPPLY);

    // Deploy Factory và tạo Pair
    const FactoryContract = await ethers.getContractFactory("LizSwapFactory");
    factory = await FactoryContract.deploy();
    await factory.waitForDeployment();

    // Tạo Pair qua Factory
    await factory.createPair(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    const pairAddress = await factory.getPair(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    pair = await ethers.getContractAt("LizSwapPair", pairAddress);
  });

  // ---------------------------------------------------------------------------
  // 1. Deploy & Initialize
  // ---------------------------------------------------------------------------

  describe("Deploy & Initialize", function () {
    it("Pair có factory = địa chỉ Factory", async function () {
      expect(await pair.factory()).to.equal(await factory.getAddress());
    });

    it("Pair có token0 và token1 được set đúng", async function () {
      const token0 = await pair.token0();
      const token1 = await pair.token1();
      expect(token0.toLowerCase()).to.equal(
        (await tokenA.getAddress()).toLowerCase()
      );
      expect(token1.toLowerCase()).to.equal(
        (await tokenB.getAddress()).toLowerCase()
      );
    });

    it("Reserves ban đầu = 0", async function () {
      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.equal(0);
      expect(reserve1).to.equal(0);
    });

    it("MINIMUM_LIQUIDITY = 1000", async function () {
      expect(await pair.MINIMUM_LIQUIDITY()).to.equal(1000);
    });

    it("Revert khi gọi initialize() lần thứ hai", async function () {
      await expect(
        pair.initialize(
          await tokenA.getAddress(),
          await tokenB.getAddress()
        )
      ).to.be.revertedWith("LizSwapPair: ALREADY_INITIALIZED");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. mint() — Thêm thanh khoản [UC-04]
  // ---------------------------------------------------------------------------

  describe("mint() — Add Liquidity [UC-04]", function () {
    it("Mint LP Token lần đầu thành công", async function () {
      const amount0 = 1000n * 10n ** 18n; // 1000 tokenA
      const amount1 = 4000n * 10n ** 18n; // 4000 tokenB

      // [UC-04] Chuyển token vào Pair trước, rồi gọi mint
      await tokenA.transfer(await pair.getAddress(), amount0);
      await tokenB.transfer(await pair.getAddress(), amount1);

      await expect(pair.mint(owner.address))
        .to.emit(pair, "Mint")
        .withArgs(owner.address, amount0, amount1);

      // Kiểm tra LP Token balance
      // [FR-01.3] liquidity = sqrt(1000 * 4000) * 10^18 - MINIMUM_LIQUIDITY
      // sqrt(4,000,000) = 2000
      const expectedLiquidity = 2000n * 10n ** 18n;
      const ownerLP = await pair.balanceOf(owner.address);
      expect(ownerLP).to.equal(expectedLiquidity - MINIMUM_LIQUIDITY);

      // Kiểm tra MINIMUM_LIQUIDITY đã bị khoá tại 0xdead
      const deadLP = await pair.balanceOf(
        "0x000000000000000000000000000000000000dEaD"
      );
      expect(deadLP).to.equal(MINIMUM_LIQUIDITY);
    });

    it("Reserves được cập nhật đúng sau mint", async function () {
      const amount0 = 500n * 10n ** 18n;
      const amount1 = 2000n * 10n ** 18n;

      await tokenA.transfer(await pair.getAddress(), amount0);
      await tokenB.transfer(await pair.getAddress(), amount1);
      await pair.mint(owner.address);

      // [FR-01.3] getReserves phải trả về giá trị mới
      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.equal(amount0);
      expect(reserve1).to.equal(amount1);
    });

    it("Mint lần thứ hai tính proportional liquidity", async function () {
      // Lần 1: 1000 / 4000
      const amount0First = 1000n * 10n ** 18n;
      const amount1First = 4000n * 10n ** 18n;
      await tokenA.transfer(await pair.getAddress(), amount0First);
      await tokenB.transfer(await pair.getAddress(), amount1First);
      await pair.mint(owner.address);

      // Lần 2: thêm 500 / 2000 (tỷ lệ 1:4 giống nhau)
      const amount0Second = 500n * 10n ** 18n;
      const amount1Second = 2000n * 10n ** 18n;
      await tokenA.transfer(await pair.getAddress(), amount0Second);
      await tokenB.transfer(await pair.getAddress(), amount1Second);
      await pair.mint(owner.address);

      // [FR-02.4] Tổng LP = sqrt(1000*4000)*1e18 + min(500/1000, 2000/4000) * totalSupply
      // Lần 2 liquidity = min(500*2000e18/1000, 2000*2000e18/4000) * 1e18 = 1000e18
      // Tổng owner LP = (2000e18 - 1000) + 1000e18 = 3000e18 - 1000
      const ownerLP = await pair.balanceOf(owner.address);
      expect(ownerLP).to.equal(3000n * 10n ** 18n - MINIMUM_LIQUIDITY);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. burn() — Rút thanh khoản [UC-05]
  // ---------------------------------------------------------------------------

  describe("burn() — Remove Liquidity [UC-05]", function () {
    it("Burn LP Token trả lại token đúng tỷ lệ", async function () {
      const amount0 = 1000n * 10n ** 18n;
      const amount1 = 4000n * 10n ** 18n;

      // Add liquidity trước
      await tokenA.transfer(await pair.getAddress(), amount0);
      await tokenB.transfer(await pair.getAddress(), amount1);
      await pair.mint(owner.address);

      const liquidity = await pair.balanceOf(owner.address);

      // [UC-05] Chuyển LP Token vào Pair rồi gọi burn
      await pair.transfer(await pair.getAddress(), liquidity);

      const balanceBefore0 = await tokenA.balanceOf(owner.address);
      const balanceBefore1 = await tokenB.balanceOf(owner.address);

      await expect(pair.burn(owner.address)).to.emit(pair, "Burn");

      const balanceAfter0 = await tokenA.balanceOf(owner.address);
      const balanceAfter1 = await tokenB.balanceOf(owner.address);

      // [FR-03.2] Nhận lại token proportional (trừ MINIMUM_LIQUIDITY bị khoá)
      const received0 = balanceAfter0 - balanceBefore0;
      const received1 = balanceAfter1 - balanceBefore1;

      // Phải nhận lại gần đúng lượng đã nạp (trừ MINIMUM_LIQUIDITY)
      expect(received0).to.be.gt(0);
      expect(received1).to.be.gt(0);
      // Không nhận lại 100% vì MINIMUM_LIQUIDITY bị khoá
      expect(received0).to.be.lt(amount0);
      expect(received1).to.be.lt(amount1);
    });

    it("Reserves được cập nhật sau burn", async function () {
      const amount0 = 1000n * 10n ** 18n;
      const amount1 = 4000n * 10n ** 18n;

      await tokenA.transfer(await pair.getAddress(), amount0);
      await tokenB.transfer(await pair.getAddress(), amount1);
      await pair.mint(owner.address);

      const liquidity = await pair.balanceOf(owner.address);
      await pair.transfer(await pair.getAddress(), liquidity);
      await pair.burn(owner.address);

      // Reserves phải giảm (chỉ còn phần MINIMUM_LIQUIDITY khoá)
      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.be.lt(amount0);
      expect(reserve1).to.be.lt(amount1);
      expect(reserve0).to.be.gt(0); // Vẫn > 0 vì MINIMUM_LIQUIDITY
      expect(reserve1).to.be.gt(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. swap() — Hoán đổi token [UC-03]
  // ---------------------------------------------------------------------------

  describe("swap() — Hoán đổi token [UC-03]", function () {
    // Helper: thêm thanh khoản trước khi swap
    async function addLiquidity(amount0: bigint, amount1: bigint) {
      await tokenA.transfer(await pair.getAddress(), amount0);
      await tokenB.transfer(await pair.getAddress(), amount1);
      await pair.mint(owner.address);
    }

    it("Swap token0 → token1 thành công", async function () {
      // Thêm thanh khoản: 1000 tokenA / 4000 tokenB
      await addLiquidity(1000n * 10n ** 18n, 4000n * 10n ** 18n);

      // [UC-03] Swap: đổi 100 tokenA → nhận tokenB
      const swapAmount = 100n * 10n ** 18n;

      // Tính amountOut theo công thức x*y=k có phí 0.3%:
      // amountInWithFee = 100 * 997 = 99700
      // numerator = 99700 * 4000 = 398_800_000
      // denominator = 1000 * 1000 + 99700 = 1_099_700
      // amountOut = 398_800_000 / 1_099_700 ≈ 362.6 tokenB
      // (Tính xấp xỉ — đơn vị 10^18)
      const reserve0 = 1000n * 10n ** 18n;
      const reserve1 = 4000n * 10n ** 18n;
      const amountInWithFee = swapAmount * 997n;
      const numerator = amountInWithFee * reserve1;
      const denominator = reserve0 * 1000n + amountInWithFee;
      const expectedOut = numerator / denominator;

      // Chuyển token0 vào Pair trước
      await tokenA.transfer(await pair.getAddress(), swapAmount);

      const balanceBefore = await tokenB.balanceOf(owner.address);

      // [FR-01.3] Gọi swap — nhận token1 out
      await expect(pair.swap(0, expectedOut, owner.address, "0x"))
        .to.emit(pair, "Swap")
        .withArgs(owner.address, swapAmount, 0, 0, expectedOut, owner.address);

      const balanceAfter = await tokenB.balanceOf(owner.address);
      expect(balanceAfter - balanceBefore).to.equal(expectedOut);
    });

    it("Swap token1 → token0 thành công", async function () {
      // Thêm thanh khoản: 1000 tokenA / 4000 tokenB
      await addLiquidity(1000n * 10n ** 18n, 4000n * 10n ** 18n);

      // Swap: đổi 200 tokenB → nhận tokenA
      const swapAmount = 200n * 10n ** 18n;
      const reserve0 = 1000n * 10n ** 18n;
      const reserve1 = 4000n * 10n ** 18n;
      const amountInWithFee = swapAmount * 997n;
      const numerator = amountInWithFee * reserve0;
      const denominator = reserve1 * 1000n + amountInWithFee;
      const expectedOut = numerator / denominator;

      // Chuyển token1 vào Pair
      await tokenB.transfer(await pair.getAddress(), swapAmount);

      // [FR-01.3] Swap — nhận token0 out
      await pair.swap(expectedOut, 0, owner.address, "0x");

      // Kiểm tra reserves sau swap
      const [r0, r1] = await pair.getReserves();
      expect(r0).to.be.lt(reserve0); // reserve0 giảm
      expect(r1).to.be.gt(reserve1); // reserve1 tăng
    });

    it("Revert khi cả hai amountOut = 0", async function () {
      await addLiquidity(1000n * 10n ** 18n, 4000n * 10n ** 18n);

      await expect(
        pair.swap(0, 0, owner.address, "0x")
      ).to.be.revertedWith("LizSwapPair: INSUFFICIENT_OUTPUT_AMOUNT");
    });

    it("Revert khi amountOut > reserve (INSUFFICIENT_LIQUIDITY)", async function () {
      await addLiquidity(1000n * 10n ** 18n, 4000n * 10n ** 18n);

      // Yêu cầu rút nhiều hơn reserve
      await expect(
        pair.swap(2000n * 10n ** 18n, 0, owner.address, "0x")
      ).to.be.revertedWith("LizSwapPair: INSUFFICIENT_LIQUIDITY");
    });

    it("Revert khi to = token address (INVALID_TO)", async function () {
      await addLiquidity(1000n * 10n ** 18n, 4000n * 10n ** 18n);

      await expect(
        pair.swap(100n * 10n ** 18n, 0, await tokenA.getAddress(), "0x")
      ).to.be.revertedWith("LizSwapPair: INVALID_TO");
    });

    it("Revert khi K invariant bị vi phạm (quá nhiều output)", async function () {
      await addLiquidity(1000n * 10n ** 18n, 4000n * 10n ** 18n);

      // Chuyển ít token vào nhưng yêu cầu quá nhiều token ra
      const smallInput = 1n * 10n ** 18n; // 1 token
      await tokenA.transfer(await pair.getAddress(), smallInput);

      // Yêu cầu 500 tokenB ra (quá nhiều so với K invariant)
      await expect(
        pair.swap(0, 500n * 10n ** 18n, owner.address, "0x")
      ).to.be.revertedWith("LizSwapPair: K");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. sync() — Đồng bộ reserves
  // ---------------------------------------------------------------------------

  describe("sync()", function () {
    it("Đồng bộ reserves sau khi gửi token trực tiếp", async function () {
      // Thêm thanh khoản ban đầu
      await tokenA.transfer(await pair.getAddress(), 1000n * 10n ** 18n);
      await tokenB.transfer(await pair.getAddress(), 4000n * 10n ** 18n);
      await pair.mint(owner.address);

      // Gửi thêm token trực tiếp (không qua mint)
      const extraAmount = 100n * 10n ** 18n;
      await tokenA.transfer(await pair.getAddress(), extraAmount);

      // Reserves chưa cập nhật
      const [r0Before] = await pair.getReserves();
      expect(r0Before).to.equal(1000n * 10n ** 18n);

      // Gọi sync → reserves phải cập nhật theo balance thực
      await pair.sync();

      const [r0After] = await pair.getReserves();
      expect(r0After).to.equal(1000n * 10n ** 18n + extraAmount);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. getReserves() — [FR-01.3]
  // ---------------------------------------------------------------------------

  describe("getReserves() — [FR-01.3]", function () {
    it("Trả về blockTimestampLast khác 0 sau mint", async function () {
      await tokenA.transfer(await pair.getAddress(), 1000n * 10n ** 18n);
      await tokenB.transfer(await pair.getAddress(), 4000n * 10n ** 18n);
      await pair.mint(owner.address);

      const [, , blockTimestampLast] = await pair.getReserves();
      expect(blockTimestampLast).to.be.gt(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. kLast tracking
  // ---------------------------------------------------------------------------

  describe("kLast", function () {
    it("kLast được cập nhật sau mint", async function () {
      await tokenA.transfer(await pair.getAddress(), 1000n * 10n ** 18n);
      await tokenB.transfer(await pair.getAddress(), 4000n * 10n ** 18n);
      await pair.mint(owner.address);

      const kLast = await pair.kLast();
      // kLast = 1000e18 * 4000e18 = 4_000_000e36
      expect(kLast).to.equal(1000n * 10n ** 18n * 4000n * 10n ** 18n);
    });
  });
});
