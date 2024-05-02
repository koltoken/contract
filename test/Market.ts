import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Market", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.marketKol.appId()).eq(info.appId);
    expect(await info.marketKol.totalPercent()).eq(await info.foundry.TOTAL_PERCENT());
    expect(await info.marketKol.mortgageNFT()).eq(await info.mortgageNFTKol.getAddress());
    expect(await info.marketKol.publicNFT()).eq(await info.publicNFTKol.getAddress());
    expect(await info.marketKol.buySellFee()).eq(info.buySellFee);
    expect(await info.marketKol.curve()).eq(await info.kolCurve.getAddress());
    expect(await info.marketKol.feeDenominator()).eq(await info.foundry.FEE_DENOMINATOR());
    expect(await info.marketKol.foundry()).eq(await info.foundry.getAddress());
  });

  it("initialize", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    await expect(
      info.marketKol.initialize(await info.publicNFTKol.getAddress(), await info.mortgageNFTKol.getAddress()),
    ).revertedWith("onlyFoundry");
  });

  it("getPayTokenAmount", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.marketKol.getPayTokenAmount(100, 1000)).eq(await info.kolCurve.curveMath(100, 1000));
  });

  it("getBuyPayTokenAmount tid not exist", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.marketKol.getBuyPayTokenAmount("t123", 1000)).eq(await info.kolCurve.curveMath(0, 1000));
  });

  it("getSellPayTokenAmount tid not exist", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    await expect(info.marketKol.getSellPayTokenAmount("t123", 1)).revertedWithPanic();
  });

  it("totalSupply tid not exist", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.marketKol.totalSupply("t123")).eq(0);
  });

  it("balanceOf tid not exist", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.marketKol.balanceOf("t123", info.deployWallet.address)).eq(0);
  });
});
