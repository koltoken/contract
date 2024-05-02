import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei, parseTokenURI, saveSVG } from "./shared/utils";

const nft_name = "KoL Position"
const nft_symbol = "KOLP"

const nft_json_desc = "This NFT represents a collateral position within the KoL Token system.\n⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure that the NFT image matches the number of KT in the collateral position. As NFT trading platforms cache images, it's advised to refresh the cached image for the latest data before purchasing the NFT."

describe("KolMortgageNFTView", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.kolMortgageNFTView.appId()).eq(info.appId);
    expect(await info.kolMortgageNFTView.foundry()).eq(await info.foundry.getAddress());
    expect(await info.kolMortgageNFTView.kolNFTClaim()).eq(await info.kolNFTClaim.getAddress());
    expect(await info.kolMortgageNFTView.mortgageNFT()).eq(await info.mortgageNFTKol.getAddress());
    expect(await info.kolMortgageNFTView.name()).eq(nft_name);
    expect(await info.kolMortgageNFTView.symbol()).eq(nft_symbol);
  });

  it("test", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;
    await info.mortgageNFTKol.connect(info.kolOwnerWallet).setMortgageNFTView(info.kolMortgageNFTView);

    let bigNumber = BigInt(10) ** BigInt(20) * BigInt(8);

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    // create token a price 0
    let paramsA = {
      info: {
        tid: "12345678",
        tTwitterName: "koltoken",
        cid: "87654321",
        cTwitterName: "rayMoss",
        followers: 2567967,
        omf: "6123400000000000000",
      },
      nftPrice: 0,
      deadline: deadline,
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

    let multiply = await info.marketKol
      .connect(info.userWallet)
      .multiply.staticCall(paramsA.info.tid, getTokenAmountWei(12345), { value: bigNumber });
    await info.marketKol
      .connect(info.userWallet)
      .multiply(paramsA.info.tid, getTokenAmountWei(12345), { value: multiply.payTokenAmount });

    expect(await info.mortgageNFTKol.name()).eq(nft_name);
    expect(await info.mortgageNFTKol.symbol()).eq(nft_symbol);

    const mnft1 = await info.mortgageNFTKol.tokenURI(multiply.nftTokenId);
    const json1 = parseTokenURI(mnft1);
    expect(json1.name).eq("@koltoken - #1 - 12345");
    expect(json1.description).eq(nft_json_desc);
    saveSVG("mnft1", json1.image);

    let multiply2 = await info.marketKol
      .connect(info.userWallet)
      .multiply.staticCall(paramsA.info.tid, BigInt(10) ** BigInt(16) * BigInt(216789), { value: bigNumber });
    await info.marketKol
      .connect(info.userWallet)
      .multiply(paramsA.info.tid, BigInt(10) ** BigInt(16) * BigInt(216789), { value: multiply2.payTokenAmount });

    const mnft2 = await info.mortgageNFTKol.tokenURI(multiply2.nftTokenId);
    const json2 = parseTokenURI(mnft2);
    expect(json2.name).eq("@koltoken - #2 - 2167.89");
    expect(json2.description).eq(nft_json_desc);
    saveSVG("mnft2", json2.image);

    //

    let multiply3 = await info.marketKol
      .connect(info.userWallet)
      .multiply.staticCall(paramsA.info.tid, BigInt(10) ** BigInt(17) * BigInt(123), { value: bigNumber });
    await info.marketKol
      .connect(info.userWallet)
      .multiply(paramsA.info.tid, BigInt(10) ** BigInt(17) * BigInt(123), { value: multiply3.payTokenAmount });

    const mnft3 = await info.mortgageNFTKol.tokenURI(multiply3.nftTokenId);
    const json3 = parseTokenURI(mnft3);
    expect(json3.name).eq("@koltoken - #3 - 12.3");
    expect(json3.description).eq(nft_json_desc);
    saveSVG("mnft3", json3.image);
  });
});
