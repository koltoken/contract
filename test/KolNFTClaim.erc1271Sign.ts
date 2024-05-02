import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { ERC1271 } from "../typechain-types";

describe("KolNFTClaim.erc1271Sign", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.kolNFTClaim.kol()).eq(await info.kol.getAddress());
    expect(await info.kolNFTClaim.publicNFT()).eq(await info.publicNFTKol.getAddress());
    expect(await info.kolNFTClaim.owner()).eq(info.deployWallet.address);
    expect(await info.kolNFTClaim.signatureAddress()).eq(info.signatureWallet.address);
  });

  it("claimNFT", async function () {
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

    // erc1271
    expect(await info.kolNFTClaim.owner()).eq(info.deployWallet.address);
    // deploy erc1271
    let erc1271 = (await (
      await ethers.getContractFactory("ERC1271")
    ).deploy()) as ERC1271;

    await info.kolNFTClaim.connect(info.deployWallet).setSignatureAddress(await erc1271.getAddress());
    expect(await info.kolNFTClaim.signatureAddress()).eq(await erc1271.getAddress());

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

    await expect(info.kolNFTClaim.claimNFT(params.info.tid, nftOwner2.address, signatureClaim)).revertedWith("VSE");
    await erc1271.addClaimSignature(params.info.tid, nftOwner2.address, signatureClaim);
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

    await erc1271.addClaimSignature("t123", nftOwner2.address, signatureClaimTidError);
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

});
