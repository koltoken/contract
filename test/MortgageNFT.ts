import { ZERO_ADDRESS, deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei, parseTokenURI } from "./shared/utils";
import { ethers } from "hardhat";

describe("MortgageNFT", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.mortgageNFTKol.appId()).eq(info.appId);
    expect(await info.mortgageNFTKol.foundry()).eq(await info.foundry.getAddress());
    expect(await info.mortgageNFTKol.market()).eq(await info.marketKol.getAddress());
    expect(await info.mortgageNFTKol.mortgageNFTView()).eq(ZERO_ADDRESS);
  });

  it("default owner", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let defaultOwmer = (await info.foundry.apps(info.appId)).owner
    expect(info.kolOwnerWallet.address).eq(defaultOwmer)

    expect(await info.mortgageNFTKol.owner()).eq(defaultOwmer);

    await info.mortgageNFTKol.connect(info.kolOwnerWallet).transferOwnership(info.userWallet.address)
    expect(await info.mortgageNFTKol.owner()).eq(info.userWallet.address);
    expect(await info.mortgageNFTKol.owner()).not.eq(defaultOwmer);
    await info.mortgageNFTKol.connect(info.userWallet).transferOwnership(info.kolOwnerWallet.address)
  });

  it("name symbol tokenURI setMortgageNFTView", async function () {
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
      multiplyAmount: getTokenAmountWei(100),
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

    expect(await info.mortgageNFTKol.name()).eq("kol Position");
    expect(await info.mortgageNFTKol.symbol()).eq("kol Position");

    const tokenInfo = parseTokenURI(await info.mortgageNFTKol.tokenURI(1));

    expect(tokenInfo.name).eq("kol Position 1");
    expect(tokenInfo.description).eq(
      "If you need to customize the display content, please use the setMortgageNFTView function in the contract to set a custom display contract.",
    );
    expect(tokenInfo.image).eq("");

    await expect(info.mortgageNFTKol.setMortgageNFTView(info.kolMortgageNFTView)).revertedWith("Ownable: caller is not the owner");
    await info.mortgageNFTKol.connect(info.kolOwnerWallet).setMortgageNFTView(info.kolMortgageNFTView);

    expect(await info.mortgageNFTKol.name()).eq("KoL Position");
    expect(await info.mortgageNFTKol.symbol()).eq("KOLP");
    expect(await info.mortgageNFTKol.mortgageNFTView()).eq(await info.kolMortgageNFTView.getAddress());

    const tokenInfo2 = parseTokenURI(await info.mortgageNFTKol.tokenURI(1));

    expect(tokenInfo2.name).eq("@a - #1 - 100");
    expect(tokenInfo2.description).eq(
      "This NFT represents a collateral position within the KoL Token system.\n⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure that the NFT image matches the number of KT in the collateral position. As NFT trading platforms cache images, it's advised to refresh the cached image for the latest data before purchasing the NFT.",
    );
    expect(tokenInfo2.image).not.eq("");
  });

  it("info tokenInfosOfOwner tokenInfosOfOwnerByTid", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];
    let user1Wallet = info.wallets[info.nextWalletIndex + 2];
    let bigNumber = BigInt(10) ** BigInt(20) * BigInt(8);

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
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let signature = await info.signatureWallet.signMessage(
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
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });

    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, { value: result });

    let params2 = {
      info: {
        tid: "t2",
        tTwitterName: "c",
        cid: "d",
        cTwitterName: "d",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(200),
    };
    let signature2 = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params2.info, params2.nftPrice, params2.deadline, info.userWallet.address],
          ),
        ),
      ),
    );
    let result2 = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(params2.info, params2.nftPrice, params2.deadline, signature2, params2.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });

    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params2.info, params2.nftPrice, params2.deadline, signature2, params2.multiplyAmount, 0, { value: result2 });

    // multiply user1 t1 11
    let multiply_u1_t1_11 = await info.marketKol
      .connect(user1Wallet)
      .multiply.staticCall(params.info.tid, BigInt(10) ** BigInt(18) * BigInt(11), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .multiply(params.info.tid, BigInt(10) ** BigInt(18) * BigInt(11), { value: multiply_u1_t1_11.payTokenAmount });

    // multiply user1 t2 22
    let multiply_u2_t2_22 = await info.marketKol
      .connect(user1Wallet)
      .multiply.staticCall(params2.info.tid, BigInt(10) ** BigInt(18) * BigInt(22), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .multiply(params2.info.tid, BigInt(10) ** BigInt(18) * BigInt(22), { value: multiply_u2_t2_22.payTokenAmount });

    let info1 = await info.mortgageNFTKol.info(1);
    let info2 = await info.mortgageNFTKol.info(2);
    let info3 = await info.mortgageNFTKol.info(3);
    let info4 = await info.mortgageNFTKol.info(4);
    expect(info1.tid).eq(params.info.tid);
    expect(info1.amount).eq(params.multiplyAmount);

    expect(info2.tid).eq(params2.info.tid);
    expect(info2.amount).eq(params2.multiplyAmount);

    expect(info3.tid).eq(params.info.tid);
    expect(info3.amount).eq(BigInt(10) ** BigInt(18) * BigInt(11));

    expect(info4.tid).eq(params2.info.tid);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22));

    let infos = await info.mortgageNFTKol.tokenInfosOfOwner(info.userWallet.address);
    expect(infos.length).eq(2);
    expect(infos[0].tid).eq(info1.tid);
    expect(infos[1].tid).eq(info2.tid);
    expect(infos[0].amount).eq(info1.amount);
    expect(infos[1].amount).eq(info2.amount);

    let infos1 = await info.mortgageNFTKol.tokenInfosOfOwner(user1Wallet.address);
    expect(infos1.length).eq(2);
    expect(infos1[0].tid).eq(info3.tid);
    expect(infos1[1].tid).eq(info4.tid);
    expect(infos1[0].amount).eq(info3.amount);
    expect(infos1[1].amount).eq(info4.amount);

    let infosBy1 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(info.userWallet.address, params.info.tid);
    expect(infosBy1.length).eq(1);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[0].amount).eq(info1.amount);

    let infosBy2 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(info.userWallet.address, params2.info.tid);
    expect(infosBy2.length).eq(1);
    expect(infosBy2[0].tid).eq(info2.tid);
    expect(infosBy2[0].amount).eq(info2.amount);

    let infos1By1 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(user1Wallet.address, params.info.tid);
    expect(infos1By1.length).eq(1);
    expect(infos1By1[0].tid).eq(info3.tid);
    expect(infos1By1[0].amount).eq(info3.amount);

    let infos1By2 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(user1Wallet.address, params2.info.tid);
    expect(infos1By2.length).eq(1);
    expect(infos1By2[0].tid).eq(info4.tid);
    expect(infos1By2[0].amount).eq(info4.amount);

    // redeem 1 10
    let redeemdEth = await info.marketKol
      .connect(info.userWallet)
      .redeem.staticCall(1, BigInt(10) ** BigInt(18) * BigInt(10), { value: bigNumber });
    await info.marketKol
      .connect(info.userWallet)
      .redeem(1, BigInt(10) ** BigInt(18) * BigInt(10), { value: redeemdEth });

    // redeem 2 20
    redeemdEth = await info.marketKol
      .connect(info.userWallet)
      .redeem.staticCall(2, BigInt(10) ** BigInt(18) * BigInt(20), { value: bigNumber });
    await info.marketKol
      .connect(info.userWallet)
      .redeem(2, BigInt(10) ** BigInt(18) * BigInt(20), { value: redeemdEth });

    // multiplyAdd 3 10
    let multiplyAdd = await info.marketKol
      .connect(user1Wallet)
      .multiplyAdd.staticCall(3, BigInt(10) ** BigInt(18) * BigInt(10), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .multiplyAdd(3, BigInt(10) ** BigInt(18) * BigInt(10), { value: multiplyAdd });

    // multiplyAdd 4 20
    multiplyAdd = await info.marketKol
      .connect(user1Wallet)
      .multiplyAdd.staticCall(4, BigInt(10) ** BigInt(18) * BigInt(20), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .multiplyAdd(4, BigInt(10) ** BigInt(18) * BigInt(20), { value: multiplyAdd });

    // multiply user 5 t1 20
    let multiply_u_t1_20 = await info.marketKol
      .connect(info.userWallet)
      .multiply.staticCall(params.info.tid, BigInt(10) ** BigInt(18) * BigInt(20), { value: bigNumber });
    await info.marketKol
      .connect(info.userWallet)
      .multiply(params.info.tid, BigInt(10) ** BigInt(18) * BigInt(20), { value: multiply_u_t1_20.payTokenAmount });

    // multiply user1 6 t2 30
    let multiply_u1_t2_30 = await info.marketKol
      .connect(user1Wallet)
      .multiply.staticCall(params2.info.tid, BigInt(10) ** BigInt(18) * BigInt(30), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .multiply(params2.info.tid, BigInt(10) ** BigInt(18) * BigInt(30), { value: multiply_u1_t2_30.payTokenAmount });

    // multiply user 7 t2 30
    let multiply_u_t2_30 = await info.marketKol
      .connect(info.userWallet)
      .multiply.staticCall(params2.info.tid, BigInt(10) ** BigInt(18) * BigInt(30), { value: bigNumber });
    await info.marketKol
      .connect(info.userWallet)
      .multiply(params2.info.tid, BigInt(10) ** BigInt(18) * BigInt(30), { value: multiply_u_t2_30.payTokenAmount });

    // multiply user1 8 t1 20
    let multiply_u1_t1_20 = await info.marketKol
      .connect(user1Wallet)
      .multiply.staticCall(params.info.tid, BigInt(10) ** BigInt(18) * BigInt(20), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .multiply(params.info.tid, BigInt(10) ** BigInt(18) * BigInt(20), { value: multiply_u1_t1_20.payTokenAmount });

    // multiply user 9 t1 40
    let multiply_u_t1_40 = await info.marketKol
      .connect(info.userWallet)
      .multiply.staticCall(params.info.tid, BigInt(10) ** BigInt(18) * BigInt(40), { value: bigNumber });
    await info.marketKol
      .connect(info.userWallet)
      .multiply(params.info.tid, BigInt(10) ** BigInt(18) * BigInt(40), { value: multiply_u_t1_40.payTokenAmount });

    // multiply user1 10 t2 50
    let multiply_u1_t2_50 = await info.marketKol
      .connect(user1Wallet)
      .multiply.staticCall(params2.info.tid, BigInt(10) ** BigInt(18) * BigInt(50), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .multiply(params2.info.tid, BigInt(10) ** BigInt(18) * BigInt(50), { value: multiply_u1_t2_50.payTokenAmount });

    /**
     * 1 user  t1
     * 2 user  t2
     * 3 user1 t1
     * 4 user1 t2
     * 5 user  t1
     * 6 user1 t2
     * 7 user  t2
     * 8 user1 t1
     * 9 user  t1
     * 10 user1 t2
     */
    info1 = await info.mortgageNFTKol.info(1);
    info2 = await info.mortgageNFTKol.info(2);
    info3 = await info.mortgageNFTKol.info(3);
    info4 = await info.mortgageNFTKol.info(4);
    let info5 = await info.mortgageNFTKol.info(5);
    let info6 = await info.mortgageNFTKol.info(6);
    let info7 = await info.mortgageNFTKol.info(7);
    let info8 = await info.mortgageNFTKol.info(8);
    let info9 = await info.mortgageNFTKol.info(9);
    let info10 = await info.mortgageNFTKol.info(10);

    expect(info1.tid).eq(params.info.tid);
    expect(info1.amount).eq(params.multiplyAmount - BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info2.tid).eq(params2.info.tid);
    expect(info2.amount).eq(params2.multiplyAmount - BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info3.tid).eq(params.info.tid);
    expect(info3.amount).eq(BigInt(10) ** BigInt(18) * BigInt(11) + BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info4.tid).eq(params2.info.tid);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22) + BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info5.tid).eq(params.info.tid);
    expect(info5.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info6.tid).eq(params2.info.tid);
    expect(info6.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info7.tid).eq(params2.info.tid);
    expect(info7.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info8.tid).eq(params.info.tid);
    expect(info8.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info9.tid).eq(params.info.tid);
    expect(info9.amount).eq(BigInt(10) ** BigInt(18) * BigInt(40));

    expect(info10.tid).eq(params2.info.tid);
    expect(info10.amount).eq(BigInt(10) ** BigInt(18) * BigInt(50));

    infos = await info.mortgageNFTKol.tokenInfosOfOwner(info.userWallet.address);
    expect(infos.length).eq(5);
    expect(infos[0].tid).eq(info1.tid);
    expect(infos[1].tid).eq(info2.tid);
    expect(infos[2].tid).eq(info5.tid);
    expect(infos[3].tid).eq(info7.tid);
    expect(infos[4].tid).eq(info9.tid);

    expect(infos[0].amount).eq(info1.amount);
    expect(infos[1].amount).eq(info2.amount);
    expect(infos[2].amount).eq(info5.amount);
    expect(infos[3].amount).eq(info7.amount);
    expect(infos[4].amount).eq(info9.amount);

    infos1 = await info.mortgageNFTKol.tokenInfosOfOwner(user1Wallet.address);
    expect(infos1.length).eq(5);
    expect(infos1[0].tid).eq(info3.tid);
    expect(infos1[1].tid).eq(info4.tid);
    expect(infos1[2].tid).eq(info6.tid);
    expect(infos1[3].tid).eq(info8.tid);
    expect(infos1[4].tid).eq(info10.tid);

    expect(infos1[0].amount).eq(info3.amount);
    expect(infos1[1].amount).eq(info4.amount);
    expect(infos1[2].amount).eq(info6.amount);
    expect(infos1[3].amount).eq(info8.amount);
    expect(infos1[4].amount).eq(info10.amount);

    infosBy1 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(info.userWallet.address, params.info.tid);
    expect(infosBy1.length).eq(3);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[1].tid).eq(info5.tid);
    expect(infosBy1[2].tid).eq(info9.tid);

    expect(infosBy1[0].amount).eq(info1.amount);
    expect(infosBy1[1].amount).eq(info5.amount);
    expect(infosBy1[2].amount).eq(info9.amount);

    infosBy2 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(info.userWallet.address, params2.info.tid);
    expect(infosBy2.length).eq(2);
    expect(infosBy2[0].tid).eq(info2.tid);
    expect(infosBy2[1].tid).eq(info7.tid);

    expect(infosBy2[0].amount).eq(info2.amount);
    expect(infosBy2[1].amount).eq(info7.amount);

    infos1By1 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(user1Wallet.address, params.info.tid);
    expect(infos1By1.length).eq(2);
    expect(infos1By1[0].tid).eq(info3.tid);
    expect(infos1By1[1].tid).eq(info8.tid);

    expect(infos1By1[0].amount).eq(info3.amount);
    expect(infos1By1[1].amount).eq(info8.amount);

    infos1By2 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(user1Wallet.address, params2.info.tid);
    expect(infos1By2.length).eq(3);
    expect(infos1By2[0].tid).eq(info4.tid);
    expect(infos1By2[1].tid).eq(info6.tid);
    expect(infos1By2[2].tid).eq(info10.tid);

    expect(infos1By2[0].amount).eq(info4.amount);
    expect(infos1By2[1].amount).eq(info6.amount);
    expect(infos1By2[2].amount).eq(info10.amount);

    // user redeem 2
    redeemdEth = await info.marketKol.connect(info.userWallet).redeem.staticCall(2, info2.amount, { value: bigNumber });
    await info.marketKol.connect(info.userWallet).redeem(2, info2.amount, { value: redeemdEth });

    // user1 redeem 3
    redeemdEth = await info.marketKol.connect(user1Wallet).redeem.staticCall(3, info3.amount, { value: bigNumber });
    await info.marketKol.connect(user1Wallet).redeem(3, info3.amount, { value: redeemdEth });

    // user  redeem 5
    redeemdEth = await info.marketKol.connect(info.userWallet).redeem.staticCall(5, info5.amount, { value: bigNumber });
    await info.marketKol.connect(info.userWallet).redeem(5, info5.amount, { value: redeemdEth });

    // user1 redeem 6
    redeemdEth = await info.marketKol.connect(user1Wallet).redeem.staticCall(6, info6.amount, { value: bigNumber });
    await info.marketKol.connect(user1Wallet).redeem(6, info6.amount, { value: redeemdEth });

    /**
     * 1 user  t1
     * 2 null
     * 3 null
     * 4 user1 t2
     * 5 null
     * 6 null
     * 7 user  t2
     * 8 user1 t1
     * 9 user  t1
     * 10 user1 t2
     */
    info1 = await info.mortgageNFTKol.info(1);
    info2 = await info.mortgageNFTKol.info(2);
    info3 = await info.mortgageNFTKol.info(3);
    info4 = await info.mortgageNFTKol.info(4);
    info5 = await info.mortgageNFTKol.info(5);
    info6 = await info.mortgageNFTKol.info(6);
    info7 = await info.mortgageNFTKol.info(7);
    info8 = await info.mortgageNFTKol.info(8);
    info9 = await info.mortgageNFTKol.info(9);
    info10 = await info.mortgageNFTKol.info(10);

    expect(info1.tid).eq(params.info.tid);
    expect(info1.amount).eq(params.multiplyAmount - BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info2.tid).eq("");
    expect(info2.amount).eq(0);

    expect(info3.tid).eq("");
    expect(info3.amount).eq(0);

    expect(info4.tid).eq(params2.info.tid);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22) + BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info5.tid).eq("");
    expect(info5.amount).eq(0);

    expect(info6.tid).eq("");
    expect(info6.amount).eq(0);

    expect(info7.tid).eq(params2.info.tid);
    expect(info7.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info8.tid).eq(params.info.tid);
    expect(info8.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info9.tid).eq(params.info.tid);
    expect(info9.amount).eq(BigInt(10) ** BigInt(18) * BigInt(40));

    expect(info10.tid).eq(params2.info.tid);
    expect(info10.amount).eq(BigInt(10) ** BigInt(18) * BigInt(50));

    infos = await info.mortgageNFTKol.tokenInfosOfOwner(info.userWallet.address);
    expect(infos.length).eq(3);
    expect(infos[0].tid).eq(info1.tid);
    expect(infos[1].tid).eq(info9.tid);
    expect(infos[2].tid).eq(info7.tid);

    expect(infos[0].amount).eq(info1.amount);
    expect(infos[1].amount).eq(info9.amount);
    expect(infos[2].amount).eq(info7.amount);

    infos1 = await info.mortgageNFTKol.tokenInfosOfOwner(user1Wallet.address);
    expect(infos1.length).eq(3);

    expect(infos1[0].tid).eq(info10.tid);
    expect(infos1[1].tid).eq(info4.tid);
    expect(infos1[2].tid).eq(info8.tid);

    expect(infos1[0].amount).eq(info10.amount);
    expect(infos1[1].amount).eq(info4.amount);
    expect(infos1[2].amount).eq(info8.amount);

    infosBy1 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(info.userWallet.address, params.info.tid);
    expect(infosBy1.length).eq(2);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[1].tid).eq(info9.tid);

    expect(infosBy1[0].amount).eq(info1.amount);
    expect(infosBy1[1].amount).eq(info9.amount);

    infosBy2 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(info.userWallet.address, params2.info.tid);
    expect(infosBy2.length).eq(1);
    expect(infosBy2[0].tid).eq(info7.tid);
    expect(infosBy2[0].amount).eq(info7.amount);

    infos1By1 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(user1Wallet.address, params.info.tid);
    expect(infos1By1.length).eq(1);

    expect(infos1By1[0].tid).eq(info8.tid);
    expect(infos1By1[0].amount).eq(info8.amount);

    infos1By2 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(user1Wallet.address, params2.info.tid);
    expect(infos1By2.length).eq(2);

    expect(infos1By2[0].tid).eq(info10.tid);
    expect(infos1By2[1].tid).eq(info4.tid);

    expect(infos1By2[0].amount).eq(info10.amount);
    expect(infos1By2[1].amount).eq(info4.amount);

    // empty
    expect((await info.mortgageNFTKol.info(20)).amount).eq(0);
    expect((await info.mortgageNFTKol.info(20)).tid).eq("");

    let infosEmpty = await info.mortgageNFTKol.tokenInfosOfOwner(nftOwner1.address);
    expect(infosEmpty.length).eq(0);

    let infosByTidEmtpy1 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(info.userWallet.address, "t3");
    expect(infosByTidEmtpy1.length).eq(0);

    let infos1ByTidEmtpy2 = await info.mortgageNFTKol.tokenInfosOfOwnerByTid(nftOwner1.address, params.info.tid);
    expect(infos1ByTidEmtpy2.length).eq(0);
  });

  it("isApprovedOrOwner", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];
    let user1Wallet = info.wallets[info.nextWalletIndex + 2];

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

    expect(await info.mortgageNFTKol.ownerOf(1)).eq(info.userWallet.address);

    expect(await info.mortgageNFTKol.getApproved(1)).eq(ZERO_ADDRESS);
    expect(await info.mortgageNFTKol.isApprovedForAll(info.userWallet.address, info.deployWallet.address)).eq(false);
    expect(await info.mortgageNFTKol.isApprovedForAll(user1Wallet.address, info.deployWallet.address)).eq(false);

    expect(await info.mortgageNFTKol.isApprovedOrOwner(info.userWallet.address, 1)).eq(true);
    expect(await info.mortgageNFTKol.isApprovedOrOwner(info.deployWallet.address, 1)).eq(false);
    expect(await info.mortgageNFTKol.isApprovedOrOwner(user1Wallet.address, 1)).eq(false);

    await info.mortgageNFTKol.connect(info.userWallet).approve(user1Wallet.address, 1);

    expect(await info.mortgageNFTKol.isApprovedOrOwner(info.userWallet.address, 1)).eq(true);
    expect(await info.mortgageNFTKol.isApprovedOrOwner(info.deployWallet.address, 1)).eq(false);
    expect(await info.mortgageNFTKol.isApprovedOrOwner(user1Wallet.address, 1)).eq(true);

    await info.mortgageNFTKol.connect(info.userWallet).setApprovalForAll(info.deployWallet.address, true);

    expect(await info.mortgageNFTKol.isApprovedOrOwner(info.userWallet.address, 1)).eq(true);
    expect(await info.mortgageNFTKol.isApprovedOrOwner(info.deployWallet.address, 1)).eq(true);
    expect(await info.mortgageNFTKol.isApprovedOrOwner(user1Wallet.address, 1)).eq(true);
  });

  it("initialize add burn mint remove", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    await expect(info.mortgageNFTKol.initialize(await info.marketKol.getAddress())).revertedWith("onlyFoundry");

    await expect(info.mortgageNFTKol.add(1, 1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFTKol.burn(1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFTKol.mint(info.deployWallet.address, "t1", 1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFTKol.remove(1, 1)).revertedWith("onlyMarket");
  });

  it("transferFrom zero_address", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];

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

    expect(await info.mortgageNFTKol.ownerOf(1)).eq(info.userWallet.address);

    await expect(
      info.mortgageNFTKol.connect(info.userWallet).transferFrom(info.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWith("ERC721: transfer to the zero address");

    await expect(
      info.mortgageNFTKol
        .connect(info.userWallet)
      ["safeTransferFrom(address,address,uint256)"](info.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWith("ERC721: transfer to the zero address");

    await expect(
      info.mortgageNFTKol
        .connect(info.userWallet)
      ["safeTransferFrom(address,address,uint256,bytes)"](info.userWallet.address, ZERO_ADDRESS, 1, "0x"),
    ).revertedWith("ERC721: transfer to the zero address");

    await info.mortgageNFTKol.connect(info.userWallet).transferFrom(info.userWallet.address, nftOwner1.address, 1);
    expect(await info.mortgageNFTKol.ownerOf(1)).eq(nftOwner1.address);

    await info.mortgageNFTKol
      .connect(nftOwner1)
    ["safeTransferFrom(address,address,uint256)"](nftOwner1.address, nftOwner2.address, 1);
    expect(await info.mortgageNFTKol.ownerOf(1)).eq(nftOwner2.address);

    await info.mortgageNFTKol
      .connect(nftOwner2)
    ["safeTransferFrom(address,address,uint256,bytes)"](nftOwner2.address, info.userWallet.address, 1, "0x");
    expect(await info.mortgageNFTKol.ownerOf(1)).eq(info.userWallet.address);
  });

  it("mint loop", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];

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

    await expect(info.publicNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");
    await expect(info.publicNFTKol.ownerOf(2)).revertedWith("ERC721: invalid token ID");

    await info.kol
      .connect(info.userWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signatureC, { value: params.nftPrice });

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(await info.kolNFTClaim.getAddress());

    await info.marketKol
      .connect(info.userWallet)
      .buy(params.info.tid, getTokenAmountWei(10000), { value: BigInt(10) ** BigInt(22) });

    for (let i = 1; i <= 100; i++) {
      expect(await info.mortgageNFTKol.totalSupply()).eq(i - 1);
      await expect(info.mortgageNFTKol.ownerOf(i)).revertedWith("ERC721: invalid token ID");

      let tInfo = await info.mortgageNFTKol.info(i);
      expect(tInfo.tid).eq("");
      expect(tInfo.amount).eq(0);

      let n = i % 3;

      let count = getTokenAmountWei(101 - i);

      if (n == 1) {
        await info.marketKol.connect(info.userWallet).mortgage(params.info.tid, count);
      } else if (n == 2) {
        await info.marketKol
          .connect(info.userWallet)
          .multiply(params.info.tid, count, { value: BigInt(10) ** BigInt(22) });
      } else if (n == 0) {
        await info.marketKol.connect(info.userWallet).split(i - 1, count, { value: BigInt(10) ** BigInt(22) });
      }

      expect(await info.mortgageNFTKol.totalSupply()).eq(i);
      expect(await info.mortgageNFTKol.ownerOf(i)).eq(info.userWallet.address);

      tInfo = await info.mortgageNFTKol.info(i);
      expect(tInfo.tid).eq(params.info.tid + "");
      expect(tInfo.amount).eq(count);
    }
  });
});
