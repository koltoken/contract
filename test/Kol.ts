import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";

async function getSignature(signatureWallet: any, params: any, sender: any) {
  return await signatureWallet.signMessage(
    ethers.toBeArray(
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          [
            "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
            "uint256",
            "uint256",
            "address",
          ],
          [params.info, params.nftPrice, params.deadline, sender.address],
        ),
      ),
    ),
  );
}

describe("Kol", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.kol.appId()).eq(info.appId);
    expect(await info.kol.foundry()).eq(await info.foundry.getAddress());
    expect(await info.kol.kolNFTClaim()).eq(await info.kolNFTClaim.getAddress());
    expect(await info.kol.market()).eq(await info.marketKol.getAddress());
    expect(await info.kol.mortgageNFT()).eq(await info.mortgageNFTKol.getAddress());
    expect(await info.kol.fundRecipient()).eq(info.kolFundRecipientWallet.address);
    expect(await info.kol.owner()).eq(info.deployWallet.address);
    expect(await info.kol.signatureAddress()).eq(info.signatureWallet.address);
  });

  it("setFundRecipient", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let newOwner = info.wallets[info.nextWalletIndex];
    let newFund = info.wallets[info.nextWalletIndex + 1];

    expect(await info.kol.owner()).eq(info.deployWallet.address);
    await info.kol.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.kol.owner()).eq(newOwner.address);

    await expect(info.kol.setFundRecipient(newFund.address)).revertedWith("Ownable: caller is not the owner");
    await info.kol.connect(newOwner).setFundRecipient(newFund.address);
    expect(await info.kol.fundRecipient()).eq(newFund.address);
  });

  it("setSignatureAddress", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let newOwner = info.wallets[info.nextWalletIndex];
    let newSign = info.wallets[info.nextWalletIndex + 1];

    expect(await info.kol.owner()).eq(info.deployWallet.address);
    await info.kol.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.kol.owner()).eq(newOwner.address);

    await expect(info.kol.setSignatureAddress(newSign.address)).revertedWith("Ownable: caller is not the owner");
    await info.kol.connect(newOwner).setSignatureAddress(newSign.address);
    expect(await info.kol.signatureAddress()).eq(newSign.address);
  });

  it("receive eth", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let user = info.wallets[info.nextWalletIndex];

    let kolEth1 = await ethers.provider.getBalance(await info.kol.getAddress());
    let userEth1 = await ethers.provider.getBalance(user.address);

    let eth = BigInt(10) ** BigInt(17);
    let tx = await user.sendTransaction({
      to: await info.kol.getAddress(),
      value: eth,
    });
    let res = await tx.wait();
    let kolEth2 = await ethers.provider.getBalance(await info.kol.getAddress());
    let userEth2 = await ethers.provider.getBalance(user.address);

    let gas = res.gasUsed * tx.gasPrice;
    expect(userEth2).eq(userEth1 - eth - BigInt(gas));
    expect(kolEth2).eq(kolEth1 + eth);
  });

  it("createToken", async function () {
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
      nftPrice: 1,
      deadline: deadline,
    };
    let signature = await getSignature(info.signatureWallet, params, info.userWallet);

    await info.kol
      .connect(info.userWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature, { value: params.nftPrice });

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(await info.kolNFTClaim.getAddress());
    expect(await info.kolNFTClaim.isClaim(params.info.tid)).eq(false);

    await expect(info.publicNFTKol.ownerOf(3)).revertedWith("ERC721: invalid token ID");
    await expect(info.publicNFTKol.ownerOf(4)).revertedWith("ERC721: invalid token ID");

    let params2 = {
      info: {
        tid: "t2",
        tTwitterName: "ccc",
        cid: "t2",
        cTwitterName: "ccc",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
    };
    let signature2 = await getSignature(info.signatureWallet, params2, info.userWallet);

    await info.kol
      .connect(info.userWallet)
      .createToken(params2.info, params2.nftPrice, params2.deadline, signature2, { value: params2.nftPrice });

    expect(await info.publicNFTKol.ownerOf(3)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(4)).eq(info.userWallet.address);
    expect(await info.kolNFTClaim.isClaim(params2.info.tid)).eq(true);

    let params3 = {
      info: {
        tid: "t1",
        tTwitterName: "xxxx",
        cid: "b",
        cTwitterName: "xxxx",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
    };
    let signature3 = await getSignature(info.signatureWallet, params3, info.userWallet);

    await expect(
      info.kol
        .connect(info.userWallet)
        .createToken(params3.info, params3.nftPrice, params3.deadline, signature3, { value: params.nftPrice }),
    ).revertedWith("TE");

    let params4 = {
      info: {
        tid: "t6",
        tTwitterName: "xxxx",
        cid: "b",
        cTwitterName: "xxxx",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 123,
      deadline: deadline,
    };
    let signature4 = await getSignature(info.signatureWallet, params4, info.deployWallet);

    await expect(
      info.kol
        .connect(info.userWallet)
        .createToken(params4.info, params4.nftPrice, params4.deadline, signature4, { value: params4.nftPrice }),
    ).revertedWith("VSE");

    await expect(
      info.kol.connect(info.deployWallet).createToken(params4.info, 0, params4.deadline, signature4, { value: 0 }),
    ).revertedWith("VSE");
  });

  it("createTokenAndMultiply", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let bigNumber = BigInt(10 ** 19);

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
      nftPrice: 1,
      deadline: deadline,
      multiplyAmount: 100,
    };
    let signature = await getSignature(info.signatureWallet, params, info.userWallet);

    let result = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: bigNumber,
      });

    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
        value: result,
      });

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(await info.kolNFTClaim.getAddress());
    expect(await info.kolNFTClaim.isClaim(params.info.tid)).eq(false);

    await expect(info.publicNFTKol.ownerOf(3)).revertedWith("ERC721: invalid token ID");
    await expect(info.publicNFTKol.ownerOf(4)).revertedWith("ERC721: invalid token ID");

    let params2 = {
      info: {
        tid: "t2",
        tTwitterName: "ccc",
        cid: "t2",
        cTwitterName: "ccc",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
      multiplyAmount: 100,
    };
    let signature2 = await getSignature(info.signatureWallet, params2, info.userWallet);

    let result2 = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply.staticCall(params2.info, params2.nftPrice, params2.deadline, signature2, params2.multiplyAmount, 0, {
        value: bigNumber,
      });

    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params2.info, params2.nftPrice, params2.deadline, signature2, params2.multiplyAmount, 0, {
        value: result2,
      });

    expect(await info.publicNFTKol.ownerOf(3)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(4)).eq(info.userWallet.address);
    expect(await info.kolNFTClaim.isClaim(params2.info.tid)).eq(true);

    let params3 = {
      info: {
        tid: "t1",
        tTwitterName: "xxxx",
        cid: "b",
        cTwitterName: "xxxx",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
      multiplyAmount: 100,
    };
    let signature3 = await getSignature(info.signatureWallet, params3, info.userWallet);

    await expect(
      info.kol
        .connect(info.userWallet)
        .createTokenAndMultiply(params3.info, params3.nftPrice, params3.deadline, signature3, params3.multiplyAmount, 0, { value: 1 }),
    ).revertedWith("TE");

    let params4 = {
      info: {
        tid: "t6",
        tTwitterName: "xxxx",
        cid: "b",
        cTwitterName: "xxxx",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 1000,
      deadline: deadline,
      multiplyAmount: 100,
    };
    let signature4 = await getSignature(info.signatureWallet, params4, info.deployWallet);

    await expect(
      info.kol
        .connect(info.userWallet)
        .createTokenAndMultiply(params4.info, params4.nftPrice, params4.deadline, signature4, params4.multiplyAmount, 0, {
          value: bigNumber,
        }),
    ).revertedWith("VSE");

    await expect(
      info.kol
        .connect(info.deployWallet)
        .createTokenAndMultiply(params4.info, params4.nftPrice - 1, params4.deadline, signature4, params4.multiplyAmount, 0, {
          value: bigNumber,
        }),
    ).revertedWith("VSE");
  });
});
