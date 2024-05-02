import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";

describe("Base", function () {
  it("test", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

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

    await info.kol.connect(info.userWallet).createToken(paramsA.info, paramsA.nftPrice, paramsA.deadline, signatureA, {
      value: 0,
    });

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
    await info.kol.connect(info.userWallet).createToken(paramsB.info, paramsB.nftPrice, paramsB.deadline, signatureB, {
      value: paramsB.nftPrice,
    });

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
    let result = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(paramsC.info, paramsC.nftPrice, paramsC.deadline, signatureC, paramsC.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });
    console.log("createTokenAndMultiply c value", result);
    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(paramsC.info, paramsC.nftPrice, paramsC.deadline, signatureC, paramsC.multiplyAmount, 0, { value: result });

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

    let resultD = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(paramsD.info, paramsD.nftPrice, paramsD.deadline, signatureD, paramsD.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });
    console.log("createTokenAndMultiply d value", resultD);
    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(paramsD.info, paramsD.nftPrice, paramsD.deadline, signatureD, paramsD.multiplyAmount, 0, {
        value: resultD,
      });

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
    let buybEth = await info.marketKol
      .connect(user1Wallet)
      .buy.staticCall(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .buy(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: buybEth });

    // sell b
    await info.marketKol.connect(user1Wallet).sell(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(1000));

    // mortgage b
    let mortgageb = await info.marketKol
      .connect(user1Wallet)
      .mortgage.staticCall(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(9000));
    await info.marketKol.connect(user1Wallet).mortgage(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(9000));

    // redeem b
    let redeembEth = await info.marketKol
      .connect(user1Wallet)
      .redeem.staticCall(mortgageb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(9000), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .redeem(mortgageb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(9000), { value: redeembEth });

    // multiply b
    let multiplyb = await info.marketKol
      .connect(user1Wallet)
      .multiply.staticCall(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: bigNumber });

    await info.marketKol
      .connect(user1Wallet)
      .multiply(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: multiplyb.payTokenAmount });

    // multiplyadd b
    let multiplyAddB = await info.marketKol
      .connect(user1Wallet)
      .multiplyAdd.staticCall(multiplyb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(10000), { value: bigNumber });
    await info.marketKol
      .connect(user1Wallet)
      .multiplyAdd(multiplyb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(10000), { value: multiplyAddB });

    // multiply b user3
    let multiplyb3 = await info.marketKol
      .connect(user3Wallet)
      .multiply.staticCall(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(90000), { value: bigNumber });
    await info.marketKol
      .connect(user3Wallet)
      .multiply(paramsB.info.tid, BigInt(10) ** BigInt(18) * BigInt(90000), { value: multiplyb3.payTokenAmount });

    // cash b
    await info.marketKol.connect(user1Wallet).cash(multiplyb.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(11000));

    // buy d
    let buydEth = await info.marketKol
      .connect(user2Wallet)
      .buy.staticCall(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: bigNumber });
    await info.marketKol
      .connect(user2Wallet)
      .buy(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: buydEth });

    // sell d
    await info.marketKol.connect(user2Wallet).sell(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(1000));

    // mortgage d
    let mortgaged = await info.marketKol
      .connect(user2Wallet)
      .mortgage.staticCall(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(9000));
    await info.marketKol.connect(user2Wallet).mortgage(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(9000));

    // redeem d
    let redeemdEth = await info.marketKol
      .connect(user2Wallet)
      .redeem.staticCall(mortgaged.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(9000), { value: bigNumber });
    await info.marketKol
      .connect(user2Wallet)
      .redeem(mortgaged.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(9000), { value: redeemdEth });

    // multiply d
    let multiplyd = await info.marketKol
      .connect(user2Wallet)
      .multiply.staticCall(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: bigNumber });
    await info.marketKol
      .connect(user2Wallet)
      .multiply(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: multiplyd.payTokenAmount });

    // multiplyadd d
    let multiplyAddD = await info.marketKol
      .connect(user2Wallet)
      .multiplyAdd.staticCall(multiplyd.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(10000), { value: bigNumber });
    await info.marketKol
      .connect(user2Wallet)
      .multiplyAdd(multiplyd.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(10000), { value: multiplyAddD });

    // multiply d user3
    let multiplyd3 = await info.marketKol
      .connect(user3Wallet)
      .multiply.staticCall(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(90000), { value: bigNumber });
    await info.marketKol
      .connect(user3Wallet)
      .multiply(paramsD.info.tid, BigInt(10) ** BigInt(18) * BigInt(90000), { value: multiplyd3.payTokenAmount });

    // cash d
    await info.marketKol.connect(user2Wallet).cash(multiplyd.nftTokenId, BigInt(10) ** BigInt(18) * BigInt(11000));
  });
});
