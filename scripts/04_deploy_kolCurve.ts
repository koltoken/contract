import { ethers } from "hardhat";
import { expect } from "chai";

import { kolCurveAddress, KolCurve } from "./params.json";
import config from "./config.json";

async function main() {
  let KolCurveName = KolCurve
  const curve = await ethers.deployContract(KolCurveName, [], {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 4,
  });

  await curve.waitForDeployment();

  console.log(`${KolCurveName} deployed to ${curve.target}`);

  expect(curve.target).eq(kolCurveAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
