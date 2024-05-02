import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress, appid, kolAppOwnerWalletAddress } from "./params.json";

async function main() {
  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const info = await foundry.apps(appid);
  expect(info.owner).eq(kolAppOwnerWalletAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
