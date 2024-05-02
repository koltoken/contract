import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseTokenURI, saveSVG } from "./shared/utils";

const nft_name = "cNFT of KoL Token"
const nft_symbol = "CNFT_KT"

function get_cnft_json_name(username: string) {
  return `@${username} - cNFT`
}

function get_onft_json_name(username: string) {
  return `@${username} - oNFT`
}

function get_cnft_json_desc(username: string) {
  return `This NFT entitles the holder the right to perpetually collect 5% trading fees from @${username}’s KT trades on the KoL Token platform.`
}

function get_onft_json_desc(username: string) {
  return `This NFT entitles the holder the right to perpetually collect 95% trading fees from @${username}’s KT trades on the KoL Token platform.`
}

describe("KolPublicNFTView", function () {
  it("deploy", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.kolPublicNFTView.appId()).eq(info.appId);
    expect(await info.kolPublicNFTView.foundry()).eq(await info.foundry.getAddress());
    expect(await info.kolPublicNFTView.kolNFTClaim()).eq(await info.kolNFTClaim.getAddress());
    expect(await info.kolPublicNFTView.publicNFT()).eq(await info.publicNFTKol.getAddress());
    expect(await info.kolPublicNFTView.name()).eq(nft_name);
    expect(await info.kolPublicNFTView.symbol()).eq(nft_symbol);
  });

  it("test c and o not eq", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;
    await info.publicNFTKol.connect(info.kolOwnerWallet).setPublicNFTView(info.kolPublicNFTView);

    let nftOwnerA2 = info.wallets[info.nextWalletIndex + 1];

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

    const tokenIDs = await info.publicNFTKol.tidToTokenIds(paramsA.info.tid);

    expect(await info.publicNFTKol.name()).eq(nft_name);
    expect(await info.publicNFTKol.symbol()).eq(nft_symbol);

    const cnftUn = await info.publicNFTKol.tokenURI(tokenIDs[0]);
    const json1 = parseTokenURI(cnftUn);
    expect(json1.name).eq(get_cnft_json_name("koltoken"));
    expect(json1.description).eq(
      get_cnft_json_desc("koltoken"),
    );
    saveSVG("cnft.noteq.no", json1.image);

    const onftUn = await info.publicNFTKol.tokenURI(tokenIDs[1]);
    const json2 = parseTokenURI(onftUn);
    expect(json2.name).eq(get_onft_json_name("koltoken"));
    expect(json2.description).eq(
      get_onft_json_desc("koltoken"),
    );

    saveSVG("onft.noteq.no", json2.image);

    // b claim onft
    let signatureAClaim = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], [paramsA.info.tid, nftOwnerA2.address]),
        ),
      ),
    );
    await info.kolNFTClaim.claimNFT(paramsA.info.tid, nftOwnerA2.address, signatureAClaim);

    const cnftYes = await info.publicNFTKol.tokenURI(tokenIDs[0]);
    const json3 = parseTokenURI(cnftYes);
    expect(json3.name).eq(get_cnft_json_name("koltoken"));
    expect(json3.description).eq(
      get_cnft_json_desc("koltoken"),
    );
    saveSVG("cnft.noteq.yes", json3.image);

    const onftYes = await info.publicNFTKol.tokenURI(tokenIDs[1]);
    const json4 = parseTokenURI(onftYes);
    expect(json4.name).eq(get_onft_json_name("koltoken"));
    expect(json4.description).eq(
      get_onft_json_desc("koltoken"),
    );
    saveSVG("onft.noteq.yes", json4.image);
  });

  it("test c and o eq", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;
    await info.publicNFTKol.connect(info.kolOwnerWallet).setPublicNFTView(info.kolPublicNFTView);

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    // create token a price 0
    let paramsA = {
      info: {
        tid: "87654321",
        tTwitterName: "rayMoss",
        cid: "87654321",
        cTwitterName: "rayMoss",
        followers: 1435,
        omf: "237500000000000000",
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

    const tokenIDs = await info.publicNFTKol.tidToTokenIds(paramsA.info.tid);

    const cnftUn = await info.publicNFTKol.tokenURI(tokenIDs[0]);
    const json1 = parseTokenURI(cnftUn);
    expect(json1.name).eq(get_cnft_json_name("rayMoss"));
    expect(json1.description).eq(
      get_cnft_json_desc("rayMoss"),
    );
    saveSVG("cnft.eq", json1.image);

    const onftUn = await info.publicNFTKol.tokenURI(tokenIDs[1]);
    const json2 = parseTokenURI(onftUn);
    expect(json2.name).eq(get_onft_json_name("rayMoss"));
    expect(json2.description).eq(
      get_onft_json_desc("rayMoss"),
    );
    saveSVG("onft.eq", json2.image);
  });
});
