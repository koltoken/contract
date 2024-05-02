import { ethers } from "hardhat";
import { expect } from "chai";

import { kolMortgageNFTViewAddress, kolMortgageNFTAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const mortgageNFT = await ethers.getContractAt("MortgageNFT", kolMortgageNFTAddress);

  const a = await mortgageNFT.setMortgageNFTView(kolMortgageNFTViewAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 11,
  });
  const result = await a.wait();

  console.log(`mortgageNFT setMortgageNFTView ${kolMortgageNFTViewAddress} at ${result?.hash}`);

  expect(await mortgageNFT.mortgageNFTView()).eq(kolMortgageNFTViewAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
