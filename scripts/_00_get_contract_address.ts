import { ethers } from "hardhat";
import { getAllContractAddress } from "../test/shared/deploy";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];
  const info = await getAllContractAddress(deployWallet);

  let kolPublicNFT = ethers.getCreateAddress({
    from: info.publicNFTFactory,
    nonce: 1,
  });
  let kolMortgageNFT = ethers.getCreateAddress({
    from: info.mortgageNFTFactory,
    nonce: 1,
  });
  let kolMarket = ethers.getCreateAddress({
    from: info.marketFactory,
    nonce: 1,
  });


  let pk: string = process.env.SIGN_PRIVATE_KEY || "";
  if (pk.length === 0) {
    throw new Error("SIGN_PRIVATE_KEY is empty");
  }

  let sign_wallet = new ethers.Wallet(pk, deployWallet.provider)
  let sig_address = sign_wallet.address;

  // todo
  let pmw_address = "";
  let payToken_address = "";
  let KolCurve = ""; // KolCurveERC20 or KolCurve

  const output = {
    appid: 1,
    mortgageFee: 100,
    buySellFee: 1000,
    KolCurve: KolCurve,
    payTokenAddress: payToken_address,
    mortgageFeeWalletAddress: pmw_address,
    kolFundRecipientWalletAddress: pmw_address,
    signatureWalletAddress: sig_address,
    kolOwnerWalletAddress: pmw_address,
    kolNFTClaimOwnerWalletAddress: pmw_address,
    kolAppOwnerWalletAddress: pmw_address,
    foundryOwnerWalletAddress: pmw_address,
    kolPublicNFTOwnerWalletAddress: pmw_address,
    kolMortgageNFTOwnerWalletAddress: pmw_address,
    foundryAddress: info.foundry,
    publicNFTFactoryAddress: info.publicNFTFactory,
    mortgageNFTFactoryAddress: info.mortgageNFTFactory,
    marketFactoryAddress: info.marketFactory,
    kolCurveAddress: info.kolCurve,
    kolAddress: info.kol,
    kolNFTClaimAddress: info.kolNFTClaim,
    kolPublicNFTViewAddress: info.kolPublicNFTView,
    kolMortgageNFTViewAddress: info.kolMortgageNFTView,
    kolPublicNFTAddress: kolPublicNFT,
    kolMortgageNFTAddress: kolMortgageNFT,
    kolMarketAddress: kolMarket,
  };
  console.log("=== params.json start ===");
  console.log(output);
  console.log("=== params.json end ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
