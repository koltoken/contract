import { ZERO_ADDRESS, deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseTokenURI } from "./shared/utils";
import { ethers } from "hardhat";
import { PublicNFT } from "../typechain-types";

describe("PublicNFT", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.publicNFTKol.appId()).eq(info.appId);
    expect(await info.publicNFTKol.foundry()).eq(await info.foundry.getAddress());
    expect(await info.publicNFTKol.publicNFTView()).eq(ZERO_ADDRESS);
  });

  it("default owner", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let defaultOwmer = (await info.foundry.apps(info.appId)).owner
    expect(info.kolOwnerWallet.address).eq(defaultOwmer)

    expect(await info.publicNFTKol.owner()).eq(defaultOwmer);

    await info.publicNFTKol.connect(info.kolOwnerWallet).transferOwnership(info.userWallet.address)
    expect(await info.publicNFTKol.owner()).eq(info.userWallet.address);
    expect(await info.publicNFTKol.owner()).not.eq(defaultOwmer);
    await info.publicNFTKol.connect(info.userWallet).transferOwnership(info.kolOwnerWallet.address)
  });

  it("name symbol tokenURI setPublicNFTView", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "t1",
        tTwitterName: "a",
        cid: "b",
        cTwitterName: "b",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
      multiplyAmount: 100,
    };
    let signatureC = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );
    let result = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signatureC, params.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });

    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signatureC, params.multiplyAmount, 0, { value: result });

    expect(await info.publicNFTKol.name()).eq("kol Tax");
    expect(await info.publicNFTKol.symbol()).eq("kol Tax");

    const tokenInfo = parseTokenURI(await info.publicNFTKol.tokenURI(1));

    expect(tokenInfo.name).eq("kol Tax 1");
    expect(tokenInfo.description).eq(
      "If you need to customize the display content, please use the setPublicNFTView function in the contract to set a custom display contract.",
    );
    expect(tokenInfo.image).eq("");

    await expect(info.publicNFTKol.setPublicNFTView(info.kolPublicNFTView)).revertedWith("Ownable: caller is not the owner");
    await info.publicNFTKol.connect(info.kolOwnerWallet).setPublicNFTView(info.kolPublicNFTView);

    expect(await info.publicNFTKol.name()).eq("cNFT of KoL Token");
    expect(await info.publicNFTKol.symbol()).eq("CNFT_KT");
    expect(await info.publicNFTKol.publicNFTView()).eq(await info.kolPublicNFTView.getAddress());

    const tokenInfo2 = parseTokenURI(await info.publicNFTKol.tokenURI(1));
    expect(tokenInfo2.name).eq("@a - cNFT");
    expect(tokenInfo2.description).eq(
      "This NFT entitles the holder the right to perpetually collect 5% trading fees from @a’s KT trades on the KoL Token platform.",
    );
    expect(tokenInfo2.image).not.eq("");

    const tokenInfo3 = parseTokenURI(await info.publicNFTKol.tokenURI(2));
    expect(tokenInfo3.name).eq("@a - oNFT");
    expect(tokenInfo3.description).eq(
      "This NFT entitles the holder the right to perpetually collect 95% trading fees from @a’s KT trades on the KoL Token platform.",
    );
    expect(tokenInfo3.image).not.eq("");
  });

  it("tidToInfos tidToTokenIds tokenIdToInfo", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];
    let nftOwner3 = info.wallets[info.nextWalletIndex + 2];
    let nftOwner4 = info.wallets[info.nextWalletIndex + 3];
    let newAppOperatorWallet = info.wallets[info.nextWalletIndex + 4];
    let nftOwner11 = info.wallets[info.nextWalletIndex + 5];
    let nftOwner44 = info.wallets[info.nextWalletIndex + 6];

    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex + 7];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 8];

    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await info.kolCurve.getAddress(),
      ZERO_ADDRESS,
      info.buySellFee,
    );

    let appId_2 = info.appId + 1;
    let publicNFTKol = (await ethers.getContractAt("PublicNFT", (await info.foundry.apps(appId_2)).publicNFT)) as PublicNFT;


    let params = {
      tid: "t1",
      tData: "0x11",
      nftPercents: [5000, 95000],
      nftOwers: [nftOwner1.address, nftOwner2.address],
      nftData: ["0x22", "0x33"],
    };
    await info.foundry
      .connect(app2OperatorWallet)
      .createToken(appId_2, params.tid, params.tData, params.nftPercents, params.nftOwers, params.nftData);

    let params2 = {
      tid: "t2",
      tData: "0x44",
      nftPercents: [4000, 96000],
      nftOwers: [nftOwner3.address, nftOwner4.address],
      nftData: ["0x55", "0x66"],
    };
    await info.foundry
      .connect(app2OperatorWallet)
      .createToken(appId_2, params2.tid, params2.tData, params2.nftPercents, params2.nftOwers, params2.nftData);

    // tokenIdToInfo
    let info1 = await publicNFTKol.tokenIdToInfo(1);
    let info2 = await publicNFTKol.tokenIdToInfo(2);
    let info3 = await publicNFTKol.tokenIdToInfo(3);
    let info4 = await publicNFTKol.tokenIdToInfo(4);

    expect(info1.tid).eq(params.tid);
    expect(info1.percent).eq(params.nftPercents[0]);
    expect(info1.data).eq(params.nftData[0]);
    expect(info1._owner).eq(nftOwner1.address);

    expect(info2.tid).eq(params.tid);
    expect(info2.percent).eq(params.nftPercents[1]);
    expect(info2.data).eq(params.nftData[1]);
    expect(info2._owner).eq(nftOwner2.address);

    expect(info3.tid).eq(params2.tid);
    expect(info3.percent).eq(params2.nftPercents[0]);
    expect(info3.data).eq(params2.nftData[0]);
    expect(info3._owner).eq(nftOwner3.address);

    expect(info4.tid).eq(params2.tid);
    expect(info4.percent).eq(params2.nftPercents[1]);
    expect(info4.data).eq(params2.nftData[1]);
    expect(info4._owner).eq(nftOwner4.address);

    // tidToTokenIds
    let tidToTokenIds1 = await publicNFTKol.tidToTokenIds(params.tid);
    let tidToTokenIds2 = await publicNFTKol.tidToTokenIds(params2.tid);

    expect(tidToTokenIds1.length).eq(2);
    expect(tidToTokenIds1[0]).eq(1);
    expect(tidToTokenIds1[1]).eq(2);

    expect(tidToTokenIds2.length).eq(2);
    expect(tidToTokenIds2[0]).eq(3);
    expect(tidToTokenIds2[1]).eq(4);

    // tidToInfos
    let tidToInfos1 = await publicNFTKol.tidToInfos(params.tid);
    let tidToInfos2 = await publicNFTKol.tidToInfos(params2.tid);

    expect(tidToInfos1.tokenIds.length).eq(2);
    expect(tidToInfos1.tokenIds[0]).eq(1);
    expect(tidToInfos1.tokenIds[1]).eq(2);

    expect(tidToInfos1.percents.length).eq(2);
    expect(tidToInfos1.percents[0]).eq(params.nftPercents[0]);
    expect(tidToInfos1.percents[1]).eq(params.nftPercents[1]);

    expect(tidToInfos1.data.length).eq(2);
    expect(tidToInfos1.data[0]).eq(params.nftData[0]);
    expect(tidToInfos1.data[1]).eq(params.nftData[1]);

    expect(tidToInfos1.owners.length).eq(2);
    expect(tidToInfos1.owners[0]).eq(nftOwner1.address);
    expect(tidToInfos1.owners[1]).eq(nftOwner2.address);

    expect(tidToInfos2.tokenIds.length).eq(2);
    expect(tidToInfos2.tokenIds[0]).eq(3);
    expect(tidToInfos2.tokenIds[1]).eq(4);

    expect(tidToInfos2.percents.length).eq(2);
    expect(tidToInfos2.percents[0]).eq(params2.nftPercents[0]);
    expect(tidToInfos2.percents[1]).eq(params2.nftPercents[1]);

    expect(tidToInfos2.data.length).eq(2);
    expect(tidToInfos2.data[0]).eq(params2.nftData[0]);
    expect(tidToInfos2.data[1]).eq(params2.nftData[1]);

    expect(tidToInfos2.owners.length).eq(2);
    expect(tidToInfos2.owners[0]).eq(nftOwner3.address);
    expect(tidToInfos2.owners[1]).eq(nftOwner4.address);

    await publicNFTKol.connect(nftOwner1).transferFrom(nftOwner1.address, nftOwner11.address, 1);
    await publicNFTKol.connect(nftOwner4).transferFrom(nftOwner4.address, nftOwner44.address, 4);

    expect(await publicNFTKol.ownerOf(1)).eq(nftOwner11.address);
    expect(await publicNFTKol.ownerOf(4)).eq(nftOwner44.address);

    // tokenIdToInfo
    info1 = await publicNFTKol.tokenIdToInfo(1);
    info2 = await publicNFTKol.tokenIdToInfo(2);
    info3 = await publicNFTKol.tokenIdToInfo(3);
    info4 = await publicNFTKol.tokenIdToInfo(4);

    expect(info1.tid).eq(params.tid);
    expect(info1.percent).eq(params.nftPercents[0]);
    expect(info1.data).eq(params.nftData[0]);
    expect(info1._owner).eq(nftOwner11.address);

    expect(info2.tid).eq(params.tid);
    expect(info2.percent).eq(params.nftPercents[1]);
    expect(info2.data).eq(params.nftData[1]);
    expect(info2._owner).eq(nftOwner2.address);

    expect(info3.tid).eq(params2.tid);
    expect(info3.percent).eq(params2.nftPercents[0]);
    expect(info3.data).eq(params2.nftData[0]);
    expect(info3._owner).eq(nftOwner3.address);

    expect(info4.tid).eq(params2.tid);
    expect(info4.percent).eq(params2.nftPercents[1]);
    expect(info4.data).eq(params2.nftData[1]);
    expect(info4._owner).eq(nftOwner44.address);

    // tidToTokenIds
    tidToTokenIds1 = await publicNFTKol.tidToTokenIds(params.tid);
    tidToTokenIds2 = await publicNFTKol.tidToTokenIds(params2.tid);

    expect(tidToTokenIds1.length).eq(2);
    expect(tidToTokenIds1[0]).eq(1);
    expect(tidToTokenIds1[1]).eq(2);

    expect(tidToTokenIds2.length).eq(2);
    expect(tidToTokenIds2[0]).eq(3);
    expect(tidToTokenIds2[1]).eq(4);

    // tidToInfos
    tidToInfos1 = await publicNFTKol.tidToInfos(params.tid);
    tidToInfos2 = await publicNFTKol.tidToInfos(params2.tid);

    expect(tidToInfos1.tokenIds.length).eq(2);
    expect(tidToInfos1.tokenIds[0]).eq(1);
    expect(tidToInfos1.tokenIds[1]).eq(2);

    expect(tidToInfos1.percents.length).eq(2);
    expect(tidToInfos1.percents[0]).eq(params.nftPercents[0]);
    expect(tidToInfos1.percents[1]).eq(params.nftPercents[1]);

    expect(tidToInfos1.data.length).eq(2);
    expect(tidToInfos1.data[0]).eq(params.nftData[0]);
    expect(tidToInfos1.data[1]).eq(params.nftData[1]);

    expect(tidToInfos1.owners.length).eq(2);
    expect(tidToInfos1.owners[0]).eq(nftOwner11.address);
    expect(tidToInfos1.owners[1]).eq(nftOwner2.address);

    expect(tidToInfos2.tokenIds.length).eq(2);
    expect(tidToInfos2.tokenIds[0]).eq(3);
    expect(tidToInfos2.tokenIds[1]).eq(4);

    expect(tidToInfos2.percents.length).eq(2);
    expect(tidToInfos2.percents[0]).eq(params2.nftPercents[0]);
    expect(tidToInfos2.percents[1]).eq(params2.nftPercents[1]);

    expect(tidToInfos2.data.length).eq(2);
    expect(tidToInfos2.data[0]).eq(params2.nftData[0]);
    expect(tidToInfos2.data[1]).eq(params2.nftData[1]);

    expect(tidToInfos2.owners.length).eq(2);
    expect(tidToInfos2.owners[0]).eq(nftOwner3.address);
    expect(tidToInfos2.owners[1]).eq(nftOwner44.address);

    // tokenIdToInfo empty
    await expect(info.publicNFTKol.tokenIdToInfo(5)).revertedWith("ERC721: invalid token ID");

    // tidToTokenIds empty
    let tidToTokenIds3 = await publicNFTKol.tidToTokenIds("t3");
    expect(tidToTokenIds3.length).eq(0);

    // tidToInfos empty
    let tidToInfos3 = await publicNFTKol.tidToInfos("t3");

    expect(tidToInfos3.tokenIds.length).eq(0);
    expect(tidToInfos3.percents.length).eq(0);
    expect(tidToInfos3.data.length).eq(0);
    expect(tidToInfos3.owners.length).eq(0);
  });

  it("mint", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];

    await expect(info.publicNFTKol.mint("t1", [5000, 95000], [nftOwner1, nftOwner2], ["0x", "0x"])).revertedWith(
      "onlyFoundry",
    );
  });

  it("transferFrom zero_address", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];
    let nftOwner11 = info.wallets[info.nextWalletIndex + 2];
    let nftOwner22 = info.wallets[info.nextWalletIndex + 3];

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "t1",
        tTwitterName: "a",
        cid: "b",
        cTwitterName: "b",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
      multiplyAmount: 100,
    };
    let signatureC = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );
    let result = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signatureC, params.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });

    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signatureC, params.multiplyAmount, 0, { value: result });

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);

    await expect(
      info.publicNFTKol.connect(info.userWallet).transferFrom(info.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWith("ERC721: transfer to the zero address");

    await expect(
      info.publicNFTKol
        .connect(info.userWallet)
      ["safeTransferFrom(address,address,uint256)"](info.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWith("ERC721: transfer to the zero address");

    await expect(
      info.publicNFTKol
        .connect(info.userWallet)
      ["safeTransferFrom(address,address,uint256,bytes)"](info.userWallet.address, ZERO_ADDRESS, 1, "0x"),
    ).revertedWith("ERC721: transfer to the zero address");

    await info.publicNFTKol.connect(info.userWallet).transferFrom(info.userWallet.address, nftOwner11.address, 1);
    expect(await info.publicNFTKol.ownerOf(1)).eq(nftOwner11.address);

    await info.publicNFTKol
      .connect(nftOwner11)
    ["safeTransferFrom(address,address,uint256)"](nftOwner11.address, nftOwner22.address, 1);
    expect(await info.publicNFTKol.ownerOf(1)).eq(nftOwner22.address);

    await info.publicNFTKol
      .connect(nftOwner22)
    ["safeTransferFrom(address,address,uint256,bytes)"](nftOwner22.address, info.userWallet.address, 1, "0x");
    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
  });
});
