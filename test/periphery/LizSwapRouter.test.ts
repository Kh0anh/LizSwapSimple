// ============================================================================
// LizSwapRouter.test.ts — Task 2.6: Smoke Test cho LizSwapRouter (Periphery)
// Giải quyết:
//   [UC-03] Hoán đổi Token (Swap) — swapExactTokensForTokens
//   [UC-04] Thêm Thanh khoản (Add Liquidity) — addLiquidity
//   [UC-05] Rút Thanh khoản (Remove Liquidity) — removeLiquidity
//   [FR-01.3] Công thức x*y=k — tính toán output đúng
//   [FR-01.4] Slippage/deadline protection
//   [FR-02.4] Mint LP Token sau addLiquidity
//   [FR-03.2] Burn LP Token, nhận lại token A + B
//
// Test các chức năng chính của LizSwapRouter:
//   1. Deploy Router với Factory address
//   2. addLiquidity — tạo Pool mới, nhận LP Token [UC-04]
//   3. addLiquidity — thêm vào Pool đã có, tính proportional [FR-02.2]
//   4. removeLiquidity — đốt LP Token, nhận lại token [UC-05]
//   5. swapExactTokensForTokens — swap 2-hop [UC-03]
//   6. getAmountsOut — tính output preview [FR-01.4]
//   7. quote, getAmountOut — pure math functions [FR-01.3]
//   8. Validation — deadline expired, slippage protection
// ============================================================================

import { expect } from "chai";
import hre from "hardhat";

