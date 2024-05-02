import { ethers } from "hardhat";
import { deployAllContracts, ZERO_ADDRESS } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { KolCurve } from "../typechain-types";

describe("Foundry", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

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
  });

  it("apps", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

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

    // deploy kolCurve
    let kolCurve = (await (await ethers.getContractFactory("KolCurve")).deploy()) as KolCurve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];
    let tx = await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await kolCurve.getAddress(),
      ZERO_ADDRESS,
      buySellFee,
    );
    console.log("publicNFTFactory ", await info.publicNFTFactory.getAddress())

    await expect(tx)
      .to.emit(info.foundry, "CreateApp")
      .withArgs(
        2,
        "app2",
        app2OwnerWallet.address,
        app2OperatorWallet.address,
        await kolCurve.getAddress(),
        ZERO_ADDRESS,
        buySellFee,
        "0xf41B47c54dEFF12f8fE830A411a09D865eBb120E",
        "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
        "0x06cd7788D77332cF1156f1E327eBC090B5FF16a3",
        info.deployWallet.address,
      );

    kolInfo = await info.foundry.apps(info.appId);
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

    emptyInfo0 = await info.foundry.apps(0);
    expect(emptyInfo0.name).eq("");
    expect(emptyInfo0.owner).eq(ZERO_ADDRESS);
    expect(emptyInfo0.operator).eq(ZERO_ADDRESS);
    expect(emptyInfo0.publicNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo0.mortgageNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo0.market).eq(ZERO_ADDRESS);

    let info2 = await info.foundry.apps(2);
    expect(info2.name).eq("app2");
    expect(info2.owner).eq(app2OwnerWallet.address);
    expect(info2.operator).eq(app2OperatorWallet.address);
    expect(info2.publicNFT).not.eq(ZERO_ADDRESS);
    expect(info2.mortgageNFT).not.eq(ZERO_ADDRESS);
    expect(info2.market).not.eq(ZERO_ADDRESS);
  });

  it("setMortgageFee mortgageFee", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.foundry.mortgageFee(info.appId)).eq(info.mortgageFee);
    expect(await info.foundry.mortgageFee(0)).eq(0);
    expect(await info.foundry.mortgageFee(2)).eq(0);

    // deploy kolCurve
    let kolCurve = (await (await ethers.getContractFactory("KolCurve")).deploy()) as KolCurve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];
    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await kolCurve.getAddress(),
      ZERO_ADDRESS,
      buySellFee,
    );

    let newOwner = info.wallets[info.nextWalletIndex + 2];
    expect(await info.foundry.owner()).eq(info.deployWallet.address);
    await info.foundry.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.foundry.owner()).eq(newOwner.address);
    await expect(info.foundry.connect(info.deployWallet).transferOwnership(newOwner.address)).revertedWith(
      "Ownable: caller is not the owner",
    );

    expect(await info.foundry.mortgageFee(info.appId)).eq(info.mortgageFee);
    expect(await info.foundry.mortgageFee(0)).eq(0);
    expect(await info.foundry.mortgageFee(2)).eq(info.mortgageFee);

    let newMortgageFee = info.mortgageFee + 1;
    await expect(info.foundry.connect(info.deployWallet).setMortgageFee(info.appId, newMortgageFee)).revertedWith(
      "Ownable: caller is not the owner",
    );

    await info.foundry.connect(newOwner).setMortgageFee(info.appId, newMortgageFee);
    expect(await info.foundry.mortgageFee(info.appId)).eq(newMortgageFee);
    expect(await info.foundry.mortgageFee(0)).eq(0);
    expect(await info.foundry.mortgageFee(2)).eq(info.mortgageFee);
  });

  it("mortgageFeeRecipient", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.foundry.mortgageFeeRecipient(info.appId)).eq(info.mortgageFeeWallet.address);
    expect(await info.foundry.mortgageFeeRecipient(0)).eq(ZERO_ADDRESS);
    expect(await info.foundry.mortgageFeeRecipient(2)).eq(ZERO_ADDRESS);

    // deploy kolCurve
    let kolCurve = (await (await ethers.getContractFactory("KolCurve")).deploy()) as KolCurve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];
    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await kolCurve.getAddress(),
      ZERO_ADDRESS,
      buySellFee,
    );

    let newOwner = info.wallets[info.nextWalletIndex + 2];
    expect(await info.foundry.owner()).eq(info.deployWallet.address);
    await info.foundry.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.foundry.owner()).eq(newOwner.address);
    await expect(info.foundry.connect(info.deployWallet).transferOwnership(newOwner.address)).revertedWith(
      "Ownable: caller is not the owner",
    );

    expect(await info.foundry.mortgageFeeRecipient(info.appId)).eq(info.mortgageFeeWallet.address);
    expect(await info.foundry.mortgageFeeRecipient(0)).eq(ZERO_ADDRESS);
    expect(await info.foundry.mortgageFeeRecipient(2)).eq(info.mortgageFeeWallet.address);

    let newMortgageFeeRecipient = info.wallets[info.nextWalletIndex + 2];
    await expect(
      info.foundry.connect(info.deployWallet).setMortgageFeeRecipient(info.appId, newMortgageFeeRecipient.address),
    ).revertedWith("Ownable: caller is not the owner");

    await info.foundry.connect(newOwner).setMortgageFeeRecipient(info.appId, newMortgageFeeRecipient.address);

    expect(newMortgageFeeRecipient).not.eq(info.mortgageFeeWallet.address);
    expect(await info.foundry.mortgageFeeRecipient(info.appId)).eq(newMortgageFeeRecipient.address);
    expect(await info.foundry.mortgageFeeRecipient(0)).eq(ZERO_ADDRESS);
    expect(await info.foundry.mortgageFeeRecipient(2)).eq(info.mortgageFeeWallet.address);
  });

  it("nextappid", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.foundry.nextAppId()).eq(2);

    // deploy kolCurve
    let kolCurve = (await (await ethers.getContractFactory("KolCurve")).deploy()) as KolCurve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];
    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await kolCurve.getAddress(),
      ZERO_ADDRESS,
      buySellFee,
    );

    expect(await info.foundry.nextAppId()).eq(3);
  });

  it("setAppOperator", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect((await info.foundry.apps(info.appId)).operator).eq(await info.kol.getAddress());

    let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
    await expect(info.foundry.setAppOperator(info.appId, newAppOperatorWallet.address)).revertedWith("AOE");

    await info.foundry.connect(info.kolOwnerWallet).setAppOperator(info.appId, newAppOperatorWallet.address);

    expect((await info.foundry.apps(info.appId)).operator).eq(newAppOperatorWallet.address);
    expect(await info.kol.getAddress()).not.eq(newAppOperatorWallet.address);
  });

  it("setAppOwner", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect((await info.foundry.apps(info.appId)).owner).eq(info.kolOwnerWallet.address);

    let newAppOwnerWallet = info.wallets[info.nextWalletIndex];
    await expect(info.foundry.setAppOwner(info.appId, newAppOwnerWallet.address)).revertedWith("AOE");

    await info.foundry.connect(info.kolOwnerWallet).setAppOwner(info.appId, newAppOwnerWallet.address);

    expect((await info.foundry.apps(info.appId)).owner).eq(newAppOwnerWallet.address);
    expect(info.kolOwnerWallet.address).not.eq(newAppOwnerWallet.address);

    await expect(
      info.foundry.connect(info.kolOwnerWallet).setAppOwner(info.appId, newAppOwnerWallet.address),
    ).revertedWith("AOE");

    await info.foundry.connect(newAppOwnerWallet).setAppOwner(info.appId, newAppOwnerWallet.address);
  });

  it("createToken", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect((await info.foundry.apps(info.appId)).operator).eq(await info.kol.getAddress());

    await expect(
      info.foundry.createToken(
        info.appId,
        "t1",
        "0x",
        [5000, 95000],
        [info.deployWallet.address, info.deployWallet.address],
        ["0x", "0x"],
      ),
    ).revertedWith("AOPE");

    let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
    await info.foundry.connect(info.kolOwnerWallet).setAppOperator(info.appId, newAppOperatorWallet.address);
    expect((await info.foundry.apps(info.appId)).operator).eq(newAppOperatorWallet.address);
    expect(await info.kol.getAddress()).not.eq(newAppOperatorWallet.address);

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          0,
          "t1",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("AE");

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId + 1,
          "t1",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("AE");

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          "t1",
          "0x",
          [5001, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("TPE");

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(info.appId, "t1", "0x", [5000, 95000], [ZERO_ADDRESS, info.deployWallet.address], ["0x", "0x"]),
    ).revertedWith("ADDE");

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(info.appId, "t1", "0x", [5000, 95000], [info.deployWallet.address, ZERO_ADDRESS], ["0x", "0x"]),
    ).revertedWith("ADDE");

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          "t1",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x"],
        ),
    ).revertedWith("LE2");

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(info.appId, "t1", "0x", [5000, 95000], [info.deployWallet.address], ["0x", "0x"]),
    ).revertedWith("LE1");

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          "t1",
          "0x",
          [5000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("LE1");

    let tx = await info.foundry
      .connect(newAppOperatorWallet)
      .createToken(
        info.appId,
        "t1",
        "0x",
        [5000, 95000],
        [info.wallets[1].address, info.wallets[2].address],
        ["0x", "0x"],
      );

    await expect(tx)
      .to.emit(info.foundry, "CreateToken")
      .withArgs(
        info.appId,
        "t1",
        "0x",
        [1, 2],
        [5000, 95000],
        [info.wallets[1].address, info.wallets[2].address],
        ["0x", "0x"],
        newAppOperatorWallet.address,
      );

    await expect(
      info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          "t1",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("TE");

    await info.foundry
      .connect(newAppOperatorWallet)
      .createToken(
        info.appId,
        "t2",
        "0x11",
        [5000, 95000],
        [info.wallets[3].address, info.wallets[4].address],
        ["0x22", "0x33"],
      );

    expect(await info.foundry.tokenData(info.appId, "t1")).eq("0x");
    expect(await info.foundry.tokenData(info.appId, "t2")).eq("0x11");

    const info1 = await info.publicNFTKol.tokenIdToInfo(1);
    const info2 = await info.publicNFTKol.tokenIdToInfo(2);
    const info3 = await info.publicNFTKol.tokenIdToInfo(3);
    const info4 = await info.publicNFTKol.tokenIdToInfo(4);
    expect(info1.tid).eq("t1");
    expect(info2.tid).eq("t1");
    expect(info1.percent).eq(5000);
    expect(info2.percent).eq(95000);
    expect(info1.data).eq("0x");
    expect(info2.data).eq("0x");
    expect(info1._owner).eq(info.wallets[1].address);
    expect(info2._owner).eq(info.wallets[2].address);

    expect(info3.tid).eq("t2");
    expect(info4.tid).eq("t2");
    expect(info3.percent).eq(5000);
    expect(info4.percent).eq(95000);
    expect(info3.data).eq("0x22");
    expect(info4.data).eq("0x33");
    expect(info3._owner).eq(info.wallets[3].address);
    expect(info4._owner).eq(info.wallets[4].address);

    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex + 1];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 2];

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          info.appId + 1,
          "t2",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("AE");

    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await info.kolCurve.getAddress(),
      ZERO_ADDRESS,
      info.buySellFee,
    );

    await info.foundry
      .connect(app2OperatorWallet)
      .createToken(
        info.appId + 1,
        "t2",
        "0x",
        [5000, 95000],
        [info.deployWallet.address, info.deployWallet.address],
        ["0x", "0x"],
      );
  });

  it("createApp loop", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.foundry.nextAppId()).eq(2);

    let address2Bool: any = {};
    let app1Info = await info.foundry.apps(1);
    address2Bool[app1Info.publicNFT] = true;
    address2Bool[app1Info.mortgageNFT] = true;
    address2Bool[app1Info.market] = true;

    // deploy kolCurve
    let kolCurve = (await (await ethers.getContractFactory("KolCurve")).deploy()) as KolCurve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];

    for (let i = 2; i <= 100; i++) {
      let appInfo = await info.foundry.apps(i);
      expect(appInfo.name).eq("");
      expect(appInfo.publicNFT).eq(ZERO_ADDRESS);
      expect(appInfo.mortgageNFT).eq(ZERO_ADDRESS);
      expect(appInfo.market).eq(ZERO_ADDRESS);

      let appName = `app${i}`;
      expect(await info.foundry.nextAppId()).eq(i);
      await info.foundry.createApp(
        appName,
        app2OwnerWallet.address,
        app2OperatorWallet.address,
        await kolCurve.getAddress(),
        ZERO_ADDRESS,
        buySellFee,
      );
      expect(await info.foundry.nextAppId()).eq(i + 1);

      appInfo = await info.foundry.apps(i);
      expect(appInfo.name).eq(appName);

      expect(address2Bool[appInfo.publicNFT]).eq(undefined);
      expect(address2Bool[appInfo.mortgageNFT]).eq(undefined);
      expect(address2Bool[appInfo.market]).eq(undefined);

      address2Bool[appInfo.publicNFT] = true;
      address2Bool[appInfo.mortgageNFT] = true;
      address2Bool[appInfo.market] = true;
    }
  });

  it("createToken loop", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect((await info.foundry.apps(info.appId)).operator).eq(await info.kol.getAddress());

    let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
    await info.foundry.connect(info.kolOwnerWallet).setAppOperator(info.appId, newAppOperatorWallet.address);

    for (let i = 1; i <= 100; i++) {
      let tid = `tid${i}`;
      let tData = ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint256"], [tid, i]);
      let nft1Data = ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint256", "uint256"], [tid, i, 1]);
      let nft2Data = ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint256", "uint256"], [tid, i, 2]);

      expect(await info.foundry.tokenData(info.appId, tid)).eq("0x");
      expect(await info.foundry.tokenExist(info.appId, tid)).eq(false);

      expect(await info.publicNFTKol.totalSupply()).eq(2 * i - 2);

      await expect(info.publicNFTKol.ownerOf(2 * i - 1)).revertedWith("ERC721: invalid token ID");
      await expect(info.publicNFTKol.ownerOf(2 * i)).revertedWith("ERC721: invalid token ID");

      await expect(info.publicNFTKol.tokenIdToInfo(2 * i - 1)).revertedWith("ERC721: invalid token ID");
      await expect(info.publicNFTKol.tokenIdToInfo(2 * i)).revertedWith("ERC721: invalid token ID");

      let tokenIds = await info.publicNFTKol.tidToTokenIds(tid);
      expect(tokenIds.length).eq(0);

      let infos = await info.publicNFTKol.tidToInfos(tid);
      expect(infos.tokenIds.length).eq(0);
      expect(infos.percents.length).eq(0);
      expect(infos.data.length).eq(0);
      expect(infos.owners.length).eq(0);

      let tx = await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          tid,
          tData,
          [5000, 95000],
          [info.wallets[1].address, info.wallets[2].address],
          [nft1Data, nft2Data],
        );

      await expect(tx)
        .to.emit(info.foundry, "CreateToken")
        .withArgs(
          info.appId,
          tid,
          tData,
          [2 * i - 1, 2 * i],
          [5000, 95000],
          [info.wallets[1].address, info.wallets[2].address],
          [nft1Data, nft2Data],
          newAppOperatorWallet.address,
        );

      expect(await info.foundry.tokenData(info.appId, tid)).eq(tData);
      expect(await info.foundry.tokenExist(info.appId, tid)).eq(true);

      expect(await info.publicNFTKol.ownerOf(2 * i - 1)).eq(info.wallets[1].address);
      expect(await info.publicNFTKol.ownerOf(2 * i)).eq(info.wallets[2].address);

      let info1 = await info.publicNFTKol.tokenIdToInfo(2 * i - 1);
      let info2 = await info.publicNFTKol.tokenIdToInfo(2 * i);

      expect(info1.tid).eq(tid);
      expect(info2.tid).eq(tid);
      expect(info1.percent).eq(5000);
      expect(info2.percent).eq(95000);
      expect(info1.data).eq(nft1Data);
      expect(info2.data).eq(nft2Data);
      expect(info1._owner).eq(info.wallets[1].address);
      expect(info2._owner).eq(info.wallets[2].address);

      expect(await info.publicNFTKol.totalSupply()).eq(2 * i);

      tokenIds = await info.publicNFTKol.tidToTokenIds(tid);
      expect(tokenIds.length).eq(2);

      expect(tokenIds[0]).eq(2 * i - 1);
      expect(tokenIds[1]).eq(2 * i);

      infos = await info.publicNFTKol.tidToInfos(tid);
      expect(infos.tokenIds.length).eq(2);
      expect(infos.percents.length).eq(2);
      expect(infos.data.length).eq(2);
      expect(infos.owners.length).eq(2);

      expect(infos.tokenIds[0]).eq(2 * i - 1);
      expect(infos.tokenIds[1]).eq(2 * i);

      expect(infos.percents[0]).eq(5000);
      expect(infos.percents[1]).eq(95000);

      expect(infos.data[0]).eq(nft1Data);
      expect(infos.data[1]).eq(nft2Data);

      expect(infos.owners[0]).eq(info.wallets[1].address);
      expect(infos.owners[1]).eq(info.wallets[2].address);
    }
  });
});
