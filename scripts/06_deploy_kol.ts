import { ethers } from "hardhat";
import { expect } from "chai";

import {
  appid,
  foundryAddress,
  kolNFTClaimAddress,
  kolFundRecipientWalletAddress,
  signatureWalletAddress,
  kolAddress,
  kolMortgageNFTAddress,
  kolMarketAddress,
  payTokenAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  const kol = await ethers.deployContract(
    "Kol",
    [
      foundryAddress,
      appid,
      kolMortgageNFTAddress,
      kolMarketAddress,
      kolNFTClaimAddress,
      kolFundRecipientWalletAddress,
      signatureWalletAddress,
    ],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 6,
    },
  );

  await kol.waitForDeployment();

  console.log(`Kol deployed to ${kol.target}`);

  expect(kol.target).eq(kolAddress);

  console.log("check ...");

  const kolCon = await ethers.getContractAt("Kol", kolAddress);

  expect(await kolCon.appId()).eq(appid);
  expect(await kolCon.foundry()).eq(foundryAddress);
  expect(await kolCon.market()).eq(kolMarketAddress);
  expect(await kolCon.mortgageNFT()).eq(kolMortgageNFTAddress);
  expect(await kolCon.kolNFTClaim()).eq(kolNFTClaimAddress);
  expect(await kolCon.fundRecipient()).eq(kolFundRecipientWalletAddress);
  expect(await kolCon.signatureAddress()).eq(signatureWalletAddress);
  expect(await kolCon.payToken()).eq(payTokenAddress);

  expect(await kolCon.owner()).eq(deployWallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
