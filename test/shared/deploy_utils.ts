import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

async function getContractAddress(sender: string, nonce: number) {
    console.log("sender ", sender);
    console.log("nonce ", nonce);
    return ethers.getCreateAddress({
        from: sender,
        nonce: nonce,
    });
}

export type AllContractAddressInfo = {
    foundry: string;
    publicNFTFactory: string;
    mortgageNFTFactory: string;
    marketFactory: string;
    kolCurve: string;
    kol: string;
    kolNFTClaim: string;
    kolPublicNFTView: string;
    kolMortgageNFTView: string;
};

export async function getAllContractAddress(deployWallet: HardhatEthersSigner): Promise<AllContractAddressInfo> {
    const nextNoice = await deployWallet.getNonce();

    // deploy foundry 0
    // deploy publicNFTFactory 1
    // deploy mortgageNFTFactory 2
    // deploy marketFactory 3
    // deploy kolCurve 4
    // create kol app 5
    // deploy kol 6
    // deploy kolNFTClaim 7
    // deploy kolPublicNFTView 8
    // deploy kolMortgageNFTView 9
    const foundry = await getContractAddress(deployWallet.address, nextNoice);
    const publicNFTFactory = await getContractAddress(deployWallet.address, nextNoice + 1);
    const mortgageNFTFactory = await getContractAddress(deployWallet.address, nextNoice + 2);
    const marketFactory = await getContractAddress(deployWallet.address, nextNoice + 3);
    const kolCurve = await getContractAddress(deployWallet.address, nextNoice + 4);
    const kol = await getContractAddress(deployWallet.address, nextNoice + 6);
    const kolNFTClaim = await getContractAddress(deployWallet.address, nextNoice + 7);
    const kolPublicNFTView = await getContractAddress(deployWallet.address, nextNoice + 8);
    const kolMortgageNFTView = await getContractAddress(deployWallet.address, nextNoice + 9);
    return {
        foundry: foundry,
        publicNFTFactory: publicNFTFactory,
        mortgageNFTFactory: mortgageNFTFactory,
        marketFactory: marketFactory,
        kolCurve: kolCurve,
        kol: kol,
        kolNFTClaim: kolNFTClaim,
        kolPublicNFTView: kolPublicNFTView,
        kolMortgageNFTView: kolMortgageNFTView,
    };
}


export type AllContractAddressInfoProxy = {
    foundry: string;
    publicNFTFactory: string;
    mortgageNFTFactory: string;
    marketFactory: string;
    kolCurve: string;
    appOperator: string;
};

export async function getAllContractAddressProxy(deployWallet: HardhatEthersSigner): Promise<AllContractAddressInfoProxy> {
    const nextNoice = await deployWallet.getNonce();

    // deploy foundry 0
    // deploy publicNFTFactory 1
    // deploy mortgageNFTFactory 2
    // deploy marketFactory 3
    // deploy kolCurve 4
    // create kol app 5
    // deploy appOperator 6
    const foundry = await getContractAddress(deployWallet.address, nextNoice);
    const publicNFTFactory = await getContractAddress(deployWallet.address, nextNoice + 1);
    const mortgageNFTFactory = await getContractAddress(deployWallet.address, nextNoice + 2);
    const marketFactory = await getContractAddress(deployWallet.address, nextNoice + 3);
    const kolCurve = await getContractAddress(deployWallet.address, nextNoice + 4);
    const appOperator = await getContractAddress(deployWallet.address, nextNoice + 6);

    return {
        foundry: foundry,
        publicNFTFactory: publicNFTFactory,
        mortgageNFTFactory: mortgageNFTFactory,
        marketFactory: marketFactory,
        kolCurve: kolCurve,
        appOperator: appOperator,
    };
}
