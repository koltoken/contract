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
  Kol,
  KolNFTClaim,
  KolCurve,
  KolMortgageNFTView,
  KolPublicNFTView,
} from "../../typechain-types";
import { getAllContractAddress, ZERO_ADDRESS } from "./deploy_utils";

export type AllContractInfoWithETH = {
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
  kolCurve: KolCurve;
  publicNFTKol: PublicNFT;
  mortgageNFTKol: MortgageNFT;
  marketKol: Market;
  kol: Kol;
  kolNFTClaim: KolNFTClaim;
  kolMortgageNFTView: KolMortgageNFTView;
  kolPublicNFTView: KolPublicNFTView;
};

export async function deployAllContractWithETH(): Promise<AllContractInfoWithETH> {
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
  let kolCurve: KolCurve;
  let publicNFTKol: PublicNFT;
  let mortgageNFTKol: MortgageNFT;
  let marketKol: Market;
  let kol: Kol;
  let kolNFTClaim: KolNFTClaim;
  let kolMortgageNFTView: KolMortgageNFTView;
  let kolPublicNFTView: KolPublicNFTView;

  wallets = await ethers.getSigners();
  deployWallet = wallets[deployWalletIndex];
  signatureWallet = wallets[signatureWalletIndex];
  userWallet = wallets[userWalletIndex];
  mortgageFeeWallet = wallets[mortgageFeeWalletIndex];
  kolOwnerWallet = wallets[kolOwnerWalletIndex];
  kolFundRecipientWallet = wallets[kolFundRecipientWalletIndex];

  let addressInfo = await getAllContractAddress(deployWallet);
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
  kolCurve = (await (await ethers.getContractFactory("KolCurve")).deploy()) as KolCurve;

  // create kol app
  await foundry.createApp("kol", kolOwnerWallet.address, addressInfo.kol, await kolCurve.getAddress(), ZERO_ADDRESS, buySellFee);

  // deploy kol
  let info = await foundry.apps(appId);

  publicNFTKol = (await ethers.getContractAt("PublicNFT", info.publicNFT)) as PublicNFT;
  mortgageNFTKol = (await ethers.getContractAt("MortgageNFT", info.mortgageNFT)) as MortgageNFT;
  marketKol = (await ethers.getContractAt("Market", info.market)) as Market;

  kol = (await (
    await ethers.getContractFactory("Kol")
  ).deploy(
    addressInfo.foundry,
    appId,
    await mortgageNFTKol.getAddress(),
    await marketKol.getAddress(),
    addressInfo.kolNFTClaim,
    kolFundRecipientWallet.address,
    signatureWallet.address,
  )) as Kol;

  // deploy kolNFTClaim
  kolNFTClaim = (await (
    await ethers.getContractFactory("KolNFTClaim")
  ).deploy(await kol.getAddress(), info.publicNFT, info.market, signatureWallet.address)) as KolNFTClaim;

  // deploy kolPublicNFTView
  kolPublicNFTView = (await (
    await ethers.getContractFactory("KolPublicNFTView")
  ).deploy(addressInfo.foundry, appId, info.publicNFT, addressInfo.kolNFTClaim)) as KolPublicNFTView;

  // deploy kolMortgageNFTView
  kolMortgageNFTView = (await (
    await ethers.getContractFactory("KolMortgageNFTView")
  ).deploy(addressInfo.foundry, appId, info.mortgageNFT, addressInfo.kolNFTClaim)) as KolMortgageNFTView;

  expect(await foundry.getAddress()).eq(addressInfo.foundry);
  expect(await publicNFTFactory.getAddress()).eq(addressInfo.publicNFTFactory);
  expect(await mortgageNFTFactory.getAddress()).eq(addressInfo.mortgageNFTFactory);
  expect(await marketFactory.getAddress()).eq(addressInfo.marketFactory);
  expect(await kolCurve.getAddress()).eq(addressInfo.kolCurve);
  expect(await kol.getAddress()).eq(addressInfo.kol);
  expect(await kolNFTClaim.getAddress()).eq(addressInfo.kolNFTClaim);
  expect(await kolPublicNFTView.getAddress()).eq(addressInfo.kolPublicNFTView);
  expect(await kolMortgageNFTView.getAddress()).eq(addressInfo.kolMortgageNFTView);

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
    kol,
    kolNFTClaim,
    kolPublicNFTView,
    kolMortgageNFTView,
  };
}
