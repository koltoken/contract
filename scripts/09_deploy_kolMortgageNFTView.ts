import { ethers } from "hardhat";
import { expect } from "chai";

import {
  appid,
  foundryAddress,
  kolNFTClaimAddress,
  kolMortgageNFTViewAddress,
  kolMortgageNFTAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
  const kolMortgageNFTView = await ethers.deployContract(
    "KolMortgageNFTView",
    [foundryAddress, appid, kolMortgageNFTAddress, kolNFTClaimAddress],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 9,
    },
  );

  await kolMortgageNFTView.waitForDeployment();

  console.log(`KolMortgageNFTView deployed to ${kolMortgageNFTView.target}`);

  expect(kolMortgageNFTViewAddress).eq(kolMortgageNFTView.target);

  console.log("check ...");

  const kolMortgageNFTViewCon = await ethers.getContractAt("KolMortgageNFTView", kolMortgageNFTViewAddress);

  expect(await kolMortgageNFTViewCon.appId()).eq(appid);
  expect(await kolMortgageNFTViewCon.foundry()).eq(foundryAddress);
  expect(await kolMortgageNFTViewCon.mortgageNFT()).eq(kolMortgageNFTAddress);
  expect(await kolMortgageNFTViewCon.kolNFTClaim()).eq(kolNFTClaimAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
