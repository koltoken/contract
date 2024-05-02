import { ethers } from "hardhat";
import { expect } from "chai";

import { appid, foundryAddress, signatureWalletAddress, kolNFTClaimAddress, kolAddress, kolPublicNFTAddress, payTokenAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const info = await foundry.apps(appid);

  const kolNFTClaim = await ethers.deployContract(
    "KolNFTClaim",
    [kolAddress, kolPublicNFTAddress, info.market, signatureWalletAddress],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 7,
    },
  );

  await kolNFTClaim.waitForDeployment();

  console.log(`KolNFTClaim deployed to ${kolNFTClaim.target}`);

  expect(kolNFTClaimAddress).eq(kolNFTClaim.target);

  console.log("check ...");

  const KolNFTClaimCon = await ethers.getContractAt("KolNFTClaim", kolNFTClaimAddress);

  expect(await KolNFTClaimCon.kol()).eq(kolAddress);
  expect(await KolNFTClaimCon.publicNFT()).eq(kolPublicNFTAddress);
  expect(await KolNFTClaimCon.signatureAddress()).eq(signatureWalletAddress);
  expect(await KolNFTClaimCon.owner()).eq(deployWallet.address);
  expect(await KolNFTClaimCon.payToken()).eq(payTokenAddress);
  expect(await KolNFTClaimCon.market()).eq(info.market);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
