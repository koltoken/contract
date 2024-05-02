import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { ethers } from "hardhat";

describe("Kol.createTokenAndMultiply", function () {
  it("createTokenAndMultiply value < nft price + multiply", async function () {
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
      nftPrice: 10,
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

    await expect(
      info.kol
        .connect(info.userWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, BigInt(10) ** BigInt(18) * BigInt(100), 0, {
          value: 1,
        }),
    ).revertedWithPanic();

    await expect(
      info.kol
        .connect(info.userWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, BigInt(10) ** BigInt(18) * BigInt(100), 0, {
          value: result - BigInt(1),
        }),
    ).rejectedWith("VE");
  });

  it("createTokenAndMultiply value == nft price + multiply", async function () {
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
      nftPrice: BigInt(10) ** BigInt(17),
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

    let userWalletEth1 = await ethers.provider.getBalance(info.userWallet.address);
    let kolEth1 = await ethers.provider.getBalance(await info.kol.getAddress());
    let kolFundEth1 = await ethers.provider.getBalance(info.kolFundRecipientWallet.address);
    let marketEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
    let mortgageEth1 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

    let onftOwnerEth1 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());

    let result = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });

    let tx = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: result,
      });

    let res = await tx.wait();

    let gas = BigInt(0);
    if (res) {
      gas = res.gasUsed * res.gasPrice;
    }

    let curve = await info.marketKol.getPayTokenAmount(0, params.multiplyAmount);

    let userWalletEth2 = await ethers.provider.getBalance(info.userWallet.address);
    let kolEth2 = await ethers.provider.getBalance(await info.kol.getAddress());
    let kolFundEth2 = await ethers.provider.getBalance(info.kolFundRecipientWallet.address);
    let marketEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
    let mortgageEth2 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

    let onftOwnerEth2 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());

    // userWalletEth1 - gas - nftPrice - multiplyEth + cnftFee = userWalletEth2
    let nftOwner2EthAdd = onftOwnerEth2 - onftOwnerEth1;
    let nftOwner1EthAdd = userWalletEth2 - userWalletEth1 + gas + result;
    let mortgageEthAdd = mortgageEth2 - mortgageEth1;

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(await info.kolNFTClaim.getAddress());

    expect(curve / mortgageEthAdd).eq(1000);
    expect(curve / (nftOwner2EthAdd + nftOwner1EthAdd)).eq(100);

    expect(result - params.nftPrice).eq(mortgageEthAdd + nftOwner2EthAdd + nftOwner1EthAdd);

    expect((curve + nftOwner2EthAdd + nftOwner1EthAdd) / (result - params.nftPrice)).eq(91);

    expect(kolEth2).eq(kolEth1).eq(0);
    expect(kolFundEth2).eq(kolFundEth1 + params.nftPrice);
    expect(marketEth2).eq(marketEth1).eq(0);
  });

  it("createTokenAndMultiply value > nft price + multiply", async function () {
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
      nftPrice: BigInt(10) ** BigInt(17),
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

    let userWalletEth1 = await ethers.provider.getBalance(info.userWallet.address);
    let kolEth1 = await ethers.provider.getBalance(await info.kol.getAddress());
    let kolFundEth1 = await ethers.provider.getBalance(info.kolFundRecipientWallet.address);
    let marketEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
    let mortgageEth1 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

    let onftOwnerEth1 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());

    let result = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });

    let tx = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: result + BigInt(10) ** BigInt(19),
      });
    let res = await tx.wait();

    let gas = BigInt(0);
    if (res) {
      gas = res.gasUsed * res.gasPrice;
    }

    let curve = await info.marketKol.getPayTokenAmount(0, params.multiplyAmount);

    let userWalletEth2 = await ethers.provider.getBalance(info.userWallet.address);
    let kolEth2 = await ethers.provider.getBalance(await info.kol.getAddress());
    let kolFundEth2 = await ethers.provider.getBalance(info.kolFundRecipientWallet.address);
    let marketEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
    let mortgageEth2 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

    let onftOwnerEth2 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());

    // userWalletEth1 - gas - nftPrice - multiplyEth + cnftFee = userWalletEth2
    let nftOwner2EthAdd = onftOwnerEth2 - onftOwnerEth1;
    let nftOwner1EthAdd = userWalletEth2 - userWalletEth1 + gas + result;
    let mortgageEthAdd = mortgageEth2 - mortgageEth1;

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(await info.kolNFTClaim.getAddress());

    expect(curve / mortgageEthAdd).eq(1000);
    expect(curve / (nftOwner2EthAdd + nftOwner1EthAdd)).eq(100);

    expect(result - params.nftPrice).eq(mortgageEthAdd + nftOwner2EthAdd + nftOwner1EthAdd);

    expect((curve + nftOwner2EthAdd + nftOwner1EthAdd) / (result - params.nftPrice)).eq(91);

    expect(kolEth2).eq(kolEth1).eq(0);
    expect(kolFundEth2).eq(kolFundEth1 + params.nftPrice);
    expect(marketEth2).eq(marketEth1).eq(0);

    await expect(
      info.kol
        .connect(info.userWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
          value: result + BigInt(10) ** BigInt(19),
        }),
    ).revertedWith("TE");
  });

  it("createTokenAndMultiply value == nft price + multiply onft==cnft", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "t1",
        tTwitterName: "a",
        cid: "t1",
        cTwitterName: "a",
        followers: 123,
        omf: 2212,
      },
      nftPrice: BigInt(10) ** BigInt(17),
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

    let userWalletEth1 = await ethers.provider.getBalance(info.userWallet.address);
    let kolEth1 = await ethers.provider.getBalance(await info.kol.getAddress());
    let kolFundEth1 = await ethers.provider.getBalance(info.kolFundRecipientWallet.address);
    let marketEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
    let mortgageEth1 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);
    let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
    let kolNFTClaimEth1 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());

    let result = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: BigInt(10 ** 22),
      });

    let tx = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: result,
      });
    let res = await tx.wait();

    let gas = BigInt(0);
    if (res) {
      gas = res.gasUsed * res.gasPrice;
    }

    let curve = await info.marketKol.getPayTokenAmount(0, params.multiplyAmount);

    let userWalletEth2 = await ethers.provider.getBalance(info.userWallet.address);
    let kolEth2 = await ethers.provider.getBalance(await info.kol.getAddress());
    let kolFundEth2 = await ethers.provider.getBalance(info.kolFundRecipientWallet.address);
    let marketEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
    let mortgageEth2 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);
    let nftOwner1Eth2 = await ethers.provider.getBalance(nftOwner1.address);
    let kolNFTClaimEth2 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());

    // userWalletEth1 - gas - nftPrice - multiplyEth + cnftFee = userWalletEth2
    let nftFee = userWalletEth2 - userWalletEth1 + gas + result;
    let mortgageEthAdd = mortgageEth2 - mortgageEth1;

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(info.userWallet.address);

    expect(kolNFTClaimEth2).eq(kolNFTClaimEth1);

    expect(curve / mortgageEthAdd).eq(1000);
    expect(curve / nftFee).eq(100);

    expect(result - params.nftPrice).eq(mortgageEthAdd + nftFee);

    expect((curve + nftFee) / (result - params.nftPrice)).eq(91);

    expect(kolEth2).eq(kolEth1).eq(0);
    expect(kolFundEth2).eq(kolFundEth1 + params.nftPrice);
    expect(marketEth2).eq(marketEth1).eq(0);
  });

  it("createTokenAndMultiply check deadline", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp - 60 * 10;

    let params = {
      info: {
        tid: "t1",
        tTwitterName: "a",
        cid: "t1",
        cTwitterName: "a",
        followers: 123,
        omf: 2212,
      },
      nftPrice: BigInt(10) ** BigInt(17),
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

    await expect(
      info.kol
        .connect(info.userWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
          value: BigInt(10) ** BigInt(18) * BigInt(100),
        })
    ).revertedWith("CTE");

  });

  it("createTokenAndMultiply 20 eth", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let nftOwner1 = info.wallets[info.nextWalletIndex];

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let multiplyAmount = BigInt(10) ** BigInt(15) * BigInt(645161290)

    let params = {
      info: {
        tid: "t1",
        tTwitterName: "a",
        cid: "t1",
        cTwitterName: "a",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
      multiplyAmount: multiplyAmount,
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
        value: BigInt(10) ** BigInt(18) * BigInt(20),
      });

    expect(result).eq("19999999971818181843") // 20 eth
  });
});
