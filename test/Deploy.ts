import { deployAllContracts, ZERO_ADDRESS } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { AllContractInfoWithETH } from "./shared/deployWithETH";

describe("Deploy", function () {
  let info: AllContractInfoWithETH;
  before(async function () {
    let allInfo = await loadFixture(deployAllContracts);
    info = allInfo.eth
  });

  it("PublicNFTFactory", async function () {
    expect(await info.publicNFTFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("MortgageNFTFactory", async function () {
    expect(await info.mortgageNFTFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("MarketFactory", async function () {
    expect(await info.marketFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("Foundry", async function () {
    expect(await info.foundry.FEE_DENOMINATOR()).eq(100000);
    expect(await info.foundry.TOTAL_PERCENT()).eq(100000);

    expect(await info.foundry.publicNFTFactory()).eq(await info.publicNFTFactory.getAddress());
    expect(await info.foundry.mortgageNFTFactory()).eq(await info.mortgageNFTFactory.getAddress());
    expect(await info.foundry.marketFactory()).eq(await info.marketFactory.getAddress());

    expect(await info.foundry.defaultMortgageFee()).eq(info.mortgageFee);
    expect(await info.foundry.defaultMortgageFeeRecipient()).eq(info.mortgageFeeWallet.address);

    expect(await info.foundry.nextAppId()).eq(2);

    expect(await info.foundry.mortgageFee(info.appId)).eq(info.mortgageFee);
    expect(await info.foundry.mortgageFeeRecipient(info.appId)).eq(info.mortgageFeeWallet.address);

    expect(await info.foundry.owner()).eq(await info.deployWallet.getAddress());

    let kolInfo = await info.foundry.apps(info.appId);
    expect(kolInfo.name).eq(info.appName);
    expect(kolInfo.owner).eq(info.kolOwnerWallet.address).not.eq(ZERO_ADDRESS);
    expect(kolInfo.operator)
      .eq(await info.kol.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(kolInfo.publicNFT)
      .eq(await info.publicNFTKol.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(kolInfo.mortgageNFT)
      .eq(await info.mortgageNFTKol.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(kolInfo.market)
      .eq(await info.marketKol.getAddress())
      .not.eq(ZERO_ADDRESS);

    let emptyInfo0 = await info.foundry.apps(0);
    expect(emptyInfo0.name).eq("");
    expect(emptyInfo0.owner).eq(ZERO_ADDRESS);
    expect(emptyInfo0.operator).eq(ZERO_ADDRESS);
    expect(emptyInfo0.publicNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo0.mortgageNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo0.market).eq(ZERO_ADDRESS);

    let emptyInfo2 = await info.foundry.apps(2);
    expect(emptyInfo2.name).eq("");
    expect(emptyInfo2.owner).eq(ZERO_ADDRESS);
    expect(emptyInfo2.operator).eq(ZERO_ADDRESS);
    expect(emptyInfo2.publicNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo2.mortgageNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo2.market).eq(ZERO_ADDRESS);
  });

  it("PublicNFT", async function () {
    expect(await info.publicNFTKol.foundry()).eq(await info.foundry.getAddress());
    expect(await info.publicNFTKol.appId()).eq(info.appId);
    expect(await info.publicNFTKol.publicNFTView()).eq(ZERO_ADDRESS);
  });

  it("MortgageNFT", async function () {
    expect(await info.mortgageNFTKol.foundry()).eq(await info.foundry.getAddress());
    expect(await info.mortgageNFTKol.appId()).eq(info.appId);
    expect(await info.mortgageNFTKol.market()).eq(await info.marketKol.getAddress());
    expect(await info.mortgageNFTKol.mortgageNFTView()).eq(ZERO_ADDRESS);
  });

  it("Market", async function () {
    expect(await info.marketKol.feeDenominator()).eq(await info.foundry.FEE_DENOMINATOR());
    expect(await info.marketKol.totalPercent()).eq(await info.foundry.TOTAL_PERCENT());

    expect(await info.marketKol.foundry()).eq(await info.foundry.getAddress());
    expect(await info.marketKol.appId()).eq(1);

    expect(await info.marketKol.publicNFT()).eq(await info.publicNFTKol.getAddress());
    expect(await info.marketKol.mortgageNFT()).eq(await info.mortgageNFTKol.getAddress());

    let curve = await info.marketKol.curve();
    expect(curve).eq(await info.kolCurve.getAddress());

    expect(await info.marketKol.buySellFee()).eq(info.buySellFee);
  });

  it("Kol", async function () {
    expect(await info.kol.foundry()).eq(await info.foundry.getAddress());
    expect(await info.kol.appId()).eq(info.appId);

    expect(await info.kol.mortgageNFT()).eq(await info.mortgageNFTKol.getAddress());
    expect(await info.kol.market()).eq(await info.marketKol.getAddress());

    expect(await info.kol.kolNFTClaim()).eq(await info.kolNFTClaim.getAddress());
    expect(await info.kol.fundRecipient()).eq(await info.kolFundRecipientWallet.address);
    expect(await info.kol.signatureAddress()).eq(await info.signatureWallet.address);
  });

  it("KolNFTClaim", async function () {
    expect(await info.kolNFTClaim.kol()).eq(await info.kol.getAddress());
    expect(await info.kolNFTClaim.publicNFT()).eq(await info.publicNFTKol.getAddress());
    expect(await info.kolNFTClaim.signatureAddress()).eq(await info.signatureWallet.address);
  });
});
