import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

import {
  PublicNFTFactory,
  MortgageNFTFactory,
  MarketFactory,
  Foundry,
  PublicNFT,
  MortgageNFT,
  Market,
  AppOperator,
  SimpleToken,
  KolCurveERC20,
} from "../../typechain-types";
import { getAllContractAddressProxy } from "./deploy_utils";

export type AllContractInfoWithERC20Proxy = {
  wallets: any;
  deployWalletIndex: number;
  deployWallet: HardhatEthersSigner;
  signatureWalletIndex: number;
  signatureWallet: HardhatEthersSigner;
  userWalletIndex: number;
  userWallet: HardhatEthersSigner;
  mortgageFeeWalletIndex: number;
  mortgageFeeWallet: HardhatEthersSigner;
  kolOwnerWalletIndex: number;
  kolOwnerWallet: HardhatEthersSigner;
  kolFundRecipientWalletIndex: number;
  kolFundRecipientWallet: HardhatEthersSigner;
  nextWalletIndex: number;
  mortgageFee: number;
  buySellFee: number;
  appId: number;
  appName: string;

  publicNFTFactory: PublicNFTFactory;
  mortgageNFTFactory: MortgageNFTFactory;
  marketFactory: MarketFactory;
  foundry: Foundry;
  kolCurve: KolCurveERC20;
  publicNFTKol: PublicNFT;
  mortgageNFTKol: MortgageNFT;
  marketKol: Market;
  appOperator: AppOperator;

  simpleToken: SimpleToken;
};


export async function deployAllContractWithERC20Proxy(): Promise<AllContractInfoWithERC20Proxy> {
  let wallets;
  let deployWalletIndex = 0;
  let deployWallet: HardhatEthersSigner;
  let signatureWalletIndex = 1;
  let signatureWallet: HardhatEthersSigner;
  let userWalletIndex = 2;
  let userWallet: HardhatEthersSigner;
  let mortgageFeeWalletIndex = 3;
  let mortgageFeeWallet: HardhatEthersSigner;
  let kolOwnerWalletIndex = 4;
  let kolOwnerWallet: HardhatEthersSigner;
  let kolFundRecipientWalletIndex = 5;
  let kolFundRecipientWallet: HardhatEthersSigner;
  let nextWalletIndex = 6;
  let mortgageFee = 100;
  let buySellFee = 1000;
  let appId = 1;
  let appName = "kol";

  let publicNFTFactory: PublicNFTFactory;
  let mortgageNFTFactory: MortgageNFTFactory;
  let marketFactory: MarketFactory;
  let foundry: Foundry;
  let kolCurve: KolCurveERC20;
  let publicNFTKol: PublicNFT;
  let mortgageNFTKol: MortgageNFT;
  let marketKol: Market;
  let appOperator: AppOperator;
  let simpleToken: SimpleToken;

  wallets = await ethers.getSigners();
  deployWallet = wallets[deployWalletIndex];
  signatureWallet = wallets[signatureWalletIndex];
  userWallet = wallets[userWalletIndex];
  mortgageFeeWallet = wallets[mortgageFeeWalletIndex];
  kolOwnerWallet = wallets[kolOwnerWalletIndex];
  kolFundRecipientWallet = wallets[kolFundRecipientWalletIndex];

  // deploy simple token
  simpleToken = (await (
    await ethers.getContractFactory("SimpleToken")
  ).deploy(
    BigInt(10) ** BigInt(18) * BigInt(100000000000)
  )) as SimpleToken;

  let addressInfo = await getAllContractAddressProxy(deployWallet);
  // deploy foundry
  foundry = (await (
    await ethers.getContractFactory("Foundry")
  ).deploy(
    addressInfo.publicNFTFactory,
    addressInfo.mortgageNFTFactory,
    addressInfo.marketFactory,
    mortgageFee,
    mortgageFeeWallet.address,
  )) as Foundry;

  // deploy publicNFTFactory
  publicNFTFactory = (await (
    await ethers.getContractFactory("PublicNFTFactory")
  ).deploy(await foundry.getAddress())) as PublicNFTFactory;

  // deploy mortgageNFTFactory
  mortgageNFTFactory = (await (
    await ethers.getContractFactory("MortgageNFTFactory")
  ).deploy(await foundry.getAddress())) as MortgageNFTFactory;

  // deploy marketFactory
  marketFactory = (await (
    await ethers.getContractFactory("MarketFactory")
  ).deploy(await foundry.getAddress())) as MarketFactory;

  // deploy kolCurve
  kolCurve = (await (await ethers.getContractFactory("KolCurveERC20")).deploy()) as KolCurveERC20;

  // create proxy app
  await foundry.createApp("proxy", kolOwnerWallet.address, addressInfo.appOperator, await kolCurve.getAddress(), await simpleToken.getAddress(), buySellFee);

  // deploy app
  let info = await foundry.apps(appId);

  publicNFTKol = (await ethers.getContractAt("PublicNFT", info.publicNFT)) as PublicNFT;
  mortgageNFTKol = (await ethers.getContractAt("MortgageNFT", info.mortgageNFT)) as MortgageNFT;
  marketKol = (await ethers.getContractAt("Market", info.market)) as Market;

  appOperator = (await (
    await ethers.getContractFactory("AppOperator")
  ).deploy(
    addressInfo.foundry,
    appId,
    await mortgageNFTKol.getAddress(),
    await marketKol.getAddress()
  )) as AppOperator;

  expect(await foundry.getAddress()).eq(addressInfo.foundry);
  expect(await publicNFTFactory.getAddress()).eq(addressInfo.publicNFTFactory);
  expect(await mortgageNFTFactory.getAddress()).eq(addressInfo.mortgageNFTFactory);
  expect(await marketFactory.getAddress()).eq(addressInfo.marketFactory);
  expect(await kolCurve.getAddress()).eq(addressInfo.kolCurve);
  expect(await appOperator.getAddress()).eq(addressInfo.appOperator);
  return {
    wallets,
    deployWalletIndex,
    deployWallet,
    signatureWalletIndex,
    signatureWallet,
    userWalletIndex,
    userWallet,
    mortgageFeeWalletIndex,
    mortgageFeeWallet,
    kolOwnerWalletIndex,
    kolOwnerWallet,
    kolFundRecipientWalletIndex,
    kolFundRecipientWallet,
    nextWalletIndex,
    mortgageFee,
    buySellFee,
    appId,
    appName,

    publicNFTFactory,
    mortgageNFTFactory,
    marketFactory,
    foundry,
    kolCurve,
    publicNFTKol,
    mortgageNFTKol,
    marketKol,
    appOperator,
    simpleToken,
  };
}
