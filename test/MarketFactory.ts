import { deployAllContracts, ZERO_ADDRESS } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MarketFactory", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.marketFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("create", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    await expect(
      info.marketFactory.create(
        info.appId,
        await info.foundry.FEE_DENOMINATOR(),
        await info.foundry.TOTAL_PERCENT(),
        await info.kolCurve.getAddress(),
        ZERO_ADDRESS,
        info.buySellFee,
      ),
    ).revertedWith("onlyFoundry");
  });
});
