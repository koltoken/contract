import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { getTokenAmountWei, getTokenAmountWeiFromDecimal } from "./shared/utils";
import Decimal from "decimal.js";

describe("Market", function () {
  describe("multiply.erc20.proxy", function () {
    let data = [
      {
        amount: "83333.333",
        price: "0.0011901",
        mfee: "90909090512396694", // 0.0909
        userPayToken: "999999995636363637", // 0.99999
        cap: "90909090512396694359", // 90.90909
      },
      {
        amount: "476190.476",
        price: "0.0036446",
        mfee: "909090908396694215", // 0.909
        userPayToken: "9999999992363636365", // 9.9999
        cap: "909090908396694215128", // 909.0909
      },
      {
        amount: "900900.901",
        price: "0.1018264",
        mfee: "9090909101000000010", // 9.09
        userPayToken: "100000000111000000110", // 100
        cap: "9090909101000000010090", // 9090.909
      },
      {
        amount: "989119.684",
        price: "8.4472818",
        mfee: "90909095287305993686", // 90.9
        userPayToken: "1000000048160365930548", // 1000
        cap: "90909095287305993686212", // 90909
      },
      {
        amount: "998901.210",
        price: "828.2674672",
        mfee: "909092010302241556621", // 909.09
        userPayToken: "10000012113324657122834", // 10000
        cap: "909092010302241556621374", // 909092
      },
      {
        amount: "999450.304",
        price: "3309.4425512",
        mfee: "1818187332634765397601", // 1818.18
        userPayToken: "20000060658982419373616", // 20000
        cap: "1818187332634765397601583", // 1818187
      },
      {
        amount: "999877.798",
        price: "66964.3060248",
        mfee: "8182172124842473936596", // 8182
        userPayToken: "90003893373267213302563", // 90003
        cap: "8182172124842473936596782", // 8182172
      },
    ];

    it("multiply revert", async function () {
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
        cfntOwner: nftOwnerT1_1.address,
        ofntOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cfntOwner,
          paramsT1.ofntOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cfntOwner: nftOwnerT2_1.address,
        ofntOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cfntOwner,
          paramsT2.ofntOwner,
        );

      await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

      // not tid
      await expect(info.appOperator.multiply("t123", getTokenAmountWei(1), getTokenAmountWei(2))).revertedWith("TE");

      // zero
      await expect(info.appOperator.multiply(paramsT1.tid, 0, getTokenAmountWei(2))).revertedWith("TAE");

      //  amount > 1000W
      await expect(
        info.appOperator.multiply(paramsT1.tid, getTokenAmountWei(10000000), getTokenAmountWei(20000000)),
      ).revertedWithPanic("0x11");

      await info.simpleToken.approve(await info.appOperator.getAddress(), 1)
      // approve < need
      await expect(
        info.appOperator.multiply(paramsT1.tid, getTokenAmountWei(1000), getTokenAmountWei(20000000)),
      ).revertedWith("ERC20: insufficient allowance");
    });

    it("multiplyAdd revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

      let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
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
        cfntOwner: nftOwnerT1_1.address,
        ofntOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cfntOwner,
          paramsT1.ofntOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cfntOwner: nftOwnerT2_1.address,
        ofntOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cfntOwner,
          paramsT2.ofntOwner,
        );

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

      let max = BigInt(10) ** BigInt(18) * BigInt(10000000);
      await info.appOperator.connect(user1).multiply(paramsT1.tid, getTokenAmountWei(1000), max);

      await info.appOperator.connect(user1).multiply(paramsT1.tid, getTokenAmountWei(1000), max);

      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      expect(await info.mortgageNFTKol.ownerOf(2)).eq(user1.address);

      //  not tokenid
      await expect(
        info.appOperator.multiplyAdd(3, getTokenAmountWei(1000), max),
      ).revertedWith("ERC721: invalid token ID");

      //  deleted tokenid
      await info.appOperator
        .connect(user1)
        .redeem(1, getTokenAmountWei(1000), max);

      await expect(info.mortgageNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      expect(await info.mortgageNFTKol.ownerOf(2)).eq(user1.address);

      await expect(
        info.appOperator
          .connect(user2)
          .multiplyAdd(1, getTokenAmountWei(1000), max),
      ).revertedWith("ERC721: invalid token ID");

      //  other user tokenid
      await expect(
        info.appOperator
          .connect(user2)
          .multiplyAdd(2, getTokenAmountWei(1000), max),
      ).revertedWith("AOE");

      // 0
      await expect(
        info.appOperator.connect(user1).multiplyAdd(2, 0, max),
      ).revertedWith("TAE");

      //  amount > 1000W
      await expect(
        info.appOperator.connect(user1).multiplyAdd(2, getTokenAmountWei(10000000) - getTokenAmountWei(1000), max),
      ).revertedWithPanic("0x11");

      // approve < need
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), 1)
      await expect(
        info.appOperator.connect(user1).multiplyAdd(2, getTokenAmountWei(1000), 2),
      ).revertedWith("ERC20: insufficient allowance");
    });

    it("multiply result", async function () {
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
        cfntOwner: nftOwnerT1_1.address,
        ofntOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cfntOwner,
          paramsT1.ofntOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cfntOwner: nftOwnerT2_1.address,
        ofntOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cfntOwner,
          paramsT2.ofntOwner,
        );

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

      let max = BigInt(10) ** BigInt(18) * BigInt(10000000)
      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);

      let result = await info.appOperator.connect(user1).multiply.staticCall(paramsT1.tid, getTokenAmountWei(1000), max);
      await info.appOperator
        .connect(user1)
        .multiply(paramsT1.tid, getTokenAmountWei(1000), max);

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);

      expect(user1_payToken_1 - result.payTokenAmount).eq(user1_payToken_2);
      expect(result.nftTokenId).eq(1);
    });

    it("multiply refund", async function () {
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
        cfntOwner: nftOwnerT1_1.address,
        ofntOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cfntOwner,
          paramsT1.ofntOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cfntOwner: nftOwnerT2_1.address,
        ofntOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cfntOwner,
          paramsT2.ofntOwner,
        );

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

      let max = BigInt(10) ** BigInt(18) * BigInt(10000000)
      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);

      let result = await info.appOperator.connect(user1).multiply.staticCall(paramsT1.tid, getTokenAmountWei(1000), max);
      await info.appOperator
        .connect(user1)
        .multiply(paramsT1.tid, getTokenAmountWei(1000), max);

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);

      expect(user1_payToken_1 - result.payTokenAmount).eq(user1_payToken_2);
      expect(result.nftTokenId).eq(1);
    });

    it("multiplyAdd result", async function () {
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
        cfntOwner: nftOwnerT1_1.address,
        ofntOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cfntOwner,
          paramsT1.ofntOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cfntOwner: nftOwnerT2_1.address,
        ofntOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cfntOwner,
          paramsT2.ofntOwner,
        );

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

      let max = BigInt(10) ** BigInt(18) * BigInt(10000000);
      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);

      let result_1 = await info.appOperator.connect(user1).multiply.staticCall(paramsT1.tid, getTokenAmountWei(1000), max);
      await info.appOperator
        .connect(user1)
        .multiply(paramsT1.tid, getTokenAmountWei(1000), max);

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);

      expect(user1_payToken_1 - result_1.payTokenAmount).eq(user1_payToken_2);
      expect(result_1.nftTokenId).eq(1);

      let result_2 = await info.appOperator.connect(user1).multiplyAdd.staticCall(1, getTokenAmountWei(1000), max);
      await info.appOperator.connect(user1).multiplyAdd(1, getTokenAmountWei(1000), max);

      let user1_payToken_3 = await info.simpleToken.balanceOf(user1.address);

      expect(user1_payToken_2 - result_2).eq(user1_payToken_3);
    });

    it("multiplyAdd refund", async function () {
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
        cfntOwner: nftOwnerT1_1.address,
        ofntOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cfntOwner,
          paramsT1.ofntOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cfntOwner: nftOwnerT2_1.address,
        ofntOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cfntOwner,
          paramsT2.ofntOwner,
        );

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

      let max = BigInt(10) ** BigInt(18) * BigInt(10000000);
      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);

      let result_1 = await info.appOperator.connect(user1).multiply.staticCall(paramsT1.tid, getTokenAmountWei(1000), max);
      await info.appOperator
        .connect(user1)
        .multiply(paramsT1.tid, getTokenAmountWei(1000), max);

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);

      expect(user1_payToken_1 - result_1.payTokenAmount).eq(user1_payToken_2);
      expect(result_1.nftTokenId).eq(1);

      let result_2 = await info.appOperator.connect(user1).multiplyAdd.staticCall(1, getTokenAmountWei(1000), max);
      await info.appOperator
        .connect(user1)
        .multiplyAdd(1, getTokenAmountWei(1000), max);

      let user1_payToken_3 = await info.simpleToken.balanceOf(user1.address);

      expect(user1_payToken_2 - result_2).eq(user1_payToken_3);
    });

    it("multiply", async function () {
      for (let i = 0; i < data.length; i++) {
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
          cfntOwner: nftOwnerT1_1.address,
          ofntOwner: nftOwnerT1_2.address,
        };
        await info.appOperator
          .createToken(
            paramsT1.tid,
            paramsT1.tData,
            paramsT1.cfntOwner,
            paramsT1.ofntOwner,
          );

        let paramsT2 = {
          tid: "t2",
          tData: "0x11",
          cfntOwner: nftOwnerT2_1.address,
          ofntOwner: nftOwnerT2_2.address,
        };
        await info.appOperator
          .createToken(
            paramsT2.tid,
            paramsT2.tData,
            paramsT2.cfntOwner,
            paramsT2.ofntOwner,
          );

        await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

        let max = BigInt(10) ** BigInt(18) * BigInt(10000000)
        let amount = getTokenAmountWeiFromDecimal(data[i].amount);

        expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(0);
        expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

        let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
        let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
        let nftOwnerT1_1_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
        let nftOwnerT1_2_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
        let nftOwnerT2_1_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
        let nftOwnerT2_2_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
        let mortgage_fee_payToken_1 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_1 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

        // multiply
        let result = await info.appOperator
          .connect(user1)
          .multiply.staticCall(paramsT1.tid, amount, max);
        await info.appOperator.connect(user1).multiply(paramsT1.tid, amount, max);

        let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
        let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
        let nftOwnerT1_1_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
        let nftOwnerT1_2_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
        let nftOwnerT2_1_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
        let nftOwnerT2_2_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
        let mortgage_fee_payToken_2 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_2 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

        let mortgage_fee_payToken_add = mortgage_fee_payToken_2 - mortgage_fee_payToken_1;
        let nftOwnerT1_1_payToken_add = nftOwnerT1_1_payToken_2 - nftOwnerT1_1_payToken_1;
        let nftOwnerT1_2_payToken_add = nftOwnerT1_2_payToken_2 - nftOwnerT1_2_payToken_1;
        let nftOwnerT2_1_payToken_add = nftOwnerT2_1_payToken_2 - nftOwnerT2_1_payToken_1;
        let nftOwnerT2_2_payToken_add = nftOwnerT2_2_payToken_2 - nftOwnerT2_2_payToken_1;

        let curve_buy = await info.marketKol.getPayTokenAmount(0, amount);
        let curve_mortgage = await info.marketKol.getPayTokenAmount(0, amount);

        // check
        expect(result.nftTokenId).eq(1);

        expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(amount);
        expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(amount);
        expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(market_payToken_2).eq(market_payToken_1).eq(0);

        expect(user2_payToken_2).eq(user2_payToken_1);
        expect(nftOwnerT2_1_payToken_add).eq(0);
        expect(nftOwnerT2_2_payToken_add).eq(0);

        expect(nftOwnerT1_2_payToken_add / nftOwnerT1_1_payToken_add).eq(19);

        expect(curve_buy).eq(curve_mortgage);
        expect(curve_mortgage / mortgage_fee_payToken_add).eq(1000);
        expect(curve_buy / (nftOwnerT1_2_payToken_add + nftOwnerT1_1_payToken_add)).eq(100);
        expect(user1_payToken_1 - user1_payToken_2).eq(mortgage_fee_payToken_add + nftOwnerT1_2_payToken_add + nftOwnerT1_1_payToken_add);
        expect((curve_buy + nftOwnerT1_2_payToken_add + nftOwnerT1_1_payToken_add) / (user1_payToken_1 - user1_payToken_2)).eq(91);

        expect(user1_payToken_1 - user1_payToken_2).eq(result.payTokenAmount);

        // 10**45 / ((10**24 - x)**2)
        let a = BigInt(10) ** BigInt(45);
        let b = (BigInt(10) ** BigInt(24) - amount) ** BigInt(2);
        let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

        // assert
        // console.log("==================");
        // console.log(amount);
        // console.log(price);
        // console.log(mortgage_fee_payToken_add);
        // console.log(user1_payToken_1 - user1_payToken_2 - gas);
        // console.log(curve_buy);

        expect(curve_buy).eq(data[i].cap); // 999999999999999999999
        expect(user1_payToken_1 - user1_payToken_2).eq(data[i].userPayToken); // 10999999999999999997
        expect(price).eq(data[i].price); // 4000008000016000
        expect(mortgage_fee_payToken_add).eq(data[i].mfee); // 999999999999999999
      }
    });

    it("multiply + multiplyAdd + multiplyAdd", async function () {
      for (let i = 0; i < data.length; i++) {
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
          cfntOwner: nftOwnerT1_1.address,
          ofntOwner: nftOwnerT1_2.address,
        };
        await info.appOperator
          .createToken(
            paramsT1.tid,
            paramsT1.tData,
            paramsT1.cfntOwner,
            paramsT1.ofntOwner,
          );

        let paramsT2 = {
          tid: "t2",
          tData: "0x11",
          cfntOwner: nftOwnerT2_1.address,
          ofntOwner: nftOwnerT2_2.address,
        };
        await info.appOperator
          .createToken(
            paramsT2.tid,
            paramsT2.tData,
            paramsT2.cfntOwner,
            paramsT2.ofntOwner,
          );

        await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

        let max = BigInt(10) ** BigInt(18) * BigInt(1000000)
        let amount = getTokenAmountWeiFromDecimal(data[i].amount);
        let part1 = amount / BigInt(4);
        let part2 = amount / BigInt(3);
        let part3 = amount - part1 - part2;

        expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(0);
        expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

        let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
        let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
        let nftOwnerT1_1_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
        let nftOwnerT1_2_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
        let nftOwnerT2_1_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
        let nftOwnerT2_2_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
        let mortgage_fee_payToken_1 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_1 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

        // multiply part1
        let result_1 = await info.appOperator
          .connect(user1)
          .multiply.staticCall(paramsT1.tid, part1, max);
        await info.appOperator.connect(user1).multiply(paramsT1.tid, part1, max);

        let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
        let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
        let nftOwnerT1_1_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
        let nftOwnerT1_2_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
        let nftOwnerT2_1_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
        let nftOwnerT2_2_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
        let mortgage_fee_payToken_2 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_2 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

        let mortgage_fee_payToken_add_1 = mortgage_fee_payToken_2 - mortgage_fee_payToken_1;
        let nftOwnerT1_1_payToken_add_1 = nftOwnerT1_1_payToken_2 - nftOwnerT1_1_payToken_1;
        let nftOwnerT1_2_payToken_add_1 = nftOwnerT1_2_payToken_2 - nftOwnerT1_2_payToken_1;
        let nftOwnerT2_1_payToken_add_1 = nftOwnerT2_1_payToken_2 - nftOwnerT2_1_payToken_1;
        let nftOwnerT2_2_payToken_add_1 = nftOwnerT2_2_payToken_2 - nftOwnerT2_2_payToken_1;

        let curve_buy_1 = await info.marketKol.getPayTokenAmount(0, part1);
        let curve_mortgage_1 = await info.marketKol.getPayTokenAmount(0, part1);

        // check
        expect(result_1.nftTokenId).eq(1);

        expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(part1);
        expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(part1);
        expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(market_payToken_2).eq(market_payToken_1).eq(0);

        expect(user2_payToken_2).eq(user2_payToken_1);
        expect(nftOwnerT2_1_payToken_add_1).eq(0);
        expect(nftOwnerT2_2_payToken_add_1).eq(0);

        expect(nftOwnerT1_2_payToken_add_1 / nftOwnerT1_1_payToken_add_1).eq(19);

        expect(curve_buy_1).eq(curve_mortgage_1);
        expect(curve_mortgage_1 / mortgage_fee_payToken_add_1).eq(1000);
        expect(curve_buy_1 / (nftOwnerT1_2_payToken_add_1 + nftOwnerT1_1_payToken_add_1)).eq(100);
        expect(user1_payToken_1 - user1_payToken_2).eq(
          mortgage_fee_payToken_add_1 + nftOwnerT1_2_payToken_add_1 + nftOwnerT1_1_payToken_add_1,
        );
        expect(
          (curve_buy_1 + nftOwnerT1_2_payToken_add_1 + nftOwnerT1_1_payToken_add_1) / (user1_payToken_1 - user1_payToken_2),
        ).eq(91);

        expect(user1_payToken_1 - user1_payToken_2).eq(result_1.payTokenAmount);

        // multiplyAdd part2
        let result_2 = await info.appOperator
          .connect(user1)
          .multiplyAdd.staticCall(1, part2, max);

        await info.appOperator.connect(user1).multiplyAdd(1, part2, max);

        //
        let user1_payToken_3 = await info.simpleToken.balanceOf(user1.address);
        let user2_payToken_3 = await info.simpleToken.balanceOf(user2.address);
        let nftOwnerT1_1_payToken_3 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
        let nftOwnerT1_2_payToken_3 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
        let nftOwnerT2_1_payToken_3 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
        let nftOwnerT2_2_payToken_3 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
        let mortgage_fee_payToken_3 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_3 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

        let mortgage_fee_payToken_add_2 = mortgage_fee_payToken_3 - mortgage_fee_payToken_2;
        let nftOwnerT1_1_payToken_add_2 = nftOwnerT1_1_payToken_3 - nftOwnerT1_1_payToken_2;
        let nftOwnerT1_2_payToken_add_2 = nftOwnerT1_2_payToken_3 - nftOwnerT1_2_payToken_2;
        let nftOwnerT2_1_payToken_add_2 = nftOwnerT2_1_payToken_3 - nftOwnerT2_1_payToken_2;
        let nftOwnerT2_2_payToken_add_2 = nftOwnerT2_2_payToken_3 - nftOwnerT2_2_payToken_2;

        let curve_buy_2 = await info.marketKol.getPayTokenAmount(part1, part2);
        let curve_mortgage_2 = await info.marketKol.getPayTokenAmount(part1, part2);

        // check
        await expect(info.mortgageNFTKol.ownerOf(2)).revertedWith("ERC721: invalid token ID");

        expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(part1 + part2);
        expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(part1 + part2);
        expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(market_payToken_3).eq(market_payToken_2).eq(0);

        expect(user2_payToken_3).eq(user2_payToken_2);
        expect(nftOwnerT2_1_payToken_add_2).eq(0);
        expect(nftOwnerT2_2_payToken_add_2).eq(0);

        expect(nftOwnerT1_2_payToken_add_2 / nftOwnerT1_1_payToken_add_2).eq(19);

        expect(curve_buy_2).eq(curve_mortgage_2);
        expect(curve_mortgage_2 / mortgage_fee_payToken_add_2).eq(1000);
        expect(curve_buy_2 / (nftOwnerT1_2_payToken_add_2 + nftOwnerT1_1_payToken_add_2)).eq(100);
        expect(user1_payToken_2 - user1_payToken_3).eq(
          mortgage_fee_payToken_add_2 + nftOwnerT1_2_payToken_add_2 + nftOwnerT1_1_payToken_add_2,
        );
        expect(
          (curve_buy_2 + nftOwnerT1_2_payToken_add_2 + nftOwnerT1_1_payToken_add_2) / (user1_payToken_2 - user1_payToken_3),
        ).eq(91);

        expect(user1_payToken_2 - user1_payToken_3).eq(result_2);
        ///

        // multiplyAdd part3
        let result_3 = await info.appOperator
          .connect(user1)
          .multiplyAdd.staticCall(1, part3, max);

        await info.appOperator.connect(user1).multiplyAdd(1, part3, max);

        //
        let user1_payToken_4 = await info.simpleToken.balanceOf(user1.address);
        let user2_payToken_4 = await info.simpleToken.balanceOf(user2.address);
        let nftOwnerT1_1_payToken_4 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
        let nftOwnerT1_2_payToken_4 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
        let nftOwnerT2_1_payToken_4 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
        let nftOwnerT2_2_payToken_4 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
        let mortgage_fee_payToken_4 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_4 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

        let mortgage_fee_payToken_add_3 = mortgage_fee_payToken_4 - mortgage_fee_payToken_3;
        let nftOwnerT1_1_payToken_add_3 = nftOwnerT1_1_payToken_4 - nftOwnerT1_1_payToken_3;
        let nftOwnerT1_2_payToken_add_3 = nftOwnerT1_2_payToken_4 - nftOwnerT1_2_payToken_3;
        let nftOwnerT2_1_payToken_add_3 = nftOwnerT2_1_payToken_4 - nftOwnerT2_1_payToken_3;
        let nftOwnerT2_2_payToken_add_3 = nftOwnerT2_2_payToken_4 - nftOwnerT2_2_payToken_3;

        let curve_buy_3 = await info.marketKol.getPayTokenAmount(part1 + part2, part3);
        let curve_mortgage_3 = await info.marketKol.getPayTokenAmount(part1 + part2, part3);

        // check
        await expect(info.mortgageNFTKol.ownerOf(2)).revertedWith("ERC721: invalid token ID");

        expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(part1 + part2 + part3);
        expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
          part1 + part2 + part3,
        );
        expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

        expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
        expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

        expect(market_payToken_4).eq(market_payToken_3).eq(0);

        expect(user2_payToken_4).eq(user2_payToken_3);
        expect(nftOwnerT2_1_payToken_add_3).eq(0);
        expect(nftOwnerT2_2_payToken_add_3).eq(0);

        expect(nftOwnerT1_2_payToken_add_3 / nftOwnerT1_1_payToken_add_3).eq(19);

        expect(curve_buy_3).eq(curve_mortgage_3);
        expect(curve_mortgage_3 / mortgage_fee_payToken_add_3).eq(1000);
        expect(curve_buy_3 / (nftOwnerT1_2_payToken_add_3 + nftOwnerT1_1_payToken_add_3)).eq(100);
        expect(user1_payToken_3 - user1_payToken_4).eq(
          mortgage_fee_payToken_add_3 + nftOwnerT1_2_payToken_add_3 + nftOwnerT1_1_payToken_add_3,
        );
        expect(
          (curve_buy_3 + nftOwnerT1_2_payToken_add_3 + nftOwnerT1_1_payToken_add_3) / (user1_payToken_3 - user1_payToken_4),
        ).eq(91);

        expect(user1_payToken_3 - user1_payToken_4).eq(result_3);

        // 10**45 / ((10**24 - x)**2)
        let a = BigInt(10) ** BigInt(45);
        let b = (BigInt(10) ** BigInt(24) - amount) ** BigInt(2);
        let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

        // assert
        expect(curve_buy_1 + curve_buy_2 + curve_buy_3).eq(data[i].cap);
        expect(price).eq(data[i].price);
        expect(BigInt(data[i].userPayToken) - (user1_payToken_1 - user1_payToken_4)).lt(7);
        expect(BigInt(data[i].userPayToken) - (user1_payToken_1 - user1_payToken_4)).gte(0);

        expect(BigInt(data[i].mfee) - (mortgage_fee_payToken_add_1 + mortgage_fee_payToken_add_2 + mortgage_fee_payToken_add_3)).lt(3);
        expect(BigInt(data[i].mfee) - (mortgage_fee_payToken_add_1 + mortgage_fee_payToken_add_2 + mortgage_fee_payToken_add_3)).gte(
          0,
        );
      }
    });

    it("multi user tid multiply + multiplyAdd", async function () {
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
        cfntOwner: nftOwnerT1_1.address,
        ofntOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.cfntOwner,
          paramsT1.ofntOwner,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        cfntOwner: nftOwnerT2_1.address,
        ofntOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cfntOwner,
          paramsT2.ofntOwner,
        );

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
      await info.simpleToken.connect(user2).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

      let max = BigInt(10) ** BigInt(18) * BigInt(1000000);

      let multiply_amount_1 = getTokenAmountWei(10000);
      let multiply_amount_2 = getTokenAmountWei(20000);
      let multiply_amount_3 = getTokenAmountWei(30000);
      let multiply_amount_4 = getTokenAmountWei(40000);
      let multiply_amount_5 = getTokenAmountWei(15000);
      let multiply_amount_6 = getTokenAmountWei(25000);
      let multiply_amount_7 = getTokenAmountWei(35000);
      let multiply_amount_8 = getTokenAmountWei(45000);

      let multiply_add_amount_1 = getTokenAmountWei(20000);
      let multiply_add_amount_2 = getTokenAmountWei(30000);
      let multiply_add_amount_3 = getTokenAmountWei(40000);
      let multiply_add_amount_4 = getTokenAmountWei(50000);
      let multiply_add_amount_5 = getTokenAmountWei(25000);
      let multiply_add_amount_6 = getTokenAmountWei(35000);
      let multiply_add_amount_7 = getTokenAmountWei(45000);
      let multiply_add_amount_8 = getTokenAmountWei(55000);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(0);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      let user1_payToken_0 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_0 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_0 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_0 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_0 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_0 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_0 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_0 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      // user1 multiply t1 10000 tokenid=1
      let result_1 = await info.appOperator
        .connect(user1)
        .multiply.staticCall(paramsT1.tid, multiply_amount_1, max);
      await info.appOperator
        .connect(user1)
        .multiply(paramsT1.tid, multiply_amount_1, max);

      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_1 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_1 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_1 = market_payToken_1 - market_payToken_0;
      let mortgage_fee_payToken_add_1 = mortgage_fee_payToken_1 - mortgage_fee_payToken_0;

      let nftOwnerT1_1_payToken_add_1 = nftOwnerT1_1_payToken_1 - nftOwnerT1_1_payToken_0;
      let nftOwnerT1_2_payToken_add_1 = nftOwnerT1_2_payToken_1 - nftOwnerT1_2_payToken_0;
      let nftOwnerT2_1_payToken_add_1 = nftOwnerT2_1_payToken_1 - nftOwnerT2_1_payToken_0;
      let nftOwnerT2_2_payToken_add_1 = nftOwnerT2_2_payToken_1 - nftOwnerT2_2_payToken_0;

      let curve_mortgage_1 = await info.marketKol.getPayTokenAmount(0, multiply_amount_1);
      let curve_buy_1 = await info.marketKol.getPayTokenAmount(0, multiply_amount_1);

      // check
      expect(result_1.nftTokenId).eq(1);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(multiply_amount_1);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(multiply_amount_1);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_2_payToken_add_1 / nftOwnerT1_1_payToken_add_1).eq(19);
      expect(nftOwnerT2_2_payToken_add_1).eq(nftOwnerT2_1_payToken_add_1).eq(0);

      expect(curve_mortgage_1 / mortgage_fee_payToken_add_1).eq(1000);

      expect(curve_buy_1 / (nftOwnerT1_2_payToken_add_1 + nftOwnerT1_1_payToken_add_1)).eq(100);

      expect(user2_payToken_1).eq(user2_payToken_0);

      expect(market_payToken_add_1).eq(
        user1_payToken_0 - user1_payToken_1 - mortgage_fee_payToken_add_1 - nftOwnerT1_2_payToken_add_1 - nftOwnerT1_1_payToken_add_1,
      );
      expect(market_payToken_add_1)
        .eq(curve_buy_1 - curve_mortgage_1)
        .eq(0);

      // user1 multiply t1 20000 tokenid=2
      let result_2 = await info.appOperator
        .connect(user1)
        .multiply.staticCall(paramsT1.tid, multiply_amount_2, max);
      await info.appOperator
        .connect(user1)
        .multiply(paramsT1.tid, multiply_amount_2, max);

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_2 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_2 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_2 = market_payToken_2 - market_payToken_1;
      let mortgage_fee_payToken_add_2 = mortgage_fee_payToken_2 - mortgage_fee_payToken_1;

      let nftOwnerT1_1_payToken_add_2 = nftOwnerT1_1_payToken_2 - nftOwnerT1_1_payToken_1;
      let nftOwnerT1_2_payToken_add_2 = nftOwnerT1_2_payToken_2 - nftOwnerT1_2_payToken_1;
      let nftOwnerT2_1_payToken_add_2 = nftOwnerT2_1_payToken_2 - nftOwnerT2_1_payToken_1;
      let nftOwnerT2_2_payToken_add_2 = nftOwnerT2_2_payToken_2 - nftOwnerT2_2_payToken_1;

      let curve_mortgage_2 = await info.marketKol.getPayTokenAmount(0, multiply_amount_2);
      let curve_buy_2 = await info.marketKol.getPayTokenAmount(multiply_amount_1, multiply_amount_2);

      // check
      expect(result_2.nftTokenId).eq(2);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(multiply_amount_1 + multiply_amount_2);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_2_payToken_add_2 / nftOwnerT1_1_payToken_add_2).eq(19);
      expect(nftOwnerT2_2_payToken_add_2).eq(nftOwnerT2_1_payToken_add_2).eq(0);

      expect(curve_mortgage_2 / mortgage_fee_payToken_add_2).eq(1000);

      expect(curve_buy_2 / (nftOwnerT1_2_payToken_add_2 + nftOwnerT1_1_payToken_add_2)).eq(100);

      expect(user2_payToken_2).eq(user2_payToken_1);

      expect(market_payToken_add_2).eq(
        user1_payToken_1 - user1_payToken_2 - mortgage_fee_payToken_add_2 - nftOwnerT1_2_payToken_add_2 - nftOwnerT1_1_payToken_add_2,
      );
      expect(market_payToken_add_2)
        .eq(curve_buy_2 - curve_mortgage_2)
        .gt(0);

      // user1 multiply t2 30000 tokenid=3
      let result_3 = await info.appOperator
        .connect(user1)
        .multiply.staticCall(paramsT2.tid, multiply_amount_3, max);
      await info.appOperator
        .connect(user1)
        .multiply(paramsT2.tid, multiply_amount_3, max);

      let user1_payToken_3 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_3 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_3 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_3 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_3 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_3 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_3 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_3 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_3 = market_payToken_3 - market_payToken_2;
      let mortgage_fee_payToken_add_3 = mortgage_fee_payToken_3 - mortgage_fee_payToken_2;

      let nftOwnerT1_1_payToken_add_3 = nftOwnerT1_1_payToken_3 - nftOwnerT1_1_payToken_2;
      let nftOwnerT1_2_payToken_add_3 = nftOwnerT1_2_payToken_3 - nftOwnerT1_2_payToken_2;
      let nftOwnerT2_1_payToken_add_3 = nftOwnerT2_1_payToken_3 - nftOwnerT2_1_payToken_2;
      let nftOwnerT2_2_payToken_add_3 = nftOwnerT2_2_payToken_3 - nftOwnerT2_2_payToken_2;

      let curve_mortgage_3 = await info.marketKol.getPayTokenAmount(0, multiply_amount_3);
      let curve_buy_3 = await info.marketKol.getPayTokenAmount(0, multiply_amount_3);

      // check
      expect(result_3.nftTokenId).eq(3);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(multiply_amount_1 + multiply_amount_2);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(multiply_amount_3);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(multiply_amount_3);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_2_payToken_add_3 / nftOwnerT2_1_payToken_add_3).eq(19);
      expect(nftOwnerT1_2_payToken_add_3).eq(nftOwnerT1_1_payToken_add_3).eq(0);

      expect(curve_mortgage_3 / mortgage_fee_payToken_add_3).eq(1000);

      expect(curve_buy_3 / (nftOwnerT2_2_payToken_add_3 + nftOwnerT2_1_payToken_add_3)).eq(100);

      expect(user2_payToken_3).eq(user2_payToken_2);

      expect(market_payToken_add_3).eq(
        user1_payToken_2 - user1_payToken_3 - mortgage_fee_payToken_add_3 - nftOwnerT2_2_payToken_add_3 - nftOwnerT2_1_payToken_add_3,
      );
      expect(market_payToken_add_3)
        .eq(curve_buy_3 - curve_mortgage_3)
        .eq(0);

      // user1 multiply t2 40000 tokenid=4
      let result_4 = await info.appOperator
        .connect(user1)
        .multiply.staticCall(paramsT2.tid, multiply_amount_4, max);
      await info.appOperator
        .connect(user1)
        .multiply(paramsT2.tid, multiply_amount_4, max);

      let user1_payToken_4 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_4 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_4 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_4 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_4 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_4 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_4 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_4 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_4 = market_payToken_4 - market_payToken_3;
      let mortgage_fee_payToken_add_4 = mortgage_fee_payToken_4 - mortgage_fee_payToken_3;

      let nftOwnerT1_1_payToken_add_4 = nftOwnerT1_1_payToken_4 - nftOwnerT1_1_payToken_3;
      let nftOwnerT1_2_payToken_add_4 = nftOwnerT1_2_payToken_4 - nftOwnerT1_2_payToken_3;
      let nftOwnerT2_1_payToken_add_4 = nftOwnerT2_1_payToken_4 - nftOwnerT2_1_payToken_3;
      let nftOwnerT2_2_payToken_add_4 = nftOwnerT2_2_payToken_4 - nftOwnerT2_2_payToken_3;

      let curve_mortgage_4 = await info.marketKol.getPayTokenAmount(0, multiply_amount_4);
      let curve_buy_4 = await info.marketKol.getPayTokenAmount(multiply_amount_3, multiply_amount_4);

      // check
      expect(result_4.nftTokenId).eq(4);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(multiply_amount_1 + multiply_amount_2);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(multiply_amount_3 + multiply_amount_4);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_2_payToken_add_4 / nftOwnerT2_1_payToken_add_4).eq(19);
      expect(nftOwnerT1_2_payToken_add_4).eq(nftOwnerT1_1_payToken_add_4).eq(0);

      expect(curve_mortgage_4 / mortgage_fee_payToken_add_4).eq(1000);

      expect(curve_buy_4 / (nftOwnerT2_2_payToken_add_4 + nftOwnerT2_1_payToken_add_4)).eq(100);

      expect(user2_payToken_4).eq(user2_payToken_3);

      expect(market_payToken_add_4).eq(
        user1_payToken_3 - user1_payToken_4 - mortgage_fee_payToken_add_4 - nftOwnerT2_2_payToken_add_4 - nftOwnerT2_1_payToken_add_4,
      );
      expect(market_payToken_add_4)
        .eq(curve_buy_4 - curve_mortgage_4)
        .gt(0);
      // user2 multiply t1 15000 tokenid=5
      let result_5 = await info.appOperator
        .connect(user2)
        .multiply.staticCall(paramsT1.tid, multiply_amount_5, max);
      await info.appOperator
        .connect(user2)
        .multiply(paramsT1.tid, multiply_amount_5, max);

      let user1_payToken_5 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_5 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_5 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_5 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_5 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_5 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_5 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_5 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_5 = market_payToken_5 - market_payToken_4;
      let mortgage_fee_payToken_add_5 = mortgage_fee_payToken_5 - mortgage_fee_payToken_4;

      let nftOwnerT1_1_payToken_add_5 = nftOwnerT1_1_payToken_5 - nftOwnerT1_1_payToken_4;
      let nftOwnerT1_2_payToken_add_5 = nftOwnerT1_2_payToken_5 - nftOwnerT1_2_payToken_4;
      let nftOwnerT2_1_payToken_add_5 = nftOwnerT2_1_payToken_5 - nftOwnerT2_1_payToken_4;
      let nftOwnerT2_2_payToken_add_5 = nftOwnerT2_2_payToken_5 - nftOwnerT2_2_payToken_4;

      let curve_mortgage_5 = await info.marketKol.getPayTokenAmount(0, multiply_amount_5);
      let curve_buy_5 = await info.marketKol.getPayTokenAmount(multiply_amount_1 + multiply_amount_2, multiply_amount_5);

      // check
      expect(result_5.nftTokenId).eq(5);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(multiply_amount_3 + multiply_amount_4);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_2_payToken_add_5 / nftOwnerT1_1_payToken_add_5).eq(19);
      expect(nftOwnerT2_2_payToken_add_5).eq(nftOwnerT2_1_payToken_add_5).eq(0);

      expect(curve_mortgage_5 / mortgage_fee_payToken_add_5).eq(1000);

      expect(curve_buy_5 / (nftOwnerT1_2_payToken_add_5 + nftOwnerT1_1_payToken_add_5)).eq(100);

      expect(user1_payToken_5).eq(user1_payToken_4);

      expect(market_payToken_add_5).eq(
        user2_payToken_4 - user2_payToken_5 - mortgage_fee_payToken_add_5 - nftOwnerT1_2_payToken_add_5 - nftOwnerT1_1_payToken_add_5,
      );
      expect(market_payToken_add_5)
        .eq(curve_buy_5 - curve_mortgage_5)
        .gt(0);

      // user2 multiply t1 25000 tokenid=6
      let result_6 = await info.appOperator
        .connect(user2)
        .multiply.staticCall(paramsT1.tid, multiply_amount_6, max);
      await info.appOperator
        .connect(user2)
        .multiply(paramsT1.tid, multiply_amount_6, max);

      let user1_payToken_6 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_6 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_6 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_6 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_6 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_6 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_6 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_6 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_6 = market_payToken_6 - market_payToken_5;
      let mortgage_fee_payToken_add_6 = mortgage_fee_payToken_6 - mortgage_fee_payToken_5;

      let nftOwnerT1_1_payToken_add_6 = nftOwnerT1_1_payToken_6 - nftOwnerT1_1_payToken_5;
      let nftOwnerT1_2_payToken_add_6 = nftOwnerT1_2_payToken_6 - nftOwnerT1_2_payToken_5;
      let nftOwnerT2_1_payToken_add_6 = nftOwnerT2_1_payToken_6 - nftOwnerT2_1_payToken_5;
      let nftOwnerT2_2_payToken_add_6 = nftOwnerT2_2_payToken_6 - nftOwnerT2_2_payToken_5;

      let curve_mortgage_6 = await info.marketKol.getPayTokenAmount(0, multiply_amount_6);
      let curve_buy_6 = await info.marketKol.getPayTokenAmount(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5,
        multiply_amount_6,
      );

      // check
      expect(result_6.nftTokenId).eq(6);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(multiply_amount_3 + multiply_amount_4);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_2_payToken_add_6 / nftOwnerT1_1_payToken_add_6).eq(19);
      expect(nftOwnerT2_2_payToken_add_6).eq(nftOwnerT2_1_payToken_add_6).eq(0);

      expect(curve_mortgage_6 / mortgage_fee_payToken_add_6).eq(1000);

      expect(curve_buy_6 / (nftOwnerT1_2_payToken_add_6 + nftOwnerT1_1_payToken_add_6)).eq(100);

      expect(user1_payToken_6).eq(user1_payToken_5);

      expect(market_payToken_add_6).eq(
        user2_payToken_5 - user2_payToken_6 - mortgage_fee_payToken_add_6 - nftOwnerT1_2_payToken_add_6 - nftOwnerT1_1_payToken_add_6,
      );
      expect(market_payToken_add_6)
        .eq(curve_buy_6 - curve_mortgage_6)
        .gt(0);

      // user2 multiply t2 35000 tokenid=7
      let result_7 = await info.appOperator
        .connect(user2)
        .multiply.staticCall(paramsT2.tid, multiply_amount_7, max);
      await info.appOperator
        .connect(user2)
        .multiply(paramsT2.tid, multiply_amount_7, max);


      let user1_payToken_7 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_7 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_7 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_7 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_7 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_7 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_7 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_7 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_7 = market_payToken_7 - market_payToken_6;
      let mortgage_fee_payToken_add_7 = mortgage_fee_payToken_7 - mortgage_fee_payToken_6;

      let nftOwnerT1_1_payToken_add_7 = nftOwnerT1_1_payToken_7 - nftOwnerT1_1_payToken_6;
      let nftOwnerT1_2_payToken_add_7 = nftOwnerT1_2_payToken_7 - nftOwnerT1_2_payToken_6;
      let nftOwnerT2_1_payToken_add_7 = nftOwnerT2_1_payToken_7 - nftOwnerT2_1_payToken_6;
      let nftOwnerT2_2_payToken_add_7 = nftOwnerT2_2_payToken_7 - nftOwnerT2_2_payToken_6;

      let curve_mortgage_7 = await info.marketKol.getPayTokenAmount(0, multiply_amount_7);
      let curve_buy_7 = await info.marketKol.getPayTokenAmount(multiply_amount_3 + multiply_amount_4, multiply_amount_7);
      // check
      expect(result_7.nftTokenId).eq(7);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_2_payToken_add_7 / nftOwnerT2_1_payToken_add_7).eq(19);
      expect(nftOwnerT1_2_payToken_add_7).eq(nftOwnerT1_1_payToken_add_7).eq(0);

      expect(curve_mortgage_7 / mortgage_fee_payToken_add_7).eq(1000);

      expect(curve_buy_7 / (nftOwnerT2_2_payToken_add_7 + nftOwnerT2_1_payToken_add_7)).eq(100);

      expect(user1_payToken_7).eq(user1_payToken_6);

      expect(market_payToken_add_7).eq(
        user2_payToken_6 - user2_payToken_7 - mortgage_fee_payToken_add_7 - nftOwnerT2_2_payToken_add_7 - nftOwnerT2_1_payToken_add_7,
      );
      expect(market_payToken_add_7)
        .eq(curve_buy_7 - curve_mortgage_7)
        .gt(0);

      // user2 multiply t2 45000 tokenid=8
      let result_8 = await info.appOperator
        .connect(user2)
        .multiply.staticCall(paramsT2.tid, multiply_amount_8, max);
      await info.appOperator
        .connect(user2)
        .multiply(paramsT2.tid, multiply_amount_8, max);

      let user1_payToken_8 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_8 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_8 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_8 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_8 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_8 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_8 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_8 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_8 = market_payToken_8 - market_payToken_7;
      let mortgage_fee_payToken_add_8 = mortgage_fee_payToken_8 - mortgage_fee_payToken_7;

      let nftOwnerT1_1_payToken_add_8 = nftOwnerT1_1_payToken_8 - nftOwnerT1_1_payToken_7;
      let nftOwnerT1_2_payToken_add_8 = nftOwnerT1_2_payToken_8 - nftOwnerT1_2_payToken_7;
      let nftOwnerT2_1_payToken_add_8 = nftOwnerT2_1_payToken_8 - nftOwnerT2_1_payToken_7;
      let nftOwnerT2_2_payToken_add_8 = nftOwnerT2_2_payToken_8 - nftOwnerT2_2_payToken_7;

      let curve_mortgage_8 = await info.marketKol.getPayTokenAmount(0, multiply_amount_8);
      let curve_buy_8 = await info.marketKol.getPayTokenAmount(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7,
        multiply_amount_8,
      );

      // check
      expect(result_8.nftTokenId).eq(8);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_2_payToken_add_8 / nftOwnerT2_1_payToken_add_8).eq(19);
      expect(nftOwnerT1_2_payToken_add_8).eq(nftOwnerT1_1_payToken_add_8).eq(0);

      expect(curve_mortgage_8 / mortgage_fee_payToken_add_8).eq(1000);

      expect(curve_buy_8 / (nftOwnerT2_2_payToken_add_8 + nftOwnerT2_1_payToken_add_8)).eq(100);

      expect(user1_payToken_8).eq(user1_payToken_7);

      expect(market_payToken_add_8).eq(
        user2_payToken_7 - user2_payToken_8 - mortgage_fee_payToken_add_8 - nftOwnerT2_2_payToken_add_8 - nftOwnerT2_1_payToken_add_8,
      );
      expect(market_payToken_add_8)
        .eq(curve_buy_8 - curve_mortgage_8)
        .gt(0);

      // user1 multiplyAdd t1 20000 tokenid=1
      let result_add_1 = await info.appOperator
        .connect(user1)
        .multiplyAdd.staticCall(result_1.nftTokenId, multiply_add_amount_1, max);
      await info.appOperator
        .connect(user1)
        .multiplyAdd(result_1.nftTokenId, multiply_add_amount_1, max);

      let user1_payToken_9 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_9 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_9 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_9 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_9 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_9 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_9 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_9 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_9 = market_payToken_9 - market_payToken_8;
      let mortgage_fee_payToken_add_9 = mortgage_fee_payToken_9 - mortgage_fee_payToken_8;

      let nftOwnerT1_1_payToken_add_9 = nftOwnerT1_1_payToken_9 - nftOwnerT1_1_payToken_8;
      let nftOwnerT1_2_payToken_add_9 = nftOwnerT1_2_payToken_9 - nftOwnerT1_2_payToken_8;
      let nftOwnerT2_1_payToken_add_9 = nftOwnerT2_1_payToken_9 - nftOwnerT2_1_payToken_8;
      let nftOwnerT2_2_payToken_add_9 = nftOwnerT2_2_payToken_9 - nftOwnerT2_2_payToken_8;

      let curve_mortgage_9 = await info.marketKol.getPayTokenAmount(multiply_amount_1, multiply_add_amount_1);
      let curve_buy_9 = await info.marketKol.getPayTokenAmount(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
        multiply_add_amount_1,
      );
      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6 + multiply_add_amount_1,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6 + multiply_add_amount_1,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_2_payToken_add_9 / nftOwnerT1_1_payToken_add_9).eq(19);
      expect(nftOwnerT2_2_payToken_add_9).eq(nftOwnerT2_1_payToken_add_9).eq(0);

      expect(curve_mortgage_9 / mortgage_fee_payToken_add_9).eq(1000);

      expect(curve_buy_9 / (nftOwnerT1_2_payToken_add_9 + nftOwnerT1_1_payToken_add_9)).eq(100);

      expect(user2_payToken_9).eq(user2_payToken_8);

      expect(market_payToken_add_9).eq(
        user1_payToken_8 -
        user1_payToken_9 -
        mortgage_fee_payToken_add_9 -
        nftOwnerT1_2_payToken_add_9 -
        nftOwnerT1_1_payToken_add_9,
      );
      expect(market_payToken_add_9)
        .eq(curve_buy_9 - curve_mortgage_9)
        .gt(0);

      // user1 multiplyAdd t1 30000 tokenid=2
      let result_add_2 = await info.appOperator
        .connect(user1)
        .multiplyAdd.staticCall(result_2.nftTokenId, multiply_add_amount_2, max);
      await info.appOperator
        .connect(user1)
        .multiplyAdd(result_2.nftTokenId, multiply_add_amount_2, max);

      let user1_payToken_10 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_10 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_10 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_10 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_10 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_10 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_10 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_10 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_10 = market_payToken_10 - market_payToken_9;
      let mortgage_fee_payToken_add_10 = mortgage_fee_payToken_10 - mortgage_fee_payToken_9;

      let nftOwnerT1_1_payToken_add_10 = nftOwnerT1_1_payToken_10 - nftOwnerT1_1_payToken_9;
      let nftOwnerT1_2_payToken_add_10 = nftOwnerT1_2_payToken_10 - nftOwnerT1_2_payToken_9;
      let nftOwnerT2_1_payToken_add_10 = nftOwnerT2_1_payToken_10 - nftOwnerT2_1_payToken_9;
      let nftOwnerT2_2_payToken_add_10 = nftOwnerT2_2_payToken_10 - nftOwnerT2_2_payToken_9;

      let curve_mortgage_10 = await info.marketKol.getPayTokenAmount(multiply_amount_2, multiply_add_amount_2);
      let curve_buy_10 = await info.marketKol.getPayTokenAmount(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6 + multiply_add_amount_1,
        multiply_add_amount_2,
      );
      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_2_payToken_add_10 / nftOwnerT1_1_payToken_add_10).eq(19);
      expect(nftOwnerT2_2_payToken_add_10).eq(nftOwnerT2_1_payToken_add_10).eq(0);

      expect(curve_mortgage_10 / mortgage_fee_payToken_add_10).eq(1000);

      expect(curve_buy_10 / (nftOwnerT1_2_payToken_add_10 + nftOwnerT1_1_payToken_add_10)).eq(100);

      expect(user2_payToken_10).eq(user2_payToken_9);

      expect(market_payToken_add_10).eq(
        user1_payToken_9 -
        user1_payToken_10 -
        mortgage_fee_payToken_add_10 -
        nftOwnerT1_2_payToken_add_10 -
        nftOwnerT1_1_payToken_add_10,
      );
      expect(market_payToken_add_10)
        .eq(curve_buy_10 - curve_mortgage_10)
        .gt(0);

      // user1 multiplyAdd t2 40000 tokenid=3
      let result_add_3 = await info.appOperator
        .connect(user1)
        .multiplyAdd.staticCall(result_3.nftTokenId, multiply_add_amount_3, max);
      await info.appOperator
        .connect(user1)
        .multiplyAdd(result_3.nftTokenId, multiply_add_amount_3, max);


      let user1_payToken_11 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_11 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_11 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_11 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_11 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_11 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_11 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_11 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_11 = market_payToken_11 - market_payToken_10;
      let mortgage_fee_payToken_add_11 = mortgage_fee_payToken_11 - mortgage_fee_payToken_10;

      let nftOwnerT1_1_payToken_add_11 = nftOwnerT1_1_payToken_11 - nftOwnerT1_1_payToken_10;
      let nftOwnerT1_2_payToken_add_11 = nftOwnerT1_2_payToken_11 - nftOwnerT1_2_payToken_10;
      let nftOwnerT2_1_payToken_add_11 = nftOwnerT2_1_payToken_11 - nftOwnerT2_1_payToken_10;
      let nftOwnerT2_2_payToken_add_11 = nftOwnerT2_2_payToken_11 - nftOwnerT2_2_payToken_10;

      let curve_mortgage_11 = await info.marketKol.getPayTokenAmount(multiply_amount_3, multiply_add_amount_3);
      let curve_buy_11 = await info.marketKol.getPayTokenAmount(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
        multiply_add_amount_3,
      );
      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8 + multiply_add_amount_3,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8 + multiply_add_amount_3,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_2_payToken_add_11 / nftOwnerT2_1_payToken_add_11).eq(19);
      expect(nftOwnerT1_2_payToken_add_11).eq(nftOwnerT1_1_payToken_add_11).eq(0);

      expect(curve_mortgage_11 / mortgage_fee_payToken_add_11).eq(1000);

      expect(curve_buy_11 / (nftOwnerT2_2_payToken_add_11 + nftOwnerT2_1_payToken_add_11)).eq(100);

      expect(user2_payToken_11).eq(user2_payToken_10);

      expect(market_payToken_add_11).eq(
        user1_payToken_10 -
        user1_payToken_11 -
        mortgage_fee_payToken_add_11 -
        nftOwnerT2_2_payToken_add_11 -
        nftOwnerT2_1_payToken_add_11,
      );
      expect(market_payToken_add_11)
        .eq(curve_buy_11 - curve_mortgage_11)
        .gt(0);

      // user1 multiplyAdd t2 50000 tokenid=4
      let result_add_4 = await info.appOperator
        .connect(user1)
        .multiplyAdd.staticCall(result_4.nftTokenId, multiply_add_amount_4, max);
      await info.appOperator
        .connect(user1)
        .multiplyAdd(result_4.nftTokenId, multiply_add_amount_4, max);

      let user1_payToken_12 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_12 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_12 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_12 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_12 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_12 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_12 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_12 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_12 = market_payToken_12 - market_payToken_11;
      let mortgage_fee_payToken_add_12 = mortgage_fee_payToken_12 - mortgage_fee_payToken_11;

      let nftOwnerT1_1_payToken_add_12 = nftOwnerT1_1_payToken_12 - nftOwnerT1_1_payToken_11;
      let nftOwnerT1_2_payToken_add_12 = nftOwnerT1_2_payToken_12 - nftOwnerT1_2_payToken_11;
      let nftOwnerT2_1_payToken_add_12 = nftOwnerT2_1_payToken_12 - nftOwnerT2_1_payToken_11;
      let nftOwnerT2_2_payToken_add_12 = nftOwnerT2_2_payToken_12 - nftOwnerT2_2_payToken_11;

      let curve_mortgage_12 = await info.marketKol.getPayTokenAmount(multiply_amount_4, multiply_add_amount_4);
      let curve_buy_12 = await info.marketKol.getPayTokenAmount(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8 + multiply_add_amount_3,
        multiply_add_amount_4,
      );
      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_2_payToken_add_12 / nftOwnerT2_1_payToken_add_12).eq(19);
      expect(nftOwnerT1_2_payToken_add_12).eq(nftOwnerT1_1_payToken_add_12).eq(0);

      expect(curve_mortgage_12 / mortgage_fee_payToken_add_12).eq(1000);

      expect(curve_buy_12 / (nftOwnerT2_2_payToken_add_12 + nftOwnerT2_1_payToken_add_12)).eq(100);

      expect(user2_payToken_12).eq(user2_payToken_11);

      expect(market_payToken_add_12).eq(
        user1_payToken_11 -
        user1_payToken_12 -
        mortgage_fee_payToken_add_12 -
        nftOwnerT2_2_payToken_add_12 -
        nftOwnerT2_1_payToken_add_12,
      );
      expect(market_payToken_add_12)
        .eq(curve_buy_12 - curve_mortgage_12)
        .gt(0);
      // user2 multiplyAdd t1 25000 tokenid=5
      let result_add_5 = await info.appOperator
        .connect(user2)
        .multiplyAdd.staticCall(result_5.nftTokenId, multiply_add_amount_5, max);
      await info.appOperator
        .connect(user2)
        .multiplyAdd(result_5.nftTokenId, multiply_add_amount_5, max);

      let user1_payToken_13 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_13 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_13 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_13 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_13 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_13 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_13 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_13 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_13 = market_payToken_13 - market_payToken_12;
      let mortgage_fee_payToken_add_13 = mortgage_fee_payToken_13 - mortgage_fee_payToken_12;

      let nftOwnerT1_1_payToken_add_13 = nftOwnerT1_1_payToken_13 - nftOwnerT1_1_payToken_12;
      let nftOwnerT1_2_payToken_add_13 = nftOwnerT1_2_payToken_13 - nftOwnerT1_2_payToken_12;
      let nftOwnerT2_1_payToken_add_13 = nftOwnerT2_1_payToken_13 - nftOwnerT2_1_payToken_12;
      let nftOwnerT2_2_payToken_add_13 = nftOwnerT2_2_payToken_13 - nftOwnerT2_2_payToken_12;

      let curve_mortgage_13 = await info.marketKol.getPayTokenAmount(multiply_amount_5, multiply_add_amount_5);
      let curve_buy_13 = await info.marketKol.getPayTokenAmount(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
        multiply_add_amount_5,
      );
      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_2_payToken_add_13 / nftOwnerT1_1_payToken_add_13).eq(19);
      expect(nftOwnerT2_2_payToken_add_13).eq(nftOwnerT2_1_payToken_add_13).eq(0);

      expect(curve_mortgage_13 / mortgage_fee_payToken_add_13).eq(1000);

      expect(curve_buy_13 / (nftOwnerT1_2_payToken_add_13 + nftOwnerT1_1_payToken_add_13)).eq(100);

      expect(user1_payToken_13).eq(user1_payToken_12);

      expect(market_payToken_add_13).eq(
        user2_payToken_12 -
        user2_payToken_13 -
        mortgage_fee_payToken_add_13 -
        nftOwnerT1_2_payToken_add_13 -
        nftOwnerT1_1_payToken_add_13,
      );
      expect(market_payToken_add_13)
        .eq(curve_buy_13 - curve_mortgage_13)
        .gt(0);

      // user2 multiplyAdd t1 35000 tokenid=6
      let result_add_6 = await info.appOperator
        .connect(user2)
        .multiplyAdd.staticCall(result_6.nftTokenId, multiply_add_amount_6, max);
      await info.appOperator
        .connect(user2)
        .multiplyAdd(result_6.nftTokenId, multiply_add_amount_6, max);

      let user1_payToken_14 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_14 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_14 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_14 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_14 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_14 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_14 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_14 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_14 = market_payToken_14 - market_payToken_13;
      let mortgage_fee_payToken_add_14 = mortgage_fee_payToken_14 - mortgage_fee_payToken_13;

      let nftOwnerT1_1_payToken_add_14 = nftOwnerT1_1_payToken_14 - nftOwnerT1_1_payToken_13;
      let nftOwnerT1_2_payToken_add_14 = nftOwnerT1_2_payToken_14 - nftOwnerT1_2_payToken_13;
      let nftOwnerT2_1_payToken_add_14 = nftOwnerT2_1_payToken_14 - nftOwnerT2_1_payToken_13;
      let nftOwnerT2_2_payToken_add_14 = nftOwnerT2_2_payToken_14 - nftOwnerT2_2_payToken_13;

      let curve_mortgage_14 = await info.marketKol.getPayTokenAmount(multiply_amount_6, multiply_add_amount_6);
      let curve_buy_14 = await info.marketKol.getPayTokenAmount(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5,
        multiply_add_amount_6,
      );
      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_2_payToken_add_14 / nftOwnerT1_1_payToken_add_14).eq(19);
      expect(nftOwnerT2_2_payToken_add_14).eq(nftOwnerT2_1_payToken_add_14).eq(0);

      expect(curve_mortgage_14 / mortgage_fee_payToken_add_14).eq(1000);

      expect(curve_buy_14 / (nftOwnerT1_2_payToken_add_14 + nftOwnerT1_1_payToken_add_14)).eq(100);

      expect(user1_payToken_14).eq(user1_payToken_13);

      expect(market_payToken_add_14).eq(
        user2_payToken_13 -
        user2_payToken_14 -
        mortgage_fee_payToken_add_14 -
        nftOwnerT1_2_payToken_add_14 -
        nftOwnerT1_1_payToken_add_14,
      );
      expect(market_payToken_add_14)
        .eq(curve_buy_14 - curve_mortgage_14)
        .gt(0);

      // user2 multiplyAdd t2 45000 tokenid=7
      let result_add_7 = await info.appOperator
        .connect(user2)
        .multiplyAdd.staticCall(result_7.nftTokenId, multiply_add_amount_7, max);
      await info.appOperator
        .connect(user2)
        .multiplyAdd(result_7.nftTokenId, multiply_add_amount_7, max);

      let user1_payToken_15 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_15 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_15 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_15 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_15 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_15 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_15 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_15 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_15 = market_payToken_15 - market_payToken_14;
      let mortgage_fee_payToken_add_15 = mortgage_fee_payToken_15 - mortgage_fee_payToken_14;

      let nftOwnerT1_1_payToken_add_15 = nftOwnerT1_1_payToken_15 - nftOwnerT1_1_payToken_14;
      let nftOwnerT1_2_payToken_add_15 = nftOwnerT1_2_payToken_15 - nftOwnerT1_2_payToken_14;
      let nftOwnerT2_1_payToken_add_15 = nftOwnerT2_1_payToken_15 - nftOwnerT2_1_payToken_14;
      let nftOwnerT2_2_payToken_add_15 = nftOwnerT2_2_payToken_15 - nftOwnerT2_2_payToken_14;

      let curve_mortgage_15 = await info.marketKol.getPayTokenAmount(multiply_amount_7, multiply_add_amount_7);
      let curve_buy_15 = await info.marketKol.getPayTokenAmount(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
        multiply_add_amount_7,
      );
      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_2_payToken_add_15 / nftOwnerT2_1_payToken_add_15).eq(19);
      expect(nftOwnerT1_2_payToken_add_15).eq(nftOwnerT1_1_payToken_add_15).eq(0);

      expect(curve_mortgage_15 / mortgage_fee_payToken_add_15).eq(1000);

      expect(curve_buy_15 / (nftOwnerT2_2_payToken_add_15 + nftOwnerT2_1_payToken_add_15)).eq(100);

      expect(user1_payToken_15).eq(user1_payToken_14);

      expect(market_payToken_add_15).eq(
        user2_payToken_14 -
        user2_payToken_15 -
        mortgage_fee_payToken_add_15 -
        nftOwnerT2_2_payToken_add_15 -
        nftOwnerT2_1_payToken_add_15,
      );
      expect(market_payToken_add_15)
        .eq(curve_buy_15 - curve_mortgage_15)
        .gt(0);

      // user2 multiplyAdd t2 55000 tokenid=8
      let result_add_8 = await info.appOperator
        .connect(user2)
        .multiplyAdd.staticCall(result_8.nftTokenId, multiply_add_amount_8, max);
      let tx_add_8 = await info.appOperator
        .connect(user2)
        .multiplyAdd(result_8.nftTokenId, multiply_add_amount_8, max);

      let user1_payToken_16 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_16 = await info.simpleToken.balanceOf(user2.address);
      let nftOwnerT1_1_payToken_16 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_16 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_16 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_16 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let mortgage_fee_payToken_16 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_16 = await info.simpleToken.balanceOf(info.marketKol.getAddress());

      let market_payToken_add_16 = market_payToken_16 - market_payToken_15;
      let mortgage_fee_payToken_add_16 = mortgage_fee_payToken_16 - mortgage_fee_payToken_15;

      let nftOwnerT1_1_payToken_add_16 = nftOwnerT1_1_payToken_16 - nftOwnerT1_1_payToken_15;
      let nftOwnerT1_2_payToken_add_16 = nftOwnerT1_2_payToken_16 - nftOwnerT1_2_payToken_15;
      let nftOwnerT2_1_payToken_add_16 = nftOwnerT2_1_payToken_16 - nftOwnerT2_1_payToken_15;
      let nftOwnerT2_2_payToken_add_16 = nftOwnerT2_2_payToken_16 - nftOwnerT2_2_payToken_15;

      let curve_mortgage_16 = await info.marketKol.getPayTokenAmount(multiply_amount_8, multiply_add_amount_8);
      let curve_buy_16 = await info.marketKol.getPayTokenAmount(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7,
        multiply_add_amount_8,
      );
      // check
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7 +
        multiply_add_amount_8,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7 +
        multiply_add_amount_8,
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2_2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_2_payToken_add_16 / nftOwnerT2_1_payToken_add_16).eq(19);
      expect(nftOwnerT1_2_payToken_add_16).eq(nftOwnerT1_1_payToken_add_16).eq(0);

      expect(curve_mortgage_16 / mortgage_fee_payToken_add_16).eq(1000);

      expect(curve_buy_16 / (nftOwnerT2_2_payToken_add_16 + nftOwnerT2_1_payToken_add_16)).eq(100);

      expect(user1_payToken_16).eq(user1_payToken_15);

      expect(market_payToken_add_16).eq(
        user2_payToken_15 -
        user2_payToken_16 -
        mortgage_fee_payToken_add_16 -
        nftOwnerT2_2_payToken_add_16 -
        nftOwnerT2_1_payToken_add_16,
      );
      expect(market_payToken_add_16)
        .eq(curve_buy_16 - curve_mortgage_16)
        .gt(0);
    });

    it("multiply table", async function () {
      let amounts = [
        "83333.333",
        "153846.154",
        "214285.714",
        "266666.667",
        "312500.0",
        "352941.176",
        "388888.889",
        "421052.63",
        "450000.002",
        "476190.476",
        "645161.293",
        "731707.318",
        "784313.726",
        "819672.133",
        "845070.429",
        "864197.531",
        "879120.875",
        "891089.11",
        "900900.901",
        "947867.299",
        "964630.225",
        "973236.003",
        "978473.578",
        "981996.727",
        "984528.836",
        "986436.498",
        "987925.353",
        "989119.684",
        "994530.085",
        "996346.729",
        "997257.542",
        "997804.83",
        "998170.022",
        "998431.038",
        "998626.888",
        "998779.27",
        "998901.21",
        "999450.304",
        "999633.468",
        "999725.076",
        "999780.052",
        "999816.706",
        "999842.882",
        "999862.52",
        "999877.798",
      ];

      let data = [];
      for (let i = 0; i < amounts.length; i++) {
        let wei = BigInt(10) ** BigInt(18);
        let amount = new Decimal(amounts[i]).times(new Decimal(wei.toString())).toFixed(0);

        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.erc20Proxy;

        let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 5];

        // create token
        let paramsT1 = {
          tid: "t1",
          tData: "0x11",
          cfntOwner: nftOwnerT1_1.address,
          ofntOwner: nftOwnerT1_2.address,
        };
        await info.appOperator
          .createToken(
            paramsT1.tid,
            paramsT1.tData,
            paramsT1.cfntOwner,
            paramsT1.ofntOwner,
          );

        await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))
        await info.simpleToken.connect(user1).approve(await info.appOperator.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

        let max = BigInt(10) ** BigInt(18) * BigInt(1000000);
        let mortgage_fee_payToken_1 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

        // multiply
        let result = await info.appOperator
          .connect(user1)
          .multiply.staticCall(paramsT1.tid, amount, max);
        await info.appOperator.connect(user1).multiply(paramsT1.tid, amount, max);

        let mortgage_fee_payToken_2 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

        let mortgage_fee_payToken_add = mortgage_fee_payToken_2 - mortgage_fee_payToken_1;

        // xxx
        let payToken = new Decimal(result.payTokenAmount.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        // 10**45 / ((10**24 - x)**2)
        let a = BigInt(10) ** BigInt(45);
        let b = (BigInt(10) ** BigInt(24) - BigInt(amount)) ** BigInt(2);
        let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

        let mcapWei = await info.kolCurve.curveMath(0, amount);
        let mcap = new Decimal(mcapWei.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        let pst = new Decimal(amount.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        let p = new Decimal(pst.toString()).times(new Decimal("100")).dividedBy(new Decimal("1000000")).toFixed(1);

        let mfeeWei = mortgage_fee_payToken_add;
        let mfee = new Decimal(mfeeWei.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        data.push({
          payToken: payToken,
          price: price,
          mcap: mcap,
          pst: pst,
          pp: p,
          mfee: mfee,
        });
      }
      console.log(data);
    });
  });
});
