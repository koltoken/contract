import { ethers } from "hardhat";
import config from "./config.json";

async function main() {
    const amount = BigInt(10) ** BigInt(18) * BigInt(100000000000);
    const simpleToken = await ethers.deployContract(
        "SimpleToken",
        [amount],
        {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
        },
    );

    await simpleToken.waitForDeployment();

    console.log(`SimpleToken deployed to ${simpleToken.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
