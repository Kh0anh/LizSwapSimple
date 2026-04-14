/**
 * Test 2.5: Math Libraries — Unit Tests
 *
 * Giải quyết:
 *   [FR-01.3] Kiểm tra công thức getAmountOut với phí 0.3%
 *   [FR-01.4] Kiểm tra getAmountsOut multi-hop
 *   [FR-02.2] Kiểm tra quote proportional
 *   project-structure.md §1 — test/libraries/
 *
 * Test coverage cho Math.sol và LizSwapLibrary.sol.
 * Sử dụng MathWrapper và LizSwapLibraryWrapper (helper contracts)
 * để gọi các hàm internal của library từ TypeScript.
 *
 * Dùng Hardhat v3 pattern: hre.network.connect() để lấy ethers helpers.
 */

import { expect } from "chai";
import hre from "hardhat";

describe("Task 2.5: Math Libraries", function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ethers: any;

  before(async function () {
    const connection = await hre.network.connect();
    ethers = connection.ethers;
  });

  // =========================================================================
  // Math.sol — Unit Tests
  // =========================================================================
  describe("Math.sol", function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let math: any;

    before(async function () {
      const MathWrapperFactory = await ethers.getContractFactory("MathWrapper");
      math = await MathWrapperFactory.deploy();
      await math.waitForDeployment();
    });

    // -----------------------------------------------------------------------
    // min()
    // -----------------------------------------------------------------------
    describe("min(x, y)", function () {
      it("[FR-02.4] Trả về x khi x < y", async function () {
        expect(await math.min(3n, 7n)).to.equal(3n);
      });

      it("[FR-02.4] Trả về y khi y < x", async function () {
        expect(await math.min(100n, 50n)).to.equal(50n);
      });

      it("[FR-02.4] Trả về x khi x == y (bằng nhau)", async function () {
        expect(await math.min(42n, 42n)).to.equal(42n);
      });

      it("[FR-02.4] Trả về 0 khi cả hai đều là 0", async function () {
        expect(await math.min(0n, 0n)).to.equal(0n);
      });

      it("[FR-02.4] Xử lý đúng với số cực lớn (max uint256)", async function () {
        const maxUint = ethers.MaxUint256;
        expect(await math.min(maxUint, 1n)).to.equal(1n);
        expect(await math.min(1n, maxUint)).to.equal(1n);
      });
    });

    // -----------------------------------------------------------------------
    // sqrt()
    // -----------------------------------------------------------------------
    describe("sqrt(y) — Babylonian Method", function () {
      it("[FR-01.3] sqrt(0) = 0", async function () {
        expect(await math.sqrt(0n)).to.equal(0n);
      });

      it("[FR-01.3] sqrt(1) = 1", async function () {
        expect(await math.sqrt(1n)).to.equal(1n);
      });

      it("[FR-01.3] sqrt(2) = 1 (floor)", async function () {
        expect(await math.sqrt(2n)).to.equal(1n);
      });

      it("[FR-01.3] sqrt(3) = 1 (floor)", async function () {
        expect(await math.sqrt(3n)).to.equal(1n);
      });

      it("[FR-01.3] sqrt(4) = 2 (perfect square)", async function () {
        expect(await math.sqrt(4n)).to.equal(2n);
      });

      it("[FR-01.3] sqrt(9) = 3 (perfect square)", async function () {
        expect(await math.sqrt(9n)).to.equal(3n);
      });

      it("[FR-01.3] sqrt(16) = 4 (perfect square)", async function () {
        expect(await math.sqrt(16n)).to.equal(4n);
      });

      it("[FR-01.3] sqrt(100) = 10 (perfect square)", async function () {
        expect(await math.sqrt(100n)).to.equal(10n);
      });

      it("[FR-01.3] sqrt(1000000e18 * 1000000e18) = 1000000e18 (initial liquidity simulation)", async function () {
        // Mô phỏng: mint lần đầu với 1,000,000 tokens (18 decimals)
        const amount = ethers.parseUnits("1000000", 18);
        const product = amount * amount;
        const result = await math.sqrt(product);
        // Kết quả phải bằng đúng amount (sqrt của a^2 = a)
        expect(result).to.equal(amount);
      });

      it("[FR-01.3] sqrt cho giá trị không phải perfect square trả về floor", async function () {
        // sqrt(5) = 2.236... → floor = 2
        expect(await math.sqrt(5n)).to.equal(2n);
        // sqrt(10) = 3.162... → floor = 3
        expect(await math.sqrt(10n)).to.equal(3n);
        // sqrt(99) = 9.949... → floor = 9
        expect(await math.sqrt(99n)).to.equal(9n);
      });

      it("[FR-01.3] Kết quả sqrt^2 <= input (tính chất floor)", async function () {
        const testValues = [5n, 7n, 15n, 1000n, 999999n];
        for (const y of testValues) {
          const z = await math.sqrt(y);
          // floor(sqrt(y))^2 <= y < (floor(sqrt(y)) + 1)^2
          expect(z * z).to.be.lte(y);
          expect((z + 1n) * (z + 1n)).to.be.gt(y);
        }
      });
    });
  });

  // =========================================================================
  // LizSwapLibrary.sol — Unit Tests
  // =========================================================================
  describe("LizSwapLibrary.sol", function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lib: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let factory: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tokenA: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tokenB: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let owner: any;

    before(async function () {
      const signers = await ethers.getSigners();
      owner = signers[0];

      // Deploy wrapper contract
      const LibWrapper = await ethers.getContractFactory("LizSwapLibraryWrapper");
      lib = await LibWrapper.deploy();
      await lib.waitForDeployment();

      // Deploy Factory
      const FactoryFactory = await ethers.getContractFactory("LizSwapFactory");
      factory = await FactoryFactory.deploy();
      await factory.waitForDeployment();

      // Deploy 2 MockERC20 tokens
      const MockToken = await ethers.getContractFactory("MockERC20");
      const tokenX = await MockToken.deploy("TokenX", "TKX");
      const tokenY = await MockToken.deploy("TokenY", "TKY");
      await tokenX.waitForDeployment();
      await tokenY.waitForDeployment();

      // Sort để đảm bảo tokenA < tokenB theo địa chỉ
      const addrX = await tokenX.getAddress();
      const addrY = await tokenY.getAddress();
      if (addrX.toLowerCase() < addrY.toLowerCase()) {
        tokenA = tokenX;
        tokenB = tokenY;
      } else {
        tokenA = tokenY;
        tokenB = tokenX;
      }
    });

    // -----------------------------------------------------------------------
    // sortTokens()
    // -----------------------------------------------------------------------
    describe("sortTokens(tokenA, tokenB)", function () {
      it("[UC-03] Sắp xếp đúng: token0 < token1 theo địa chỉ", async function () {
        const addrA = await tokenA.getAddress();
        const addrB = await tokenB.getAddress();
        const [t0, t1] = await lib.sortTokens(addrA, addrB);
        const expectedToken0 =
          addrA.toLowerCase() < addrB.toLowerCase() ? addrA.toLowerCase() : addrB.toLowerCase();
        expect(t0.toLowerCase()).to.equal(expectedToken0);
        expect(t1.toLowerCase()).to.not.equal(t0.toLowerCase());
      });

      it("[UC-03] sortTokens(A, B) == sortTokens(B, A) — thứ tự input không quan trọng", async function () {
        const addrA = await tokenA.getAddress();
        const addrB = await tokenB.getAddress();
        const [t0_ab, t1_ab] = await lib.sortTokens(addrA, addrB);
        const [t0_ba, t1_ba] = await lib.sortTokens(addrB, addrA);
        expect(t0_ab).to.equal(t0_ba);
        expect(t1_ab).to.equal(t1_ba);
      });

      it("[UC-03] Revert nếu tokenA == tokenB (IDENTICAL_ADDRESSES)", async function () {
        const addrA = await tokenA.getAddress();
        await expect(lib.sortTokens(addrA, addrA)).to.be.revertedWith(
          "LizSwapLibrary: IDENTICAL_ADDRESSES"
        );
      });

      it("[UC-03] Revert nếu token là address(0) (ZERO_ADDRESS)", async function () {
        const addrA = await tokenA.getAddress();
        const zeroAddr = "0x0000000000000000000000000000000000000000";
        await expect(lib.sortTokens(zeroAddr, addrA)).to.be.revertedWith(
          "LizSwapLibrary: ZERO_ADDRESS"
        );
      });
    });

    // -----------------------------------------------------------------------
    // quote()
    // -----------------------------------------------------------------------
    describe("quote(amountA, reserveA, reserveB)", function () {
      it("[FR-02.2] Tính đúng amountB proportional: amountB = amountA * reserveB / reserveA", async function () {
        // reserveA = 1000, reserveB = 2000, amountA = 100
        // amountB = 100 * 2000 / 1000 = 200
        expect(await lib.quote(100n, 1000n, 2000n)).to.equal(200n);
      });

      it("[FR-02.2] quote với tỷ lệ 1:1: amountB == amountA", async function () {
        expect(await lib.quote(500n, 1000n, 1000n)).to.equal(500n);
      });

      it("[FR-02.2] quote với tỷ lệ không đều (floor division)", async function () {
        // 1 * 3 / 2 = 1 (floor)
        expect(await lib.quote(1n, 2n, 3n)).to.equal(1n);
      });

      it("[FR-02.2] Revert nếu amountA = 0 (INSUFFICIENT_AMOUNT)", async function () {
        await expect(lib.quote(0n, 1000n, 2000n)).to.be.revertedWith(
          "LizSwapLibrary: INSUFFICIENT_AMOUNT"
        );
      });

      it("[FR-02.2] Revert nếu reserveA = 0 (INSUFFICIENT_LIQUIDITY)", async function () {
        await expect(lib.quote(100n, 0n, 2000n)).to.be.revertedWith(
          "LizSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
      });

      it("[FR-02.2] Revert nếu reserveB = 0 (INSUFFICIENT_LIQUIDITY)", async function () {
        await expect(lib.quote(100n, 1000n, 0n)).to.be.revertedWith(
          "LizSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
      });
    });

    // -----------------------------------------------------------------------
    // getAmountOut()
    // -----------------------------------------------------------------------
    describe("getAmountOut(amountIn, reserveIn, reserveOut) — Phí 0.3%", function () {
      it("[FR-01.3] Tính đúng amountOut theo công thức AMM có phí", async function () {
        // amountIn = 1000, reserveIn = 10000, reserveOut = 10000
        // amountInWithFee = 1000 * 997 = 997000
        // numerator = 997000 * 10000 = 9970000000
        // denominator = 10000 * 1000 + 997000 = 10997000
        // amountOut = 9970000000 / 10997000 = 906 (floor)
        const result = await lib.getAmountOut(1000n, 10000n, 10000n);
        expect(result).to.equal(906n);
      });

      it("[FR-01.3] Small swap: output ít hơn input do phí và slippage", async function () {
        // Với pool cân bằng lớn, output < input do phí 0.3%
        const reserveIn = ethers.parseEther("1000");
        const reserveOut = ethers.parseEther("1000");
        const amountIn = ethers.parseEther("1");
        const amountOut = await lib.getAmountOut(amountIn, reserveIn, reserveOut);
        // Output nhỏ hơn input do phí
        expect(amountOut).to.be.lt(amountIn);
        // Output phải > 0
        expect(amountOut).to.be.gt(0n);
      });

      it("[FR-01.3] Invariant x*y=k được giữ (k_new >= k_old sau swap)", async function () {
        const reserveIn = 100000n;
        const reserveOut = 100000n;
        const amountIn = 1000n;
        const amountOut = await lib.getAmountOut(amountIn, reserveIn, reserveOut);

        // k_old = reserveIn * reserveOut
        const k_old = reserveIn * reserveOut;
        // k_new = (reserveIn + amountIn) * (reserveOut - amountOut)
        const k_new = (reserveIn + amountIn) * (reserveOut - amountOut);
        // Fee làm k_new >= k_old (reserves tăng do fee tích luỹ)
        expect(k_new).to.be.gte(k_old);
      });

      it("[FR-01.3] Revert nếu amountIn = 0 (INSUFFICIENT_INPUT_AMOUNT)", async function () {
        await expect(lib.getAmountOut(0n, 10000n, 10000n)).to.be.revertedWith(
          "LizSwapLibrary: INSUFFICIENT_INPUT_AMOUNT"
        );
      });

      it("[FR-01.3] Revert nếu reserveIn = 0 (INSUFFICIENT_LIQUIDITY)", async function () {
        await expect(lib.getAmountOut(100n, 0n, 10000n)).to.be.revertedWith(
          "LizSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
      });

      it("[FR-01.3] Revert nếu reserveOut = 0 (INSUFFICIENT_LIQUIDITY)", async function () {
        await expect(lib.getAmountOut(100n, 10000n, 0n)).to.be.revertedWith(
          "LizSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
      });

      it("[FR-01.3] Phí 0.3% xác nhận: output có phí < output không có phí", async function () {
        // Không phí: amountOut_nofee = amountIn * reserveOut / (reserveIn + amountIn)
        // Có phí:    amountOut_fee < amountOut_nofee (do tính 997/1000)
        const amountIn = 1000n;
        const reserveIn = 10000n;
        const reserveOut = 10000n;
        const amountOutFee = await lib.getAmountOut(amountIn, reserveIn, reserveOut);
        const amountOutNoFee = (amountIn * reserveOut) / (reserveIn + amountIn);
        expect(amountOutFee).to.be.lt(amountOutNoFee);
      });
    });

    // -----------------------------------------------------------------------
    // Integration: pairFor + getReserves + getAmountsOut (cần Pool thực)
    // -----------------------------------------------------------------------
    describe("Integration: pairFor, getReserves, getAmountsOut", function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pairAddress: any;

      before(async function () {
        // Tạo Pool cho tokenA/tokenB
        const addrA = await tokenA.getAddress();
        const addrB = await tokenB.getAddress();
        await factory.createPair(addrA, addrB);
        pairAddress = await factory.getPair(addrA, addrB);

        // Mint token cho owner
        const amount = ethers.parseEther("10000");
        await tokenA.mint(owner.address, amount);
        await tokenB.mint(owner.address, amount);

        // Nạp thanh khoản trực tiếp vào Pair
        const liquidityAmount = ethers.parseEther("1000");
        await tokenA.transfer(pairAddress, liquidityAmount);
        await tokenB.transfer(pairAddress, liquidityAmount);

        // Gọi mint để cập nhật reserves trong Pair
        const pair = await ethers.getContractAt("LizSwapPair", pairAddress);
        await pair.mint(owner.address);
      });

      it("[UC-03] pairFor() trả về đúng địa chỉ Pair từ Factory", async function () {
        const addrA = await tokenA.getAddress();
        const addrB = await tokenB.getAddress();
        const factoryAddr = await factory.getAddress();

        const returnedPair = await lib.pairFor(factoryAddr, addrA, addrB);
        expect(returnedPair.toLowerCase()).to.equal(pairAddress.toLowerCase());
      });

      it("[UC-03] pairFor() với thứ tự ngược cũng trả cùng địa chỉ", async function () {
        const addrA = await tokenA.getAddress();
        const addrB = await tokenB.getAddress();
        const factoryAddr = await factory.getAddress();

        const pair_ab = await lib.pairFor(factoryAddr, addrA, addrB);
        const pair_ba = await lib.pairFor(factoryAddr, addrB, addrA);
        expect(pair_ab).to.equal(pair_ba);
      });

      it("[UC-03] pairFor() revert với pair chưa tồn tại (PAIR_NOT_EXISTS)", async function () {
        const factoryAddr = await factory.getAddress();
        // Hai địa chỉ giả không có pool
        const fakeAddr1 = "0x1000000000000000000000000000000000000001";
        const fakeAddr2 = "0x2000000000000000000000000000000000000002";
        await expect(
          lib.pairFor(factoryAddr, fakeAddr1, fakeAddr2)
        ).to.be.revertedWith("LizSwapLibrary: PAIR_NOT_EXISTS");
      });

      it("[FR-01.3] getReserves() trả về đúng reserves của Pool (> 0)", async function () {
        const addrA = await tokenA.getAddress();
        const addrB = await tokenB.getAddress();
        const factoryAddr = await factory.getAddress();

        const [resA, resB] = await lib.getReserves(factoryAddr, addrA, addrB);
        expect(resA).to.be.gt(0n);
        expect(resB).to.be.gt(0n);
      });

      it("[FR-01.3] getReserves(A,B) swaps với getReserves(B,A) — sort đúng thứ tự", async function () {
        const addrA = await tokenA.getAddress();
        const addrB = await tokenB.getAddress();
        const factoryAddr = await factory.getAddress();

        const [resA_ab, resB_ab] = await lib.getReserves(factoryAddr, addrA, addrB);
        const [resA_ba, resB_ba] = await lib.getReserves(factoryAddr, addrB, addrA);
        // Khi đảo thứ tự, A/B reserves phải swap
        expect(resA_ab).to.equal(resB_ba);
        expect(resB_ab).to.equal(resA_ba);
      });

      it("[FR-01.4] getAmountsOut() tính đúng cho path 1-hop [A → B]", async function () {
        const addrA = await tokenA.getAddress();
        const addrB = await tokenB.getAddress();
        const factoryAddr = await factory.getAddress();

        const amountIn = ethers.parseEther("1");
        const amounts = await lib.getAmountsOut(factoryAddr, amountIn, [addrA, addrB]);

        expect(amounts.length).to.equal(2);
        // amounts[0] phải bằng amountIn
        expect(amounts[0]).to.equal(amountIn);
        // amounts[1] phải > 0 (có output)
        expect(amounts[1]).to.be.gt(0n);
        // amounts[1] phải < amountIn (phí + slippage)
        expect(amounts[1]).to.be.lt(amountIn);
      });

      it("[FR-01.4] getAmountsOut() revert với path < 2 phần tử (INVALID_PATH)", async function () {
        const addrA = await tokenA.getAddress();
        const factoryAddr = await factory.getAddress();

        await expect(
          lib.getAmountsOut(factoryAddr, 100n, [addrA])
        ).to.be.revertedWith("LizSwapLibrary: INVALID_PATH");
      });
    });
  });
});
