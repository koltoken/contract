import { ZERO_ADDRESS, deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei } from "./shared/utils";

describe("Market", function () {
  describe("mortgageAndRedeem.erc20.proxy", function () {
    it("mortgage revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      // mortgage not tid
      await expect(info.appOperator.connect(user1).mortgage("t123", getTokenAmountWei(1))).revertedWith("TE");
      // mortgage user not have
      await expect(info.appOperator.connect(user1).mortgage(params.tid, getTokenAmountWei(1))).revertedWith("TAE");
      // mortgage amount 0
      await expect(info.appOperator.connect(user1).mortgage(params.tid, 0)).revertedWith("TAE");
      // mortgage user not enough
      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(21))
      await info.appOperator.connect(user1).buy(params.tid, getTokenAmountWei(1000), BigInt(10) ** BigInt(21));
      await expect(info.appOperator.connect(user1).mortgage(params.tid, getTokenAmountWei(1001))).revertedWith("TAE");
    });

    it("mortgageAdd revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];
      let user3 = info.wallets[info.nextWalletIndex + 5];
      let user4 = info.wallets[info.nextWalletIndex + 6];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(21))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(21))
      await info.simpleToken.transfer(user3.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user3).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(21))
      await info.simpleToken.transfer(user4.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user4).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(21))

      // mortgageAdd not tokenid
      await expect(info.appOperator.connect(user1).mortgageAdd(0, 1)).revertedWith("ERC721: invalid token ID");
      await expect(info.appOperator.connect(user1).mortgageAdd(1, 1)).revertedWith("ERC721: invalid token ID");

      // mortgageAdd deleted tokenid
      await info.appOperator.connect(user1).buy(params.tid, 1000, BigInt(10) ** BigInt(20));
      await info.appOperator.connect(user1).mortgage(params.tid, 1000);
      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      await info.appOperator.connect(user1).redeem(1, 1000, BigInt(10) ** BigInt(20));
      await expect(info.mortgageNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      await expect(info.appOperator.connect(user1).mortgageAdd(1, 1)).revertedWith("ERC721: invalid token ID");

      // mortgageAdd other user tokenid
      await info.appOperator.connect(user2).buy(params.tid, 1000, BigInt(10) ** BigInt(20));
      await info.appOperator.connect(user2).mortgage(params.tid, 1000);
      expect(await info.mortgageNFTKol.ownerOf(2)).eq(user2.address);
      await info.appOperator.connect(user1).buy(params.tid, 1000, BigInt(10) ** BigInt(20));
      await expect(info.appOperator.connect(user1).mortgageAdd(2, 1)).revertedWith("AOE");

      // mortgageAdd user not have
      await info.appOperator.connect(user3).buy(params.tid, 1000, BigInt(10) ** BigInt(20));
      await info.appOperator.connect(user3).mortgage(params.tid, 1000);
      expect(await info.mortgageNFTKol.ownerOf(3)).eq(user3.address);
      await expect(info.appOperator.connect(user3).mortgageAdd(3, 1)).revertedWith("TAE");

      // mortgageAdd user not enough
      await info.appOperator.connect(user4).buy(params.tid, 1001, BigInt(10) ** BigInt(20));
      await info.appOperator.connect(user4).mortgage(params.tid, 1000);
      expect(await info.mortgageNFTKol.ownerOf(4)).eq(user4.address);
      await expect(info.appOperator.connect(user4).mortgageAdd(4, 2)).revertedWith("TAE");

      // mortgageAdd 0
      await expect(info.appOperator.connect(user4).mortgageAdd(4, 0)).revertedWith("TAE");
    });

    it("redeem revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(21))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(21))

      // redeem not tokenid
      await expect(info.appOperator.connect(user1).redeem(0, 1, BigInt(10) ** BigInt(20))).revertedWith("ERC721: invalid token ID");
      await expect(info.appOperator.connect(user1).redeem(1, 1, BigInt(10) ** BigInt(20))).revertedWith("ERC721: invalid token ID");

      // redeem deleted tokenid
      await info.appOperator.connect(user1).buy(params.tid, 1000, BigInt(10) ** BigInt(20));
      await info.appOperator.connect(user1).mortgage(params.tid, 1000);
      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      await info.appOperator.connect(user1).redeem(1, 1000, BigInt(10) ** BigInt(20));
      await expect(info.mortgageNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      await expect(info.appOperator.connect(user1).redeem(1, 1, BigInt(10) ** BigInt(20))).revertedWith("ERC721: invalid token ID");

      // redeem other user tokenid
      await info.appOperator.connect(user2).buy(params.tid, 1000, BigInt(10) ** BigInt(20));
      await info.appOperator.connect(user2).mortgage(params.tid, 1000);
      expect(await info.mortgageNFTKol.ownerOf(2)).eq(user2.address);
      await expect(info.appOperator.connect(user1).redeem(2, 1, BigInt(10) ** BigInt(20))).revertedWith("AOE");

      // redeem not enough
      await expect(info.appOperator.connect(user2).redeem(2, 2000, BigInt(10) ** BigInt(20))).revertedWith(
        "TAE",
      );

      // redeem 0
      await expect(info.appOperator.connect(user2).redeem(2, 0, BigInt(10) ** BigInt(20))).revertedWith("TAE");
    });

    it("mortgage and mortgageAdd", async function () {
      // create t1 t2 token
      // user1 buy 100000 t1 and 300000 t2
      // user2 buy 300000 t1 and 600000 t2
      // user1 mortgage 1000 t1  tokenid=1
      // user1 mortgage 2000 t2  tokenid=1
      // user2 mortgage 2000 t1  tokenid=2
      // user2 mortgage 4000 t2  tokenid=2
      // user1 mortgage 1000 t1  tokenid=3
      // user1 mortgage 2000 t2  tokenid=3
      // user2 mortgage 2000 t1  tokenid=4
      // user2 mortgage 4000 t2  tokenid=4
      // user1 mortgageAdd tokenid=1 1000 t1
      // user1 mortgageAdd tokenid=1 1000 t1

      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwnerT1_1.address,
        onftOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cnftOwner,
          paramsT1.onftOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cnftOwner: nftOwnerT2_1.address,
        onftOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cnftOwner,
          paramsT2.onftOwner,
        );

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(26))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(26))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(26))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(26))

      // user1 buy 100000 t1 and 300000 t2
      await info.appOperator
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(100000), BigInt(10) ** BigInt(25));
      await info.appOperator
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(300000), BigInt(10) ** BigInt(25));
      // user2 buy 300000 t1 and 600000 t2
      await info.appOperator
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(300000), BigInt(10) ** BigInt(25));
      await info.appOperator
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(600000), BigInt(10) ** BigInt(25));

      let buyT1 = getTokenAmountWei(400000);
      let buyT2 = getTokenAmountWei(900000);

      let nftOwnerT1_1_PayToken = await info.simpleToken.balanceOf(nftOwnerT1_1);
      let nftOwnerT1_2_PayToken = await info.simpleToken.balanceOf(nftOwnerT1_2);
      let nftOwnerT2_1_PayToken = await info.simpleToken.balanceOf(nftOwnerT2_1);
      let nftOwnerT2_2_PayToken = await info.simpleToken.balanceOf(nftOwnerT2_2);


      // check totalSupply
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      let marketKolT1_1 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_1 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_1 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_1 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_1 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_1 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_1 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_1 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_1 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_1 = await info.simpleToken.balanceOf(user2.address);

      // user1 mortgage 1000 t1  tokenid=1
      await info.appOperator.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(1000));

      let marketKolT1_2 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_2 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_2 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_2 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_2 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_2 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_2 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_2 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_2 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_2 = await info.simpleToken.balanceOf(user2.address);

      let curve_1 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(1000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000));

      expect(marketKolT1_2).eq(marketKolT1_1 + getTokenAmountWei(BigInt(1000)));
      expect(marketKolT2_2).eq(marketKolT2_1);

      expect(user1_T1_2).eq(user1_T1_1 - getTokenAmountWei(BigInt(1000)));
      expect(user2_T1_2).eq(user2_T1_1);
      expect(user1_T2_2).eq(user1_T2_1);
      expect(user2_T2_2).eq(user2_T2_1);

      // payToken change
      let user1_PayToken_Add_1 = user1_PayToken_2 - user1_PayToken_1;
      expect(user1_PayToken_Add_1).gt(0);

      expect(user2_PayToken_2).eq(user2_PayToken_1);

      let mortgageFee_PayToken_Add_1 = mortgageFee_PayToken_2 - mortgageFee_PayToken_1;
      expect(mortgageFee_PayToken_Add_1).gt(0);

      expect(curve_1 / mortgageFee_PayToken_Add_1).eq(1000);
      expect(user1_PayToken_Add_1 + mortgageFee_PayToken_Add_1)
        .eq(marketKol_PayToken_1 - marketKol_PayToken_2)
        .eq(curve_1);

      // user1 mortgage 2000 t2  tokenid=2
      await info.appOperator.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(2000));

      let marketKolT1_3 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_3 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_3 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_3 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_3 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_3 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_3 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_3 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_3 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_3 = await info.simpleToken.balanceOf(user2.address);

      let curve_2 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(2000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));

      expect(marketKolT1_3).eq(marketKolT1_2);
      expect(marketKolT2_3).eq(marketKolT2_2 + getTokenAmountWei(BigInt(2000)));

      expect(user1_T1_3).eq(user1_T1_2);
      expect(user2_T1_3).eq(user2_T1_2);
      expect(user1_T2_3).eq(user1_T2_2 - getTokenAmountWei(BigInt(2000)));
      expect(user2_T2_3).eq(user2_T2_2);

      // payToken change
      let user1_PayToken_Add_2 = user1_PayToken_3 - user1_PayToken_2;
      expect(user1_PayToken_Add_2).gt(0);

      expect(user2_PayToken_3).eq(user2_PayToken_2);

      let mortgageFee_PayToken_Add_2 = mortgageFee_PayToken_3 - mortgageFee_PayToken_2;
      expect(mortgageFee_PayToken_Add_2).gt(0);

      expect(curve_2 / mortgageFee_PayToken_Add_2).eq(1000);
      expect(user1_PayToken_Add_2 + mortgageFee_PayToken_Add_2)
        .eq(marketKol_PayToken_2 - marketKol_PayToken_3)
        .eq(curve_2);

      // user2 mortgage 2000 t1  tokenid=3
      await info.appOperator.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(2000));

      let marketKolT1_4 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_4 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_4 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_4 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_4 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_4 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_4 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_4 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_4 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_4 = await info.simpleToken.balanceOf(user2.address);

      let curve_3 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(2000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(2000));

      expect(marketKolT1_4).eq(marketKolT1_3 + getTokenAmountWei(BigInt(2000)));
      expect(marketKolT2_4).eq(marketKolT2_3);

      expect(user1_T1_4).eq(user1_T1_3);
      expect(user2_T1_4).eq(user2_T1_3 - getTokenAmountWei(BigInt(2000)));
      expect(user1_T2_4).eq(user1_T2_3);
      expect(user2_T2_4).eq(user2_T2_3);

      // payToken change
      expect(user1_PayToken_4).eq(user1_PayToken_3);

      let user2_PayToken_Add_3 = user2_PayToken_4 - user2_PayToken_3;
      expect(user2_PayToken_Add_3).gt(0);

      let mortgageFee_PayToken_Add_3 = mortgageFee_PayToken_4 - mortgageFee_PayToken_3;
      expect(mortgageFee_PayToken_Add_3).gt(0);

      expect(curve_3 / mortgageFee_PayToken_Add_3).eq(1000);
      expect(user2_PayToken_Add_3 + mortgageFee_PayToken_Add_3)
        .eq(marketKol_PayToken_3 - marketKol_PayToken_4)
        .eq(curve_3);

      // user2 mortgage 4000 t2  tokenid=4
      await info.appOperator.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(4000));

      let marketKolT1_5 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_5 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_5 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_5 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_5 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_5 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_5 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_5 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_5 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_5 = await info.simpleToken.balanceOf(user2.address);

      let curve_4 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(4000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(4000));

      expect(marketKolT1_5).eq(marketKolT1_4);
      expect(marketKolT2_5).eq(marketKolT2_4 + getTokenAmountWei(BigInt(4000)));

      expect(user1_T1_5).eq(user1_T1_4);
      expect(user2_T1_5).eq(user2_T1_4);
      expect(user1_T2_5).eq(user1_T2_4);
      expect(user2_T2_5).eq(user2_T2_4 - getTokenAmountWei(BigInt(4000)));

      // payToken change
      expect(user1_PayToken_5).eq(user1_PayToken_4);

      let user2_PayToken_Add_4 = user2_PayToken_5 - user2_PayToken_4;
      expect(user2_PayToken_Add_4).gt(0);

      let mortgageFee_PayToken_Add_4 = mortgageFee_PayToken_5 - mortgageFee_PayToken_4;
      expect(mortgageFee_PayToken_Add_4).gt(0);

      expect(curve_4 / mortgageFee_PayToken_Add_4).eq(1000);
      expect(user2_PayToken_Add_4 + mortgageFee_PayToken_Add_4)
        .eq(marketKol_PayToken_4 - marketKol_PayToken_5)
        .eq(curve_4);

      // user1 mortgage 1000 t1  tokenid=5
      await info.appOperator.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(1000));

      let marketKolT1_6 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_6 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_6 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_6 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_6 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_6 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_6 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_6 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_6 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_6 = await info.simpleToken.balanceOf(user2.address);

      let curve_5 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(1000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(4000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(1000));

      expect(marketKolT1_6).eq(marketKolT1_5 + getTokenAmountWei(BigInt(1000)));
      expect(marketKolT2_6).eq(marketKolT2_5);

      expect(user1_T1_6).eq(user1_T1_5 - getTokenAmountWei(BigInt(1000)));
      expect(user2_T1_6).eq(user2_T1_5);
      expect(user1_T2_6).eq(user1_T2_5);
      expect(user2_T2_6).eq(user2_T2_5);

      // payToken change
      let user1_PayToken_Add_5 = user1_PayToken_6 - user1_PayToken_5;
      expect(user1_PayToken_Add_5).gt(0);

      expect(user2_PayToken_6).eq(user2_PayToken_5);

      let mortgageFee_PayToken_Add_5 = mortgageFee_PayToken_6 - mortgageFee_PayToken_5;
      expect(mortgageFee_PayToken_Add_5).gt(0);

      expect(curve_5 / mortgageFee_PayToken_Add_5).eq(1000);
      expect(user1_PayToken_Add_5 + mortgageFee_PayToken_Add_5)
        .eq(marketKol_PayToken_5 - marketKol_PayToken_6)
        .eq(curve_5);

      // user1 mortgage 2000 t2  tokenid=6
      await info.appOperator.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(2000));

      let marketKolT1_7 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_7 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_7 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_7 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_7 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_7 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_7 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_7 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_7 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_7 = await info.simpleToken.balanceOf(user2.address);

      let curve_6 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(2000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(4000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(2000));

      expect(marketKolT1_7).eq(marketKolT1_6);
      expect(marketKolT2_7).eq(marketKolT2_6 + getTokenAmountWei(BigInt(2000)));

      expect(user1_T1_7).eq(user1_T1_6);
      expect(user2_T1_7).eq(user2_T1_6);
      expect(user1_T2_7).eq(user1_T2_6 - getTokenAmountWei(BigInt(2000)));
      expect(user2_T2_7).eq(user2_T2_6);

      // payToken change
      let user1_PayToken_Add_6 = user1_PayToken_7 - user1_PayToken_6;
      expect(user1_PayToken_Add_6).gt(0);

      expect(user2_PayToken_7).eq(user2_PayToken_6);

      let mortgageFee_PayToken_Add_6 = mortgageFee_PayToken_7 - mortgageFee_PayToken_6;
      expect(mortgageFee_PayToken_Add_6).gt(0);

      expect(curve_6 / mortgageFee_PayToken_Add_6).eq(1000);
      expect(user1_PayToken_Add_6 + mortgageFee_PayToken_Add_6)
        .eq(marketKol_PayToken_6 - marketKol_PayToken_7)
        .eq(curve_6);

      // user2 mortgage 2000 t1  tokenid=7
      await info.appOperator.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(2000));

      let marketKolT1_8 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_8 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_8 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_8 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_8 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_8 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_8 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_8 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_8 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_8 = await info.simpleToken.balanceOf(user2.address);

      let curve_7 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(2000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(4000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(2000));

      expect(marketKolT1_8).eq(marketKolT1_7 + getTokenAmountWei(BigInt(2000)));
      expect(marketKolT2_8).eq(marketKolT2_7);

      expect(user1_T1_8).eq(user1_T1_7);
      expect(user2_T1_8).eq(user2_T1_7 - getTokenAmountWei(BigInt(2000)));
      expect(user1_T2_8).eq(user1_T2_7);
      expect(user2_T2_8).eq(user2_T2_7);

      // payToken change
      expect(user1_PayToken_8).eq(user1_PayToken_7);

      let user2_PayToken_Add_7 = user2_PayToken_8 - user2_PayToken_7;
      expect(user2_PayToken_Add_7).gt(0);

      let mortgageFee_PayToken_Add_7 = mortgageFee_PayToken_8 - mortgageFee_PayToken_7;
      expect(mortgageFee_PayToken_Add_7).gt(0);

      expect(curve_7 / mortgageFee_PayToken_Add_7).eq(1000);
      expect(user2_PayToken_Add_7 + mortgageFee_PayToken_Add_7)
        .eq(marketKol_PayToken_7 - marketKol_PayToken_8)
        .eq(curve_7);

      // user2 mortgage 4000 t2  tokenid=8
      await info.appOperator.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(4000));

      let marketKolT1_9 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_9 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_9 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_9 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_9 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_9 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_9 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_9 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_9 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_9 = await info.simpleToken.balanceOf(user2.address);

      let curve_8 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(4000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(4000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(4000));

      expect(marketKolT1_9).eq(marketKolT1_8);
      expect(marketKolT2_9).eq(marketKolT2_8 + getTokenAmountWei(BigInt(4000)));

      expect(user1_T1_9).eq(user1_T1_8);
      expect(user2_T1_9).eq(user2_T1_8);
      expect(user1_T2_9).eq(user1_T2_8);
      expect(user2_T2_9).eq(user2_T2_8 - getTokenAmountWei(BigInt(4000)));

      // payToken change
      expect(user1_PayToken_9).eq(user1_PayToken_8);

      let user2_PayToken_Add_8 = user2_PayToken_9 - user2_PayToken_8;
      expect(user2_PayToken_Add_8).gt(0);

      let mortgageFee_PayToken_Add_8 = mortgageFee_PayToken_9 - mortgageFee_PayToken_8;
      expect(mortgageFee_PayToken_Add_8).gt(0);

      expect(curve_8 / mortgageFee_PayToken_Add_8).eq(1000);
      expect(user2_PayToken_Add_8 + mortgageFee_PayToken_Add_8)
        .eq(marketKol_PayToken_8 - marketKol_PayToken_9)
        .eq(curve_8);

      // user1 mortgageAdd tokenid=1 1000 t1
      await info.appOperator.connect(user1).mortgageAdd(1, getTokenAmountWei(1000));

      let marketKolT1_10 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_10 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_10 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_10 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_10 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_10 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_10 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_10 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_10 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_10 = await info.simpleToken.balanceOf(user2.address);

      let curve_9 = await info.marketKol.getPayTokenAmount(getTokenAmountWei(1000), getTokenAmountWei(1000));

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(1000) + getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(4000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(4000));

      expect(marketKolT1_10).eq(marketKolT1_9 + getTokenAmountWei(BigInt(1000)));
      expect(marketKolT2_10).eq(marketKolT2_9);

      expect(user1_T1_10).eq(user1_T1_9 - getTokenAmountWei(BigInt(1000)));
      expect(user2_T1_10).eq(user2_T1_9);
      expect(user1_T2_10).eq(user1_T2_9);
      expect(user2_T2_10).eq(user2_T2_9);

      // payToken change
      let user1_PayToken_Add_9 = user1_PayToken_10 - user1_PayToken_9;
      expect(user1_PayToken_Add_9).gt(0);

      expect(user2_PayToken_10).eq(user2_PayToken_9);

      let mortgageFee_PayToken_Add_9 = mortgageFee_PayToken_10 - mortgageFee_PayToken_9;
      expect(mortgageFee_PayToken_Add_9).gt(0);

      expect(curve_9 / mortgageFee_PayToken_Add_9).eq(1000);
      expect(user1_PayToken_Add_9 + mortgageFee_PayToken_Add_9)
        .eq(marketKol_PayToken_9 - marketKol_PayToken_10)
        .eq(curve_9);

      // user1 mortgageAdd tokenid=1 1000 t1
      await info.appOperator.connect(user1).mortgageAdd(1, getTokenAmountWei(1000));

      let marketKolT1_11 = await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress());
      let marketKolT2_11 = await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress());

      let user1_T1_11 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user2_T1_11 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user1_T2_11 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_T2_11 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let marketKol_PayToken_11 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());
      let mortgageFee_PayToken_11 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let user1_PayToken_11 = await info.simpleToken.balanceOf(user1.address);
      let user2_PayToken_11 = await info.simpleToken.balanceOf(user2.address);

      let curve_10 = await info.marketKol.getPayTokenAmount(
        getTokenAmountWei(1000) + getTokenAmountWei(1000),
        getTokenAmountWei(1000),
      );

      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(buyT1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(buyT2);

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_PayToken);

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(
        getTokenAmountWei(1000) + getTokenAmountWei(1000) + getTokenAmountWei(1000),
      );
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(4000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(2000));
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(4000));

      expect(marketKolT1_11).eq(marketKolT1_10 + getTokenAmountWei(BigInt(1000)));
      expect(marketKolT2_11).eq(marketKolT2_10);

      expect(user1_T1_11).eq(user1_T1_10 - getTokenAmountWei(BigInt(1000)));
      expect(user2_T1_11).eq(user2_T1_10);
      expect(user1_T2_11).eq(user1_T2_10);
      expect(user2_T2_11).eq(user2_T2_10);

      // payToken change
      let user1_PayToken_Add_10 = user1_PayToken_11 - user1_PayToken_10;
      expect(user1_PayToken_Add_10).gt(0);

      expect(user2_PayToken_11).eq(user2_PayToken_10);

      let mortgageFee_PayToken_Add_10 = mortgageFee_PayToken_11 - mortgageFee_PayToken_10;
      expect(mortgageFee_PayToken_Add_10).gt(0);

      expect(curve_10 / mortgageFee_PayToken_Add_10).eq(1000);
      expect(user1_PayToken_Add_10 + mortgageFee_PayToken_Add_10)
        .eq(marketKol_PayToken_10 - marketKol_PayToken_11)
        .eq(curve_10);
    });

    it("redeem", async function () {
      // create t1 t2 token
      // user1 buy and mortgage 10000 t1 token=1
      // user1 buy and mortgage 20000 t1 token=2
      // user1 buy and mortgage 30000 t2 token=3
      // user1 buy and mortgage 40000 t2 token=4
      // user2 buy and mortgage 15000 t1 token=5
      // user2 buy and mortgage 25000 t1 token=6
      // user2 buy and mortgage 35000 t2 token=7
      // user2 buy and mortgage 45000 t2 token=8
      //
      // user1 redeem  1000 t1 token=1
      // user2 redeem  2000 t2 token=8
      // user1 redeem  9000 t1 token=1 nft removed
      // user2 redeem 43000 t2 token=8 nft removed

      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwnerT1_1.address,
        onftOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cnftOwner,
          paramsT1.onftOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cnftOwner: nftOwnerT2_1.address,
        onftOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cnftOwner,
          paramsT2.onftOwner,
        );

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(27))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(27))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(27))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(27))

      // user1 buy and mortgage 10000 t1 token=1
      await info.appOperator
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));
      // user1 buy and mortgage 20000 t1 token=2
      await info.appOperator
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.appOperator
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.appOperator
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.appOperator
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.appOperator
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.appOperator
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.appOperator
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      let nftOwnerT1_1_PayToken = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_PayToken = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_PayToken = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_PayToken = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_PayToken = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

      let user1_payToken_0 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_0 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_0 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));

      // user1 redeem  1000 t1 token=1
      let redeemPayToken1 = await info.appOperator
        .connect(user1)
        .redeem.staticCall(1, getTokenAmountWei(1000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user1).redeem(1, getTokenAmountWei(1000), redeemPayToken1 * BigInt(2));

      let curve_1 = await info.marketKol.getPayTokenAmount(
        getTokenAmountWei(10000) - getTokenAmountWei(1000),
        getTokenAmountWei(1000),
      );

      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_1 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1.address)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2.address)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1.address)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2.address)).eq(nftOwnerT2_2_PayToken);
      expect(await info.simpleToken.balanceOf(info.mortgageFeeWallet.address)).eq(mortgage_PayToken);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(getTokenAmountWei(1000));
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000),
      );

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000) - getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));

      expect(marketKol_payToken_1 - marketKol_payToken_0)
        .eq(user1_payToken_0 - user1_payToken_1)
        .eq(curve_1)
        .eq(redeemPayToken1);
      expect(user2_payToken_0).eq(user2_payToken_1);

      // user2 redeem  2000 t2 token=8
      let redeemPayToken2 = await info.appOperator
        .connect(user2)
        .redeem.staticCall(8, getTokenAmountWei(2000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user2).redeem(8, getTokenAmountWei(2000), redeemPayToken2 * BigInt(2));

      let curve_2 = await info.marketKol.getPayTokenAmount(
        getTokenAmountWei(45000) - getTokenAmountWei(2000),
        getTokenAmountWei(2000),
      );

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_2 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1.address)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2.address)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1.address)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2.address)).eq(nftOwnerT2_2_PayToken);
      expect(await info.simpleToken.balanceOf(info.mortgageFeeWallet.address)).eq(mortgage_PayToken);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(getTokenAmountWei(1000));
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000),
      );

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(getTokenAmountWei(2000));
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000) - getTokenAmountWei(2000),
      );

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000) - getTokenAmountWei(1000));
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000) - getTokenAmountWei(2000));

      expect(user1_payToken_1).eq(user1_payToken_2);
      expect(marketKol_payToken_2 - marketKol_payToken_1)
        .eq(user2_payToken_1 - user2_payToken_2)
        .eq(curve_2)
        .eq(redeemPayToken2);

      // user1 redeem  9000 t1 token=1 nft removed
      let redeemPayToken3 = await info.appOperator
        .connect(user1)
        .redeem.staticCall(1, getTokenAmountWei(9000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user1).redeem(1, getTokenAmountWei(9000), redeemPayToken3 * BigInt(2));

      let curve_3 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(9000));

      let user1_payToken_3 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_3 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_3 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1.address)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2.address)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1.address)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2.address)).eq(nftOwnerT2_2_PayToken);
      expect(await info.simpleToken.balanceOf(info.mortgageFeeWallet.address)).eq(mortgage_PayToken);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(
        getTokenAmountWei(1000) + getTokenAmountWei(9000),
      );
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
      );

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(getTokenAmountWei(2000));
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000) - getTokenAmountWei(2000),
      );

      expect((await info.mortgageNFTKol.info(1)).tid).eq(""); // removed
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000) - getTokenAmountWei(2000));

      expect(marketKol_payToken_3 - marketKol_payToken_2)
        .eq(user1_payToken_2 - user1_payToken_3)
        .eq(curve_3)
        .eq(redeemPayToken3);
      expect(user2_payToken_2).eq(user2_payToken_3);
      // user2 redeem 43000 t2 token=8 nft removed
      let redeemPayToken4 = await info.appOperator
        .connect(user2)
        .redeem.staticCall(8, getTokenAmountWei(43000), BigInt(10) ** BigInt(25));
      await info.appOperator.connect(user2).redeem(8, getTokenAmountWei(43000), redeemPayToken4 * BigInt(2));

      let curve_4 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(43000));

      let user1_payToken_4 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_4 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_4 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1.address)).eq(nftOwnerT1_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2.address)).eq(nftOwnerT1_2_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1.address)).eq(nftOwnerT2_1_PayToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2.address)).eq(nftOwnerT2_2_PayToken);
      expect(await info.simpleToken.balanceOf(info.mortgageFeeWallet.address)).eq(mortgage_PayToken);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(
        getTokenAmountWei(1000) + getTokenAmountWei(9000),
      );
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
      );

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(
        getTokenAmountWei(2000) + getTokenAmountWei(43000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000) - getTokenAmountWei(2000) - getTokenAmountWei(43000),
      );

      expect((await info.mortgageNFTKol.info(1)).tid).eq(""); // removed
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(""); // removed

      expect((await info.mortgageNFTKol.info(1)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(0);

      expect(user1_payToken_3).eq(user1_payToken_4);
      expect(marketKol_payToken_4 - marketKol_payToken_3)
        .eq(user2_payToken_3 - user2_payToken_4)
        .eq(curve_4)
        .eq(redeemPayToken4);

      // end

      await info.appOperator
        .connect(user1)
        .redeem(2, getTokenAmountWei(20000), BigInt(10) ** BigInt(25));
      await info.appOperator
        .connect(user1)
        .redeem(3, getTokenAmountWei(30000), BigInt(10) ** BigInt(25));
      await info.appOperator
        .connect(user1)
        .redeem(4, getTokenAmountWei(40000), BigInt(10) ** BigInt(25));
      await info.appOperator
        .connect(user2)
        .redeem(5, getTokenAmountWei(15000), BigInt(10) ** BigInt(25));
      await info.appOperator
        .connect(user2)
        .redeem(6, getTokenAmountWei(25000), BigInt(10) ** BigInt(25));
      await info.appOperator
        .connect(user2)
        .redeem(7, getTokenAmountWei(35000), BigInt(10) ** BigInt(25));

      expect((await info.mortgageNFTKol.info(1)).tid).eq("");
      expect((await info.mortgageNFTKol.info(2)).tid).eq("");
      expect((await info.mortgageNFTKol.info(3)).tid).eq("");
      expect((await info.mortgageNFTKol.info(4)).tid).eq("");
      expect((await info.mortgageNFTKol.info(5)).tid).eq("");
      expect((await info.mortgageNFTKol.info(6)).tid).eq("");
      expect((await info.mortgageNFTKol.info(7)).tid).eq("");
      expect((await info.mortgageNFTKol.info(8)).tid).eq("");

      expect((await info.mortgageNFTKol.info(1)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(4)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(6)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(7)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(8)).amount).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(150000))),
      ).eq(await info.simpleToken.balanceOf(await info.marketKol.getAddress()));
    });

    it("redeem refund result and mortgage result and mortgageAdd result", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(26))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(26))

      await info.appOperator
        .connect(user1)
        .buy(params.tid, getTokenAmountWei(2000), BigInt(10) ** BigInt(25));
      let user1PayToken0 = await info.simpleToken.balanceOf(user1.address);

      let mortgageResult_1 = await info.appOperator
        .connect(user1)
        .mortgage.staticCall(params.tid, getTokenAmountWei(1000));
      await info.appOperator.connect(user1).mortgage(params.tid, getTokenAmountWei(1000));

      let user1PayToken1 = await info.simpleToken.balanceOf(user1.address);

      expect(mortgageResult_1.nftTokenId).eq(1);
      expect(user1PayToken1).eq(user1PayToken0 + mortgageResult_1.payTokenAmount);

      let mortgageAddGetPayToken = await info.appOperator.connect(user1).mortgageAdd.staticCall(1, getTokenAmountWei(1000));
      await info.appOperator.connect(user1).mortgageAdd(1, getTokenAmountWei(1000));

      let user1PayToken2 = await info.simpleToken.balanceOf(user1.address);

      expect(user1PayToken2).eq(user1PayToken1 + mortgageAddGetPayToken);

      let redeemPayToken = await info.appOperator
        .connect(user1)
        .redeem.staticCall(1, getTokenAmountWei(1000), BigInt(10) ** BigInt(25));
      await info.appOperator
        .connect(user1)
        .redeem(1, getTokenAmountWei(1000), BigInt(10) ** BigInt(25));

      let user1PayToken3 = await info.simpleToken.balanceOf(user1.address);

      expect(user1PayToken3).eq(user1PayToken2 - redeemPayToken);
    });
  });
});
