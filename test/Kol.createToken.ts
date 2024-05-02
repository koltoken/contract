import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { ethers } from "hardhat";

describe("Kol.createToken", function () {
  it("createToken value < nft price", async function () {
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
      deadline: deadline,
      nftPrice: 10,
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
      info.kol.connect(info.userWallet).createToken(params.info, params.nftPrice, params.deadline, signature, { value: 1 }),
    ).revertedWith("PE");
  });

  it("createToken value == nft price", async function () {
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
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(17),
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

    let tx = await info.kol
      .connect(info.userWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature, { value: params.nftPrice });
    let res = await tx.wait();

    let gas = BigInt(0);
    if (res) {
      gas = res.gasUsed * res.gasPrice;
    }

    let userWalletEth2 = await ethers.provider.getBalance(info.userWallet.address);
    let kolEth2 = await ethers.provider.getBalance(await info.kol.getAddress());
    let kolFundEth2 = await ethers.provider.getBalance(info.kolFundRecipientWallet.address);

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(await info.kolNFTClaim.getAddress());

    expect(userWalletEth2).eq(userWalletEth1 - params.nftPrice - gas);
    expect(kolEth2).eq(kolEth1).eq(0);
    expect(kolFundEth2).eq(kolFundEth1 + params.nftPrice);

    await expect(
      info.kol
        .connect(info.userWallet)
        .createToken(params.info, params.nftPrice, params.deadline, signature, { value: params.nftPrice }),
    ).revertedWith("TE");
  });

  it("createToken value > nft price", async function () {
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
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(17),
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

    let tx = await info.kol
      .connect(info.userWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature, { value: params.nftPrice * BigInt(10) });
    let res = await tx.wait();

    let gas = BigInt(0);
    if (res) {
      gas = res.gasUsed * res.gasPrice;
    }

    let userWalletEth2 = await ethers.provider.getBalance(info.userWallet.address);
    let kolEth2 = await ethers.provider.getBalance(await info.kol.getAddress());
    let kolFundEth2 = await ethers.provider.getBalance(await info.kolFundRecipientWallet.address);

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(await info.kolNFTClaim.getAddress());

    expect(userWalletEth2).eq(userWalletEth1 - params.nftPrice - gas);
    expect(kolEth2).eq(kolEth1).eq(0);
    expect(kolFundEth2).eq(kolFundEth1 + params.nftPrice);
  });

  it("createToken deadline check", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp - 60 * 10;

    let params = {
      info: {
        tid: "t1",
        tTwitterName: "a",
        cid: "b",
        cTwitterName: "b",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(17),
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
        .createToken(params.info, params.nftPrice, params.deadline, signature, { value: params.nftPrice * BigInt(10) })
    ).revertedWith("CTE");

  });
});