describe("LizSwapRouter", function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ethers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let factory: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let router: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenA: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenB: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let owner: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any;

  // Hằng số
  const INITIAL_SUPPLY = 100_000n * 10n ** 18n; // 100,000 tokens

  // Helper: deadline 10 phút từ bây giờ
  function futureDeadline(minutes = 10): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
  }

  before(async function () {
    const connection = await hre.network.connect();
    ethers = connection.ethers;
  });

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    user = signers[1];

    // Deploy MockERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    await tokenA.waitForDeployment();
    tokenB = await MockERC20.deploy("Token B", "TKB");
    await tokenB.waitForDeployment();

    // Đảm bảo tokenA < tokenB theo địa chỉ (canonical order)
    const addrA = await tokenA.getAddress();
    const addrB = await tokenB.getAddress();
    if (addrA.toLowerCase() > addrB.toLowerCase()) {
      [tokenA, tokenB] = [tokenB, tokenA];
    }

    // Mint token cho owner và user
    await tokenA.mint(owner.address, INITIAL_SUPPLY);
    await tokenB.mint(owner.address, INITIAL_SUPPLY);
    await tokenA.mint(user.address, INITIAL_SUPPLY);
    await tokenB.mint(user.address, INITIAL_SUPPLY);

    // Deploy Factory
    const FactoryContract = await ethers.getContractFactory("LizSwapFactory");
    factory = await FactoryContract.deploy();
    await factory.waitForDeployment();

    // Deploy Router với factory address, WETH = address(0) cho MVP
    const RouterContract = await ethers.getContractFactory("LizSwapRouter");
    router = await RouterContract.deploy(
      await factory.getAddress(),
      ethers.ZeroAddress // WETH = address(0)
    );
    await router.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // 1. Deploy & State Variables
  // ---------------------------------------------------------------------------

  describe("Deploy & State Variables", function () {
    it("factory() trả về đúng địa chỉ Factory", async function () {
      expect(await router.factory()).to.equal(await factory.getAddress());
    });

    it("WETH() trả về address(0) (MVP scope)", async function () {
      expect(await router.WETH()).to.equal(ethers.ZeroAddress);
    });

    it("Revert khi deploy với factory = address(0)", async function () {
      const RouterContract = await ethers.getContractFactory("LizSwapRouter");
      await expect(
        RouterContract.deploy(ethers.ZeroAddress, ethers.ZeroAddress)
      ).to.be.revertedWith("LizSwapRouter: ZERO_FACTORY");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Pure/View Functions — [FR-01.3] [FR-02.2]
  // ---------------------------------------------------------------------------

  describe("Pure/View: quote(), getAmountOut(), getAmountsOut()", function () {
    it("quote() tính đúng amountB theo tỷ giá reserve [FR-02.2]", async function () {
      // amountB = amountA * reserveB / reserveA
      // 100 * 4000 / 1000 = 400
      const result = await router.quote(100n, 1000n, 4000n);
      expect(result).to.equal(400n);
    });

    it("quote() revert khi amountA = 0", async function () {
      await expect(
        router.quote(0n, 1000n, 4000n)
      ).to.be.revertedWith("LizSwapLibrary: INSUFFICIENT_AMOUNT");
    });

    it("getAmountOut() tính đúng output theo x*y=k có phí 0.3% [FR-01.3]", async function () {
      // amountInWithFee = 100 * 997 = 99700
      // numerator = 99700 * 4000 = 398_800_000
      // denominator = 1000 * 1000 + 99700 = 1_099_700
      // amountOut = 398_800_000 / 1_099_700 = 362 (floor)
      const result = await router.getAmountOut(100n, 1000n, 4000n);
      expect(result).to.equal(362n);
    });

    it("getAmountOut() revert khi amountIn = 0", async function () {
      await expect(
        router.getAmountOut(0n, 1000n, 4000n)
      ).to.be.revertedWith("LizSwapLibrary: INSUFFICIENT_INPUT_AMOUNT");
    });

    it("getAmountsOut() tính đúng mảng output cho 2-hop path [FR-01.4]", async function () {
      // Setup: tạo Pool trước để getAmountsOut có thể đọc reserves
      const liquidityA = 1000n * 10n ** 18n;
      const liquidityB = 4000n * 10n ** 18n;

      await tokenA.approve(await router.getAddress(), liquidityA);
      await tokenB.approve(await router.getAddress(), liquidityB);

      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        liquidityA,
        liquidityB,
        0n,
        0n,
        owner.address,
        futureDeadline()
      );

      const amountIn = 100n * 10n ** 18n;
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];

      const amounts = await router.getAmountsOut(amountIn, path);
      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0n);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. addLiquidity — [UC-04] [FR-02.4]
  // ---------------------------------------------------------------------------

  describe("addLiquidity() — [UC-04] [FR-02.4]", function () {
    it("Tạo Pool mới và mint LP Token cho caller [FR-02.4]", async function () {
      const amountA = 1000n * 10n ** 18n;
      const amountB = 4000n * 10n ** 18n;

      // [UC-02] Approve Router trước khi addLiquidity
      await tokenA.approve(await router.getAddress(), amountA);
      await tokenB.approve(await router.getAddress(), amountB);

      // Pool chưa tồn tại
      expect(
        await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress())
      ).to.equal(ethers.ZeroAddress);

      // [UC-04] addLiquidity — tự động tạo Pool
      const tx = await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0n, // amountAMin = 0 (no slippage protection in test)
        0n, // amountBMin = 0
        owner.address,
        futureDeadline()
      );
      await tx.wait();

      // Pair phải được tạo
      const pairAddress = await factory.getPair(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);

      // [FR-02.4] Owner phải nhận LP Token
      const pair = await ethers.getContractAt("LizSwapPair", pairAddress);
      const lpBalance = await pair.balanceOf(owner.address);
      expect(lpBalance).to.be.gt(0n);
    });

    it("addLiquidity trả về amountA, amountB, liquidity chính xác", async function () {
      const amountA = 1000n * 10n ** 18n;
      const amountB = 4000n * 10n ** 18n;

      await tokenA.approve(await router.getAddress(), amountA);
      await tokenB.approve(await router.getAddress(), amountB);

      // Gọi static để lấy return values
      const [retA, retB, retLiquidity] = await router.addLiquidity.staticCall(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0n,
        0n,
        owner.address,
        futureDeadline()
      );

      expect(retA).to.equal(amountA);
      expect(retB).to.equal(amountB);
      // liquidity = sqrt(1000 * 4000) * 1e18 - MINIMUM_LIQUIDITY
      const MINIMUM_LIQUIDITY = 1000n;
      expect(retLiquidity).to.equal(2000n * 10n ** 18n - MINIMUM_LIQUIDITY);
    });

    it("addLiquidity lần hai tính proportional đúng [FR-02.2]", async function () {
      // Lần 1: 1000 / 4000
      const amountA1 = 1000n * 10n ** 18n;
      const amountB1 = 4000n * 10n ** 18n;

      await tokenA.approve(await router.getAddress(), amountA1);
      await tokenB.approve(await router.getAddress(), amountB1);
      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA1,
        amountB1,
        0n, 0n,
        owner.address,
        futureDeadline()
      );

      // Lần 2: thêm 200 tokenA với tỷ giá 1:4 → cần 800 tokenB
      const amountA2 = 200n * 10n ** 18n;
      const amountB2Desired = 1000n * 10n ** 18n; // nhiều hơn cần thiết

      await tokenA.approve(await router.getAddress(), amountA2);
      await tokenB.approve(await router.getAddress(), amountB2Desired);

      // staticCall để kiểm tra amounts thực sự được dùng
      const [retA, retB] = await router.addLiquidity.staticCall(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA2,
        amountB2Desired,
        0n, 0n,
        owner.address,
        futureDeadline()
      );

      // amountB phải = amountA * reserveB / reserveA = 200 * 4000 / 1000 = 800
      expect(retA).to.equal(amountA2);
      expect(retB).to.equal(800n * 10n ** 18n);
    });

    it("addLiquidity revert khi deadline hết hạn [FR-01.4]", async function () {
      const amountA = 1000n * 10n ** 18n;
      const amountB = 4000n * 10n ** 18n;

      await tokenA.approve(await router.getAddress(), amountA);
      await tokenB.approve(await router.getAddress(), amountB);

      // Deadline đã qua (Unix timestamp 1)
      await expect(
        router.addLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          amountA,
          amountB,
          0n, 0n,
          owner.address,
          1n // deadline quá khứ
        )
      ).to.be.revertedWith("LizSwapRouter: EXPIRED");
    });

    it("addLiquidity revert khi slippage quá cao [FR-01.4]", async function () {
      // Setup Pool trước
      const amountA1 = 1000n * 10n ** 18n;
      const amountB1 = 4000n * 10n ** 18n;
      await tokenA.approve(await router.getAddress(), amountA1);
      await tokenB.approve(await router.getAddress(), amountB1);
      await router.addLiquidity(
        await tokenA.getAddress(), await tokenB.getAddress(),
        amountA1, amountB1, 0n, 0n, owner.address, futureDeadline()
      );

      // Lần 2: amountBMin quá cao so với optimal
      const amountA2 = 200n * 10n ** 18n;
      await tokenA.approve(await router.getAddress(), amountA2);
      await tokenB.approve(await router.getAddress(), 1000n * 10n ** 18n);

      // amountBMin = 900e18 nhưng optimal chỉ = 800e18 → revert
      await expect(
        router.addLiquidity(
          await tokenA.getAddress(), await tokenB.getAddress(),
          amountA2, 1000n * 10n ** 18n,
          0n, 900n * 10n ** 18n, // amountBMin = 900, nhưng optimal = 800
          owner.address, futureDeadline()
        )
      ).to.be.revertedWith("LizSwapRouter: INSUFFICIENT_B_AMOUNT");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. removeLiquidity — [UC-05] [FR-03.2]
  // ---------------------------------------------------------------------------

  describe("removeLiquidity() — [UC-05] [FR-03.2]", function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pair: any;
    let pairAddress: string;

    beforeEach(async function () {
      // Setup: Add liquidity trước
      const amountA = 1000n * 10n ** 18n;
      const amountB = 4000n * 10n ** 18n;

      await tokenA.approve(await router.getAddress(), amountA);
      await tokenB.approve(await router.getAddress(), amountB);

      await router.addLiquidity(
        await tokenA.getAddress(), await tokenB.getAddress(),
        amountA, amountB, 0n, 0n,
        owner.address, futureDeadline()
      );

      pairAddress = await factory.getPair(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      pair = await ethers.getContractAt("LizSwapPair", pairAddress);
    });

    it("removeLiquidity trả lại token A và B [FR-03.2]", async function () {
      const lpBalance = await pair.balanceOf(owner.address);
      expect(lpBalance).to.be.gt(0n);

      // [UC-02] [FR-03.3] Approve LP Token cho Router
      await pair.approve(await router.getAddress(), lpBalance);

      const balanceABefore = await tokenA.balanceOf(owner.address);
      const balanceBBefore = await tokenB.balanceOf(owner.address);

      // [UC-05] removeLiquidity
      await router.removeLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        lpBalance,
        0n, 0n, // amountAMin, amountBMin = 0
        owner.address,
        futureDeadline()
      );

      const balanceAAfter = await tokenA.balanceOf(owner.address);
      const balanceBAfter = await tokenB.balanceOf(owner.address);

      // [FR-03.2] Số dư token phải tăng sau removeLiquidity
      expect(balanceAAfter).to.be.gt(balanceABefore);
      expect(balanceBAfter).to.be.gt(balanceBBefore);
    });

    it("removeLiquidity burn hết LP Token của owner", async function () {
      const lpBalance = await pair.balanceOf(owner.address);
      await pair.approve(await router.getAddress(), lpBalance);

      await router.removeLiquidity(
        await tokenA.getAddress(), await tokenB.getAddress(),
        lpBalance, 0n, 0n, owner.address, futureDeadline()
      );

      // Owner LP balance phải = 0 sau removeLiquidity
      expect(await pair.balanceOf(owner.address)).to.equal(0n);
    });

    it("removeLiquidity revert khi deadline hết hạn", async function () {
      const lpBalance = await pair.balanceOf(owner.address);
      await pair.approve(await router.getAddress(), lpBalance);

      await expect(
        router.removeLiquidity(
          await tokenA.getAddress(), await tokenB.getAddress(),
          lpBalance, 0n, 0n, owner.address,
          1n // deadline quá khứ
        )
      ).to.be.revertedWith("LizSwapRouter: EXPIRED");
    });

    it("removeLiquidity revert khi slippage amountAMin quá cao", async function () {
      const lpBalance = await pair.balanceOf(owner.address);
      await pair.approve(await router.getAddress(), lpBalance);

      // amountAMin = 2000e18 >> số token A thực nhận được (~999.5e18)
      await expect(
        router.removeLiquidity(
          await tokenA.getAddress(), await tokenB.getAddress(),
          lpBalance,
          2000n * 10n ** 18n, // amountAMin quá cao
          0n,
          owner.address, futureDeadline()
        )
      ).to.be.revertedWith("LizSwapRouter: INSUFFICIENT_A_AMOUNT");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. swapExactTokensForTokens — [UC-03] [FR-01.5]
  // ---------------------------------------------------------------------------

  describe("swapExactTokensForTokens() — [UC-03] [FR-01.5]", function () {
    beforeEach(async function () {
      // Setup: Add liquidity cho Pool tokenA/tokenB
      const amountA = 10_000n * 10n ** 18n;
      const amountB = 40_000n * 10n ** 18n;

      await tokenA.approve(await router.getAddress(), amountA);
      await tokenB.approve(await router.getAddress(), amountB);

      await router.addLiquidity(
        await tokenA.getAddress(), await tokenB.getAddress(),
        amountA, amountB, 0n, 0n,
        owner.address, futureDeadline()
      );
    });

    it("Swap tokenA → tokenB thành công [UC-03]", async function () {
      const amountIn = 100n * 10n ** 18n; // Swap 100 tokenA

      // [FR-01.4] Tính amountOutMin trước để set slippage
      const amounts = await router.getAmountsOut(
        amountIn,
        [await tokenA.getAddress(), await tokenB.getAddress()]
      );
      const amountOutMin = amounts[1] * 95n / 100n; // 5% slippage tolerance

      // [UC-02] Approve tokenA cho Router
      await tokenA.connect(user).approve(await router.getAddress(), amountIn);

      const balanceBBefore = await tokenB.balanceOf(user.address);

      // [UC-03] [FR-01.5] Gửi giao dịch swap
      await router.connect(user).swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        user.address,
        futureDeadline()
      );

      const balanceBAfter = await tokenB.balanceOf(user.address);

      // User phải nhận được tokenB >= amountOutMin
      expect(balanceBAfter - balanceBBefore).to.be.gte(amountOutMin);
    });

    it("Swap tokenB → tokenA thành công", async function () {
      const amountIn = 400n * 10n ** 18n; // Swap 400 tokenB

      const amounts = await router.getAmountsOut(
        amountIn,
        [await tokenB.getAddress(), await tokenA.getAddress()]
      );
      const amountOutMin = amounts[1] * 95n / 100n;

      await tokenB.connect(user).approve(await router.getAddress(), amountIn);

      const balanceABefore = await tokenA.balanceOf(user.address);

      await router.connect(user).swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        [await tokenB.getAddress(), await tokenA.getAddress()],
        user.address,
        futureDeadline()
      );

      const balanceAAfter = await tokenA.balanceOf(user.address);
      expect(balanceAAfter - balanceABefore).to.be.gte(amountOutMin);
    });

    it("Swap trả về mảng amounts đúng [FR-01.3]", async function () {
      const amountIn = 100n * 10n ** 18n;
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];

      await tokenA.approve(await router.getAddress(), amountIn);

      // staticCall để lấy return value
      const amounts = await router.swapExactTokensForTokens.staticCall(
        amountIn,
        0n,
        path,
        owner.address,
        futureDeadline()
      );

      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0n);
      // amountOut phải khớp với getAmountsOut
      const expectedAmounts = await router.getAmountsOut(amountIn, path);
      expect(amounts[1]).to.equal(expectedAmounts[1]);
    });

    it("Swap revert khi amountOutMin quá cao (slippage) [FR-01.4]", async function () {
      const amountIn = 100n * 10n ** 18n;

      await tokenA.connect(user).approve(await router.getAddress(), amountIn);

      // amountOutMin = 99999 tokenB >> thực thế chỉ nhận ~400 tokenB
      await expect(
        router.connect(user).swapExactTokensForTokens(
          amountIn,
          99_999n * 10n ** 18n, // amountOutMin quá cao
          [await tokenA.getAddress(), await tokenB.getAddress()],
          user.address,
          futureDeadline()
        )
      ).to.be.revertedWith("LizSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT");
    });

    it("Swap revert khi deadline hết hạn [FR-01.4]", async function () {
      const amountIn = 100n * 10n ** 18n;
      await tokenA.connect(user).approve(await router.getAddress(), amountIn);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          amountIn, 0n,
          [await tokenA.getAddress(), await tokenB.getAddress()],
          user.address,
          1n // deadline quá khứ
        )
      ).to.be.revertedWith("LizSwapRouter: EXPIRED");
    });

    it("Swap revert khi path chỉ có 1 phần tử", async function () {
      const amountIn = 100n * 10n ** 18n;
      await tokenA.connect(user).approve(await router.getAddress(), amountIn);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          amountIn, 0n,
          [await tokenA.getAddress()], // path không hợp lệ
          user.address,
          futureDeadline()
        )
      ).to.be.revertedWith("LizSwapLibrary: INVALID_PATH");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Multi-hop Swap — [UC-03] (path dài 3 token)
  // ---------------------------------------------------------------------------

  describe("Multi-hop Swap — 3 token path [UC-03]", function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tokenC: any;

    beforeEach(async function () {
      // Deploy token thứ ba
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      tokenC = await MockERC20.deploy("Token C", "TKC");
      await tokenC.waitForDeployment();
      await tokenC.mint(owner.address, INITIAL_SUPPLY);
      await tokenC.mint(user.address, INITIAL_SUPPLY);

      // Pool 1: tokenA / tokenB (1000:4000)
      const amtA = 1000n * 10n ** 18n;
      const amtB = 4000n * 10n ** 18n;
      await tokenA.approve(await router.getAddress(), amtA);
      await tokenB.approve(await router.getAddress(), amtB);
      await router.addLiquidity(
        await tokenA.getAddress(), await tokenB.getAddress(),
        amtA, amtB, 0n, 0n, owner.address, futureDeadline()
      );

      // Pool 2: tokenB / tokenC (4000:8000)
      const amtB2 = 4000n * 10n ** 18n;
      const amtC2 = 8000n * 10n ** 18n;

      // Sắp xếp đúng thứ tự cho pool B/C
      const addrB = await tokenB.getAddress();
      const addrC = await tokenC.getAddress();
      const [firstToken, secondToken, firstAmt, secondAmt] =
        addrB.toLowerCase() < addrC.toLowerCase()
          ? [tokenB, tokenC, amtB2, amtC2]
          : [tokenC, tokenB, amtC2, amtB2];

      await firstToken.approve(await router.getAddress(), firstAmt);
      await secondToken.approve(await router.getAddress(), secondAmt);
      await router.addLiquidity(
        await firstToken.getAddress(), await secondToken.getAddress(),
        firstAmt, secondAmt, 0n, 0n, owner.address, futureDeadline()
      );
    });

    it("Swap 3-hop: tokenA → tokenB → tokenC thành công", async function () {
      const amountIn = 50n * 10n ** 18n;
      const path = [
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        await tokenC.getAddress(),
      ];

      // [FR-01.4] Tính amountOut trước
      const amounts = await router.getAmountsOut(amountIn, path);
      expect(amounts.length).to.equal(3);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0n);
      expect(amounts[2]).to.be.gt(0n);

      // [UC-02] Approve tokenA cho user
      await tokenA.connect(user).approve(await router.getAddress(), amountIn);

      const balanceCBefore = await tokenC.balanceOf(user.address);

      // [UC-03] Thực hiện multi-hop swap
      await router.connect(user).swapExactTokensForTokens(
        amountIn,
        0n, // amountOutMin = 0 trong test
        path,
        user.address,
        futureDeadline()
      );

      const balanceCAfter = await tokenC.balanceOf(user.address);
      expect(balanceCAfter - balanceCBefore).to.equal(amounts[2]);
    });
  });
});
