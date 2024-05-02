import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";

describe("KolNFTClaim", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.kolNFTClaim.kol()).eq(await info.kol.getAddress());
    expect(await info.kolNFTClaim.publicNFT()).eq(await info.publicNFTKol.getAddress());
    expect(await info.kolNFTClaim.owner()).eq(info.deployWallet.address);
    expect(await info.kolNFTClaim.signatureAddress()).eq(info.signatureWallet.address);
  });

  it("setSignatureAddress", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let newOwner = info.wallets[info.nextWalletIndex];
    let newSign = info.wallets[info.nextWalletIndex + 1];

    expect(await info.kolNFTClaim.owner()).eq(info.deployWallet.address);
    await info.kolNFTClaim.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.kolNFTClaim.owner()).eq(newOwner.address);

    await expect(info.kolNFTClaim.setSignatureAddress(newSign.address)).revertedWith(
      "Ownable: caller is not the owner",
    );
    await info.kolNFTClaim.connect(newOwner).setSignatureAddress(newSign.address);
    expect(await info.kolNFTClaim.signatureAddress()).eq(newSign.address);
  });

  it("isClaim claimNFT ethAmount", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let user = info.wallets[info.nextWalletIndex];
    let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 2];

    expect(await info.kolNFTClaim.tokenIdToPayTokenAmount(1)).eq(0);
    expect(await info.kolNFTClaim.tokenIdToPayTokenAmount(2)).eq(0);

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

    let tx = await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signatureC, params.multiplyAmount, 0, { value: result });

    expect(await info.kolNFTClaim.isClaim(params.info.tid)).eq(false);

    await expect(tx).to.emit(info.kolNFTClaim, "ReceiveBuySellFee").withArgs(2, 950095009500950);

    // claim onft
    let signatureClaim = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], [params.info.tid, nftOwner2.address]),
        ),
      ),
    );
    await expect(info.kolNFTClaim.claimNFT(params.info.tid, nftOwner1.address, signatureClaim)).revertedWith("VSE");

    let kolNFTClaimEthAmount2_1 = await info.kolNFTClaim.tokenIdToPayTokenAmount(2);
    let kolNFTClaimEth1 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());
    let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

    expect(kolNFTClaimEthAmount2_1).eq(kolNFTClaimEth1).eq("950095009500950");

    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(await info.kolNFTClaim.getAddress());
    await info.kolNFTClaim.claimNFT(params.info.tid, nftOwner2.address, signatureClaim);
    expect(await info.publicNFTKol.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(2)).eq(nftOwner2.address);

    let kolNFTClaimEthAmount2_2 = await info.kolNFTClaim.tokenIdToPayTokenAmount(2);
    let kolNFTClaimEth2 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());
    let nftOwner2Eth2 = await ethers.provider.getBalance(nftOwner2.address);

    expect(await info.kolNFTClaim.isClaim(params.info.tid)).eq(true);

    expect(kolNFTClaimEthAmount2_1).eq("950095009500950");
    expect(kolNFTClaimEthAmount2_2).eq(kolNFTClaimEth2).eq(0);

    expect(nftOwner2Eth2).eq(nftOwner2Eth1 + kolNFTClaimEthAmount2_1);

    // re claim
    await expect(info.kolNFTClaim.claimNFT(params.info.tid, nftOwner2.address, signatureClaim)).revertedWith("CE");

    // claim onft tid error
    let signatureClaimTidError = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], ["t123", nftOwner2.address])),
      ),
    );

    await expect(info.kolNFTClaim.claimNFT("t123", nftOwner2.address, signatureClaimTidError)).revertedWith("TE1");

    // tid 2
    let params2 = {
      info: {
        tid: "t2",
        tTwitterName: "b",
        cid: "t2",
        cTwitterName: "b",
        followers: 123,
        omf: 2212,
      },
      nftPrice: 0,
      deadline: deadline,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
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

    await expect(info.publicNFTKol.ownerOf(3)).revertedWith("ERC721: invalid token ID");
    await expect(info.publicNFTKol.ownerOf(4)).revertedWith("ERC721: invalid token ID");

    await info.kol
      .connect(info.userWallet)
      .createTokenAndMultiply(params2.info, params2.nftPrice, params2.deadline, signature2, params2.multiplyAmount, 0, { value: result2 });

    expect(await info.publicNFTKol.ownerOf(3)).eq(info.userWallet.address);
    expect(await info.publicNFTKol.ownerOf(4)).eq(info.userWallet.address);
    expect(await info.kolNFTClaim.isClaim(params2.info.tid)).eq(true);

    // claim onft
    let signatureClaim2 = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], [params2.info.tid, nftOwner2.address]),
        ),
      ),
    );
    // re claim
    await expect(info.kolNFTClaim.claimNFT(params2.info.tid, nftOwner2.address, signatureClaim2)).revertedWith("CE");
  });

  it("setClaim", async function () {
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

    expect(await info.kolNFTClaim.isClaim(params.info.tid)).eq(false);

    await expect(info.kolNFTClaim.setClaim(params.info.tid)).revertedWith("SE");
  });

  it("withdraw", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let newOwner = info.wallets[info.nextWalletIndex + 3];

    expect(await info.kolNFTClaim.owner()).eq(info.deployWallet.address);
    await info.kolNFTClaim.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.kolNFTClaim.owner()).eq(newOwner.address);

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

    let kolNFTClaimEthAmount2_1 = await info.kolNFTClaim.tokenIdToPayTokenAmount(2);
    let kolNFTClaimEth1 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());

    expect(kolNFTClaimEth1).eq(kolNFTClaimEthAmount2_1);
    expect(kolNFTClaimEthAmount2_1).gt(0);

    await expect(info.kolNFTClaim.withdraw(params.info.tid, kolNFTClaimEthAmount2_1)).revertedWith(
      "Ownable: caller is not the owner",
    );

    await expect(
      info.kolNFTClaim.connect(newOwner).withdraw(params.info.tid, kolNFTClaimEthAmount2_1 + BigInt(1)),
    ).revertedWith("EAE");

    let newOwnerEth1 = await ethers.provider.getBalance(newOwner.address);

    let tx = await info.kolNFTClaim.connect(newOwner).withdraw(params.info.tid, kolNFTClaimEthAmount2_1 - BigInt(1));
    let res = await tx.wait();
    let gas = BigInt(0);
    if (res && res.gasUsed) {
      gas = tx.gasPrice * res.gasUsed;
    }

    let kolNFTClaimEthAmount2_2 = await info.kolNFTClaim.tokenIdToPayTokenAmount(2);
    let kolNFTClaimEth2 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());
    let newOwnerEth2 = await ethers.provider.getBalance(newOwner.address);

    expect(kolNFTClaimEth2).eq(kolNFTClaimEthAmount2_2).eq(1);
    expect(newOwnerEth2).eq(newOwnerEth1 + kolNFTClaimEthAmount2_1 - BigInt(1) - gas);

    let tx2 = await info.kolNFTClaim.connect(newOwner).withdraw(params.info.tid, BigInt(1));
    let res2 = await tx2.wait();
    let gas2 = BigInt(0);
    if (res2 && res2.gasUsed) {
      gas2 = tx2.gasPrice * res2.gasUsed;
    }

    let kolNFTClaimEthAmount2_3 = await info.kolNFTClaim.tokenIdToPayTokenAmount(2);
    let kolNFTClaimEth3 = await ethers.provider.getBalance(await info.kolNFTClaim.getAddress());
    let newOwnerEth3 = await ethers.provider.getBalance(newOwner.address);
    expect(kolNFTClaimEth3).eq(kolNFTClaimEthAmount2_3).eq(0);
    expect(newOwnerEth3).eq(newOwnerEth2 + BigInt(1) - gas2);

    await expect(info.kolNFTClaim.connect(newOwner).withdraw(params.info.tid, BigInt(1))).revertedWith("EAE");
    await expect(info.kolNFTClaim.connect(newOwner).withdraw("t1234", BigInt(1))).revertedWith("TE1");
  });

});
