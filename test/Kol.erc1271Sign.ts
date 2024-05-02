import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { ERC1271 } from "../typechain-types";

async function getSignature(signatureWallet: any, params: any, sender: any) {
    return await signatureWallet.signMessage(
        ethers.toBeArray(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    [
                        "tuple(string tid, string tTwitterName, string cid, string cTwitterName, uint256 followers, uint256 omf)",
                        "uint256",
                        "uint256",
                        "address",
                    ],
                    [params.info, params.nftPrice, params.deadline, sender.address],
                ),
            ),
        ),
    );
}

describe("Kol.erc1271Sign", function () {
    it("deploy", async function () {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.eth;

        expect(await info.kol.appId()).eq(info.appId);
        expect(await info.kol.foundry()).eq(await info.foundry.getAddress());
        expect(await info.kol.kolNFTClaim()).eq(await info.kolNFTClaim.getAddress());
        expect(await info.kol.market()).eq(await info.marketKol.getAddress());
        expect(await info.kol.mortgageNFT()).eq(await info.mortgageNFTKol.getAddress());
        expect(await info.kol.fundRecipient()).eq(info.kolFundRecipientWallet.address);
        expect(await info.kol.owner()).eq(info.deployWallet.address);
        expect(await info.kol.signatureAddress()).eq(info.signatureWallet.address);
    });

    it("createToken ERC1271 sign", async function () {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.eth;
        expect(await info.kol.owner()).eq(info.deployWallet.address);

        // deploy erc1271
        let erc1271 = (await (
            await ethers.getContractFactory("ERC1271")
        ).deploy()) as ERC1271;

        await info.kol.connect(info.deployWallet).setSignatureAddress(await erc1271.getAddress());
        expect(await info.kol.signatureAddress()).eq(await erc1271.getAddress());

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60;

        let params = {
            info: {
                tid: "t6",
                tTwitterName: "xxxx",
                cid: "b",
                cTwitterName: "xxxx",
                followers: 123,
                omf: 2212,
            },
            nftPrice: 123,
            deadline: deadline,
        };
        let signature = await getSignature(info.signatureWallet, params, info.deployWallet);

        await expect(
            info.kol
                .connect(info.deployWallet)
                .createToken(params.info, params.nftPrice, params.deadline, signature, { value: params.nftPrice }),
        ).revertedWith("VSE");

        await erc1271.addCreateTokenSignature(params.info, params.nftPrice, params.deadline, info.deployWallet.address, signature);

        await info.kol.connect(info.deployWallet).createToken(params.info, params.nftPrice, params.deadline, signature, { value: params.nftPrice });
    });

    it("createTokenAndMultiply ERC1271 sign", async function () {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.eth;
        expect(await info.kol.owner()).eq(info.deployWallet.address);

        // deploy erc1271
        let erc1271 = (await (
            await ethers.getContractFactory("ERC1271")
        ).deploy()) as ERC1271;

        await info.kol.connect(info.deployWallet).setSignatureAddress(await erc1271.getAddress());
        expect(await info.kol.signatureAddress()).eq(await erc1271.getAddress());

        let bigNumber = BigInt(10 ** 19);

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60;

        let params = {
            info: {
                tid: "t6",
                tTwitterName: "xxxx",
                cid: "b",
                cTwitterName: "xxxx",
                followers: 123,
                omf: 2212,
            },
            nftPrice: 1000,
            deadline: deadline,
            multiplyAmount: 100,
        };
        let signature = await getSignature(info.signatureWallet, params, info.deployWallet);

        await expect(
            info.kol
                .connect(info.deployWallet)
                .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0, {
                    value: bigNumber,
                }),
        ).revertedWith("VSE");

        await erc1271.addCreateTokenSignature(params.info, params.nftPrice, params.deadline, info.deployWallet.address, signature);

        await info.kol.connect(info.deployWallet).createTokenAndMultiply(
            params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, 0,
            { value: bigNumber }
        );


    });
});
