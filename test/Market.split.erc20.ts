import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { getTokenAmountWei } from "./shared/utils";

describe("Market", function () {
  describe("split.erc20", function () {
    it("split revert", async function () {
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
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);
      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2_1.address,
        onftOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);


      let max = BigInt(10) ** BigInt(18) * BigInt(1000000);
      let approveValue = max * BigInt(100);
      await info.simpleToken.transfer(user1.address, approveValue)
      await info.simpleToken.transfer(user2.address, approveValue)
      await info.simpleToken.connect(user1).approve(await info.marketKol.getAddress(), approveValue)
      await info.simpleToken.connect(user2).approve(await info.marketKol.getAddress(), approveValue)

      // user1 buy and mortgage 10000 t1 token=1
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000));
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));
      // user1 buy and mortgage 20000 t1 token=2
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000));
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000));
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000));
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000));
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000));
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000));
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000));
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      // split not tokenid
      await expect(info.marketKol.connect(user1).split(10, 100)).revertedWith("ERC721: invalid token ID");

      // split deleted tokenid
      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      await info.marketKol
        .connect(user1)
        .redeem(1, getTokenAmountWei(10000));
      await expect(info.mortgageNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");

      await expect(info.marketKol.connect(user1).split(1, 1)).revertedWith("ERC721: invalid token ID");

      // split other user tokenid
      await expect(info.marketKol.connect(user1).split(5, 1)).revertedWith("AOE");

      // split amount not enough
      await expect(info.marketKol.connect(user1).split(2, getTokenAmountWei(30000))).revertedWith("SAE");

      // split amount 0
      await expect(info.marketKol.connect(user1).split(2, 0)).revertedWith("SAE");

      // split amount eq
      await expect(info.marketKol.connect(user1).split(2, getTokenAmountWei(20000))).revertedWith("SAE");
    });

    it("split self", async function () {
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
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);
      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2_1.address,
        onftOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);


      let max = BigInt(10) ** BigInt(18) * BigInt(1000000);
      let approveValue = max * BigInt(100);
      await info.simpleToken.transfer(user1.address, approveValue)
      await info.simpleToken.transfer(user2.address, approveValue)
      await info.simpleToken.connect(user1).approve(await info.marketKol.getAddress(), approveValue)
      await info.simpleToken.connect(user2).approve(await info.marketKol.getAddress(), approveValue)

      // user1 buy and mortgage 10000 t1 token=1
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000));
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));
      // user1 buy and mortgage 20000 t1 token=2
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000));
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000));
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000));
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000));
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000));
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000));
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000));
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let nftOwnerT1_1_payToken = await info.simpleToken.balanceOf(nftOwnerT1_1);
      let nftOwnerT1_2_payToken = await info.simpleToken.balanceOf(nftOwnerT1_2);
      let nftOwnerT2_1_payToken = await info.simpleToken.balanceOf(nftOwnerT2_1);
      let nftOwnerT2_2_payToken = await info.simpleToken.balanceOf(nftOwnerT2_2);

      let mortgage_payToken = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_1 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      // split 4 15000
      let result = await info.marketKol
        .connect(user1)
        .split.staticCall(4, getTokenAmountWei(15000));
      await info.marketKol.connect(user1).split(4, getTokenAmountWei(15000));

      let curve_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000));
      let curve_new_1 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000));
      let curve_new_2 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000));

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_2 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      expect(result.newNFTTokenId).eq(9);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_payToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_payToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_payToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_payToken);

      expect(await info.simpleToken.balanceOf(info.mortgageFeeWallet.address)).eq(mortgage_payToken);

      expect(user2_payToken_2).eq(user2_payToken_1);

      expect(user1_payToken_1 - user1_payToken_2).eq(marketKol_payToken_2 - marketKol_payToken_1);
      expect(curve_old - curve_new_1 - curve_new_2).eq(marketKol_payToken_2 - marketKol_payToken_1);
      expect(result.payTokenAmount).eq(marketKol_payToken_2 - marketKol_payToken_1);

      // end
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(9)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000) - getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));
      expect((await info.mortgageNFTKol.info(9)).amount).eq(getTokenAmountWei(15000));

      let kol_payToken_add =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let kol_payToken_remove =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(10000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(20000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000) - getTokenAmountWei(15000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(45000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(0) + getTokenAmountWei(15000)));

      expect(kol_payToken_add - kol_payToken_remove).eq(await info.simpleToken.balanceOf(await info.marketKol.getAddress()));
    });

    it("split self refund and result", async function () {
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
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);
      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2_1.address,
        onftOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);


      let max = BigInt(10) ** BigInt(18) * BigInt(1000000);
      let approveValue = max * BigInt(100);
      await info.simpleToken.transfer(user1.address, approveValue)
      await info.simpleToken.transfer(user2.address, approveValue)
      await info.simpleToken.connect(user1).approve(await info.marketKol.getAddress(), approveValue)
      await info.simpleToken.connect(user2).approve(await info.marketKol.getAddress(), approveValue)

      // user1 buy and mortgage 10000 t1 token=1
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000));
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));
      // user1 buy and mortgage 20000 t1 token=2
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000));
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000));
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000));
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000));
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000));
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000));
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000));
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let nftOwnerT1_1_payToken = await info.simpleToken.balanceOf(nftOwnerT1_1);
      let nftOwnerT1_2_payToken = await info.simpleToken.balanceOf(nftOwnerT1_2);
      let nftOwnerT2_1_payToken = await info.simpleToken.balanceOf(nftOwnerT2_1);
      let nftOwnerT2_2_payToken = await info.simpleToken.balanceOf(nftOwnerT2_2);

      let mortgage_payToken = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_1 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      // split 4 15000
      let result = await info.marketKol
        .connect(user1)
        .split.staticCall(4, getTokenAmountWei(15000));
      let tx = await info.marketKol
        .connect(user1)
        .split(4, getTokenAmountWei(15000));

      let curve_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000));
      let curve_new_1 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000));
      let curve_new_2 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000));

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
      let marketKol_payToken_2 = await info.simpleToken.balanceOf(await info.marketKol.getAddress());

      expect(result.newNFTTokenId).eq(9);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_payToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_payToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_payToken);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_payToken);

      expect(await info.simpleToken.balanceOf(info.mortgageFeeWallet.address)).eq(mortgage_payToken);

      expect(user2_payToken_2).eq(user2_payToken_1);

      expect(user1_payToken_1 - user1_payToken_2).eq(marketKol_payToken_2 - marketKol_payToken_1);
      expect(curve_old - curve_new_1 - curve_new_2).eq(marketKol_payToken_2 - marketKol_payToken_1);
      expect(result.payTokenAmount).eq(marketKol_payToken_2 - marketKol_payToken_1);

      // end
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(9)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000) - getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));
      expect((await info.mortgageNFTKol.info(9)).amount).eq(getTokenAmountWei(15000));

      let kol_payToken_add =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let kol_payToken_remove =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(10000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(20000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000) - getTokenAmountWei(15000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(45000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(0) + getTokenAmountWei(15000)));

      expect(kol_payToken_add - kol_payToken_remove).eq(await info.simpleToken.balanceOf(await info.marketKol.getAddress()));
    });
  });
});
