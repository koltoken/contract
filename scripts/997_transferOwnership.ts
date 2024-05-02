import { ethers } from "hardhat";
import { expect } from "chai";

import {
  appid,
  foundryAddress,
  kolOwnerWalletAddress,
  kolNFTClaimOwnerWalletAddress,
  kolAppOwnerWalletAddress,
  foundryOwnerWalletAddress,
  kolPublicNFTOwnerWalletAddress,
  kolMortgageNFTOwnerWalletAddress,
  kolAddress,
  kolNFTClaimAddress,
  kolPublicNFTAddress,
  kolMortgageNFTAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const kol = await ethers.getContractAt("Kol", kolAddress);
  const kolNFTClaim = await ethers.getContractAt("KolNFTClaim", kolNFTClaimAddress);

  // foundry
  const a = await foundry.transferOwnership(foundryOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 13,
  });
  const result = await a.wait();
  console.log(`foundry transferOwnership to ${foundryOwnerWalletAddress} at ${result?.hash}`);

  // kol
  const b = await kol.transferOwnership(kolOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 14,
  });
  const result2 = await b.wait();
  console.log(`kol transferOwnership to ${kolOwnerWalletAddress} at ${result2?.hash}`);

  // // kolNFTClaim
  const c = await kolNFTClaim.transferOwnership(kolNFTClaimOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 15,
  });
  const result3 = await c.wait();
  console.log(`kolNFTClaim transferOwnership to ${kolNFTClaimOwnerWalletAddress} at ${result3?.hash}`);

  // kol app owner
  const d = await foundry.setAppOwner(appid, kolAppOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 16,
  });
  const result4 = await d.wait();
  console.log(`foundry setAppOwner to ${kolAppOwnerWalletAddress} at ${result4?.hash}`);

  // public nft owner
  const publicNFT = await ethers.getContractAt("PublicNFT", kolPublicNFTAddress);
  const e = await publicNFT.transferOwnership(kolPublicNFTOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 17,
  });
  const result5 = await e.wait();
  console.log(`publicNFT transferOwnership to ${kolPublicNFTOwnerWalletAddress} at ${result5?.hash}`);


  // mortgage nft owner
  const mortgageNFT = await ethers.getContractAt("MortgageNFT", kolMortgageNFTAddress);
  const f = await mortgageNFT.transferOwnership(kolMortgageNFTOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 18,
  });
  const result6 = await f.wait();
  console.log(`mortgageNFT transferOwnership to ${kolMortgageNFTOwnerWalletAddress} at ${result6?.hash}`);

  // check
  expect(await foundry.owner()).eq(foundryOwnerWalletAddress);
  expect(await kol.owner()).eq(kolOwnerWalletAddress);
  expect(await kolNFTClaim.owner()).eq(kolNFTClaimOwnerWalletAddress);

  expect(await publicNFT.owner()).eq(kolPublicNFTOwnerWalletAddress);
  expect(await mortgageNFT.owner()).eq(kolMortgageNFTOwnerWalletAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
