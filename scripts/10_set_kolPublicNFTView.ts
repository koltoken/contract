import { ethers } from "hardhat";
import { expect } from "chai";

import { kolPublicNFTViewAddress, kolPublicNFTAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const publicNFT = await ethers.getContractAt("PublicNFT", kolPublicNFTAddress);

  const a = await publicNFT.setPublicNFTView(kolPublicNFTViewAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 10,
  });
  const result = await a.wait();

  console.log(`publicNFT setPublicNFTView ${kolPublicNFTViewAddress} at ${result?.hash}`);

  expect(await publicNFT.publicNFTView()).eq(kolPublicNFTViewAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
