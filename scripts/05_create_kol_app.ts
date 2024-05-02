import { ethers } from "hardhat";
import { expect } from "chai";

import {
  foundryAddress,
  kolAddress,
  buySellFee,
  payTokenAddress,
  kolCurveAddress,
  appid,
  kolPublicNFTAddress,
  kolMortgageNFTAddress,
  kolMarketAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const a = await foundry.createApp("kol", deployWallet.address, kolAddress, kolCurveAddress, payTokenAddress, buySellFee, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 5,
  });
  const result = await a.wait();

  console.log(`foundry createApp at ${result?.hash}`);

  const appInfo = await foundry.apps(appid);
  expect(appInfo.operator).eq(kolAddress);
  expect(appInfo.owner).eq(deployWallet.address);
  expect(appInfo.publicNFT).eq(kolPublicNFTAddress);
  expect(appInfo.mortgageNFT).eq(kolMortgageNFTAddress);
  expect(appInfo.market).eq(kolMarketAddress);

  const publicNFT = await ethers.getContractAt("PublicNFT", appInfo.publicNFT);
  expect(await publicNFT.foundry()).eq(foundryAddress);
  expect(await publicNFT.appId()).eq(appid);

  const mortgageNFT = await ethers.getContractAt("MortgageNFT", appInfo.mortgageNFT);
  expect(await mortgageNFT.foundry()).eq(foundryAddress);
  expect(await mortgageNFT.appId()).eq(appid);
  expect(await mortgageNFT.market()).eq(appInfo.market);

  const market = await ethers.getContractAt("Market", appInfo.market);
  expect(await market.feeDenominator()).eq(await foundry.FEE_DENOMINATOR());
  expect(await market.totalPercent()).eq(await foundry.TOTAL_PERCENT());
  expect(await market.foundry()).eq(foundryAddress);
  expect(await market.appId()).eq(appid);
  expect(await market.payToken()).eq(payTokenAddress);
  expect(await market.publicNFT()).eq(appInfo.publicNFT);
  expect(await market.mortgageNFT()).eq(appInfo.mortgageNFT);
  expect(await market.buySellFee()).eq(buySellFee);

  let curve = await market.curve();
  expect(curve).eq(kolCurveAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
