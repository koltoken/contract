import { ethers } from "hardhat";

import { kolAddress } from "./params.json";
import config from "./config.json";

async function main() {
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let tx_value = BigInt(10) ** BigInt(18) * BigInt(20)
    // 19.999999971818181843 eth
    let multiplyAmount = BigInt(10) ** BigInt(15) * BigInt(645161290)

    let params = {
        info: {
            tid: "1710470758508724224",
            tTwitterName: "KoL_Token",
            cid: "1710470758508724224",
            cTwitterName: "KoL_Token",
            followers: 161,
            omf: "120000000000000000",
        },
        nftPrice: 0,
        deadline: deadline,
        multiplyAmount: multiplyAmount,
    };

    let wallets = await ethers.getSigners();
    let deploy_wallet = wallets[0];

    let pk: string = process.env.SIGN_PRIVATE_KEY || "";

    let sign_wallet = new ethers.Wallet(pk, deploy_wallet.provider)

    let signature = await sign_wallet.signMessage(
        ethers.toBeArray(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    [
                        "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
                        "uint256",
                        "uint256",
                        "address",
                    ],
                    [params.info, params.nftPrice, params.deadline, deploy_wallet.address],
                ),
            ),
        ),
    );

    const kol = await ethers.getContractAt("Kol", kolAddress);
    let tx = await kol
        .connect(deploy_wallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, tx_value, {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
            nonce: config.nonce0 + 12,
            value: tx_value,
        });
    console.log(`tx ${tx.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
