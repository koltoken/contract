import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";

describe("Base.ERC20", function () {
  it("test", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.erc20;

    let nftOwnerA1 = info.wallets[info.nextWalletIndex];
    let nftOwnerA2 = info.wallets[info.nextWalletIndex + 1];
    let nftOwnerB1 = info.wallets[info.nextWalletIndex + 2];
    let nftOwnerB2 = info.wallets[info.nextWalletIndex + 3];
    let nftOwnerC1 = info.wallets[info.nextWalletIndex + 4];
    let nftOwnerC2 = info.wallets[info.nextWalletIndex + 5];
    let nftOwnerD1 = info.wallets[info.nextWalletIndex + 6];
    let nftOwnerD2 = info.wallets[info.nextWalletIndex + 7];
    let user1Wallet = info.wallets[info.nextWalletIndex + 8];
    let user2Wallet = info.wallets[info.nextWalletIndex + 9];
    let user3Wallet = info.wallets[info.nextWalletIndex + 10];

    let nftDataTrue = ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint256", "bool"], ["xxx", 123, true]);
    let nftDataFalse = ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint256", "bool"], ["xxx", 123, false]);

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60
    // create token a price 0
    let paramsA = {
      info: {
        tid: "a",
        tTwitterName: "a",
        cid: "a",
        cTwitterName: "a",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: 0,
    };

    let signatureA = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [paramsA.info, paramsA.nftPrice, paramsA.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.kol.connect(info.userWallet).createToken(paramsA.info, paramsA.nftPrice, paramsA.deadline, signatureA);

    // create token b price 1
    let paramsB = {
      info: {
        tid: "b",
        tTwitterName: "b",
        cid: "bc",
        cTwitterName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: 123,
    };
    let signatureB = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [paramsB.info, paramsB.nftPrice, paramsB.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.simpleToken.connect(info.deployWallet).transfer(info.userWallet.address, paramsB.nftPrice);
    await info.simpleToken.connect(info.userWallet).approve(await info.kol.getAddress(), paramsB.nftPrice);
    await info.kol.connect(info.userWallet).createToken(paramsB.info, paramsB.nftPrice, paramsB.deadline, signatureB);

    // create token and multiply c price 0
    let paramsC = {
      info: {
        tid: "c",
        tTwitterName: "c",
        cid: "c",
        cTwitterName: "c",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: 0,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
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
            [paramsC.info, paramsC.nftPrice, paramsC.deadline, info.userWallet.address],
          ),
        ),
      ),
    );
    await info.simpleToken.connect(info.deployWallet).transfer(info.userWallet.address, BigInt(10 ** 22));
    await info.simpleToken.connect(info.userWallet).approve(await info.kol.getAddress(), BigInt(10 ** 22));

    let result = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(paramsC.info, paramsC.nftPrice, paramsC.deadline, signatureC, paramsC.multiplyAmount, BigInt(10 ** 22));
    console.log("createTokenAndMultiply c value", result);
    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(paramsC.info, paramsC.nftPrice, paramsC.deadline, signatureC, paramsC.multiplyAmount, result);

    await info.simpleToken.connect(info.userWallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(info.userWallet.address));
    await info.simpleToken.connect(info.userWallet).approve(await info.kol.getAddress(), 0);

    // create token and multiply d price 1
    let paramsD = {
      info: {
        tid: "d",
        tTwitterName: "d",
        cid: "de",
        cTwitterName: "de",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: 123,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let signatureD = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [paramsD.info, paramsD.nftPrice, paramsD.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.simpleToken.connect(info.deployWallet).transfer(info.userWallet.address, BigInt(10 ** 22));
    await info.simpleToken.connect(info.userWallet).approve(await info.kol.getAddress(), BigInt(10 ** 22));

    let resultD = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(paramsD.info, paramsD.nftPrice, paramsD.deadline, signatureD, paramsD.multiplyAmount, BigInt(10 ** 22));
    console.log("createTokenAndMultiply d value", resultD);
    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(paramsD.info, paramsD.nftPrice, paramsD.deadline, signatureD, paramsD.multiplyAmount, resultD);

    await info.simpleToken.connect(info.userWallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(info.userWallet.address));
    await info.simpleToken.connect(info.userWallet).approve(await info.kol.getAddress(), 0);

    // b claim onft
    let signatureBClaim = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], [paramsB.info.tid, nftOwnerB2.address]),
        ),
      ),
    );
    await info.kolNFTClaim.claimNFT(paramsB.info.tid, nftOwnerB2.address, signatureBClaim);

    let bigNumber = BigInt(10) ** BigInt(18) * BigInt(800);
    // buy b
    await info.simpleToken.connect(info.deployWallet).transfer(user1Wallet.address, bigNumber);
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let buybPayTokenAmount = await info.marketKol
      .connect(user1Wallet)
      .buy.staticCall(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000));
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), buybPayTokenAmount);
    await info.marketKol
      .connect(user1Wallet)
      .buy(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000));

    await info.simpleToken.connect(user1Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user1Wallet.address));
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), 0);

    // sell b
    await info.marketKol.connect(user1Wallet).sell(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(1000));

    // mortgage b
    let mortgageb = await info.marketKol
      .connect(user1Wallet)
      .mortgage.staticCall(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(9000));
    await info.marketKol.connect(user1Wallet).mortgage(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(9000));

    // redeem b
    await info.simpleToken.connect(info.deployWallet).transfer(user1Wallet.address, bigNumber);
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let redeemPayTokenAmount = await info.marketKol
      .connect(user1Wallet)
      .redeem.staticCall(mortgageb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(9000));
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), redeemPayTokenAmount);

    await info.marketKol
      .connect(user1Wallet)
      .redeem(mortgageb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(9000));
    await info.simpleToken.connect(user1Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user1Wallet.address));
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), 0);


    // multiply b
    await info.simpleToken.connect(info.deployWallet).transfer(user1Wallet.address, bigNumber);
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let multiplyb = await info.marketKol
      .connect(user1Wallet)
      .multiply.staticCall(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000));
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), multiplyb.payTokenAmount);

    await info.marketKol
      .connect(user1Wallet)
      .multiply(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000));

    await info.simpleToken.connect(user1Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user1Wallet.address));
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), 0);

    // multiplyadd b
    await info.simpleToken.connect(info.deployWallet).transfer(user1Wallet.address, bigNumber);
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let multiplyAddB = await info.marketKol
      .connect(user1Wallet)
      .multiplyAdd.staticCall(multiplyb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(10000));
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), multiplyAddB);

    await info.marketKol
      .connect(user1Wallet)
      .multiplyAdd(multiplyb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(10000));

    await info.simpleToken.connect(user1Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user1Wallet.address));
    await info.simpleToken.connect(user1Wallet).approve(await info.marketKol.getAddress(), 0);

    // multiply b user3
    await info.simpleToken.connect(info.deployWallet).transfer(user3Wallet.address, bigNumber);
    await info.simpleToken.connect(user3Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let multiplyb3 = await info.marketKol
      .connect(user3Wallet)
      .multiply.staticCall(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(90000));
    await info.simpleToken.connect(user3Wallet).approve(await info.marketKol.getAddress(), multiplyb3.payTokenAmount);

    await info.marketKol
      .connect(user3Wallet)
      .multiply(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(90000));

    await info.simpleToken.connect(user3Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user3Wallet.address));
    await info.simpleToken.connect(user3Wallet).approve(await info.marketKol.getAddress(), 0);

    // cash b
    await info.marketKol.connect(user1Wallet).cash(multiplyb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(11000));

    // buy d
    await info.simpleToken.connect(info.deployWallet).transfer(user2Wallet.address, bigNumber);
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let buyPayTokenAmount = await info.marketKol
      .connect(user2Wallet)
      .buy.staticCall(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000));
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), buyPayTokenAmount);

    await info.marketKol
      .connect(user2Wallet)
      .buy(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000));

    await info.simpleToken.connect(user2Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user2Wallet.address));
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), 0);

    // sell d
    await info.marketKol.connect(user2Wallet).sell(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(1000));

    // mortgage d
    let mortgaged = await info.marketKol
      .connect(user2Wallet)
      .mortgage.staticCall(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(9000));
    await info.marketKol.connect(user2Wallet).mortgage(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(9000));

    // redeem d
    await info.simpleToken.connect(info.deployWallet).transfer(user2Wallet.address, bigNumber);
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let redeemdPayTokenAmount = await info.marketKol
      .connect(user2Wallet)
      .redeem.staticCall(mortgaged.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(9000));
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), redeemdPayTokenAmount);

    await info.marketKol
      .connect(user2Wallet)
      .redeem(mortgaged.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(9000));
    await info.simpleToken.connect(user2Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user2Wallet.address));
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), 0);

    // multiply d
    await info.simpleToken.connect(info.deployWallet).transfer(user2Wallet.address, bigNumber);
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let multiplyd = await info.marketKol
      .connect(user2Wallet)
      .multiply.staticCall(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000));
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), multiplyd.payTokenAmount);

    await info.marketKol
      .connect(user2Wallet)
      .multiply(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000));
    await info.simpleToken.connect(user2Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user2Wallet.address));
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), 0);

    // multiplyadd d
    await info.simpleToken.connect(info.deployWallet).transfer(user2Wallet.address, bigNumber);
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let multiplyAddD = await info.marketKol
      .connect(user2Wallet)
      .multiplyAdd.staticCall(multiplyd.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(10000));
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), multiplyAddD);

    await info.marketKol
      .connect(user2Wallet)
      .multiplyAdd(multiplyd.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(10000));

    await info.simpleToken.connect(user2Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user2Wallet.address));
    await info.simpleToken.connect(user2Wallet).approve(await info.marketKol.getAddress(), 0);

    // multiply d user3
    await info.simpleToken.connect(info.deployWallet).transfer(user3Wallet.address, bigNumber);
    await info.simpleToken.connect(user3Wallet).approve(await info.marketKol.getAddress(), bigNumber);

    let multiplyd3 = await info.marketKol
      .connect(user3Wallet)
      .multiply.staticCall(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(90000));
    await info.simpleToken.connect(user3Wallet).approve(await info.marketKol.getAddress(), multiplyd3.payTokenAmount);

    await info.marketKol
      .connect(user3Wallet)
      .multiply(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(90000));

    await info.simpleToken.connect(user3Wallet).transfer(info.deployWallet.address, await info.simpleToken.balanceOf(user3Wallet.address));
    await info.simpleToken.connect(user3Wallet).approve(await info.marketKol.getAddress(), 0);

    // cash d
    await info.marketKol.connect(user2Wallet).cash(multiplyd.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(11000));
  });
});
