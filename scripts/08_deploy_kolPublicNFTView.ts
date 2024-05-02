import { ethers } from "hardhat";
import { expect } from "chai";

import { appid, foundryAddress, kolNFTClaimAddress, kolPublicNFTViewAddress, kolPublicNFTAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const kolPublicNFTView = await ethers.deployContract(
    "KolPublicNFTView",
    [foundryAddress, appid, kolPublicNFTAddress, kolNFTClaimAddress],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 8,
    },
  );

  await kolPublicNFTView.waitForDeployment();

  console.log(`KolPublicNFTView deployed to ${kolPublicNFTView.target}`);

  expect(kolPublicNFTViewAddress).eq(kolPublicNFTView.target);

  console.log("check ...");

  const kolPublicNFTViewCon = await ethers.getContractAt("KolPublicNFTView", kolPublicNFTViewAddress);

  expect(await kolPublicNFTViewCon.appId()).eq(appid);
  expect(await kolPublicNFTViewCon.foundry()).eq(foundryAddress);
  expect(await kolPublicNFTViewCon.publicNFT()).eq(kolPublicNFTAddress);
  expect(await kolPublicNFTViewCon.kolNFTClaim()).eq(kolNFTClaimAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
