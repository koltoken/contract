import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { getTokenAmountWei } from "./shared/utils";

describe("Market", function () {
  describe("merge", function () {
    it("merge revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.eth;

      let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      await info.foundry.connect(info.kolOwnerWallet).setAppOperator(info.appId, newAppOperatorWallet.address);
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT1_1.address, nftOwnerT1_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.nftPercents,
          paramsT1.nftOwers,
          paramsT1.nftData,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT2_1.address, nftOwnerT2_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.nftPercents,
          paramsT2.nftOwers,
          paramsT2.nftData,
        );

      // user1 buy and mortgage 10000 t1 token=1
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.marketKol.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));
      //
      // merge not tokenid
      await expect(info.marketKol.connect(user1).merge(1, 10)).rejectedWith("ERC721: invalid token ID");
      await expect(info.marketKol.connect(user1).merge(10, 1)).rejectedWith("ERC721: invalid token ID");
      await expect(info.marketKol.connect(user1).merge(9, 10)).rejectedWith("ERC721: invalid token ID");
      // merge deleted tokenid
      // redeem 7 and 3
      await info.marketKol.connect(user2).redeem(7, getTokenAmountWei(35000), {
        value: BigInt(10) ** BigInt(18) * BigInt(10000),
      });
      await info.marketKol.connect(user1).redeem(3, getTokenAmountWei(30000), {
        value: BigInt(10) ** BigInt(18) * BigInt(10000),
      });
      await expect(info.mortgageNFTKol.ownerOf(7)).revertedWith("ERC721: invalid token ID");
      await expect(info.mortgageNFTKol.ownerOf(3)).revertedWith("ERC721: invalid token ID");

      await expect(info.marketKol.connect(user1).merge(1, 7)).rejectedWith("ERC721: invalid token ID");
      await expect(info.marketKol.connect(user1).merge(7, 1)).rejectedWith("ERC721: invalid token ID");
      await expect(info.marketKol.connect(user1).merge(7, 3)).rejectedWith("ERC721: invalid token ID");

      // merge other user tokenid
      await expect(info.marketKol.connect(user1).merge(1, 5)).rejectedWith("AOE2");
      await expect(info.marketKol.connect(user1).merge(5, 1)).rejectedWith("AOE1");

      // merge other tid tokenid
      await expect(info.marketKol.connect(user1).merge(1, 4)).rejectedWith("TE");
    });

    it("merge self nft smail merge big and result", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.eth;

      let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      await info.foundry.connect(info.kolOwnerWallet).setAppOperator(info.appId, newAppOperatorWallet.address);
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT1_1.address, nftOwnerT1_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.nftPercents,
          paramsT1.nftOwers,
          paramsT1.nftData,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT2_1.address, nftOwnerT2_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.nftPercents,
          paramsT2.nftOwers,
          paramsT2.nftData,
        );

      // user1 buy and mortgage 10000 t1 token=1
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.marketKol.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      let getGas = async function (tx: any) {
        let result = await tx.wait();
        let gas = BigInt(0);
        if (result) {
          gas = BigInt(result.gasPrice * result.gasUsed);
        }
        return gas;
      };

      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);

      expect(await info.mortgageNFTKol.ownerOf(2)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_eth_1 = await ethers.provider.getBalance(user1.address);
      let user2_eth_1 = await ethers.provider.getBalance(user2.address);
      let marketKol_eth_1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
      let mortgage_eth_1 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

      let nftOwnerT1_1_Eth = await ethers.provider.getBalance(nftOwnerT1_1);
      let nftOwnerT1_2_Eth = await ethers.provider.getBalance(nftOwnerT1_2);
      let nftOwnerT2_1_Eth = await ethers.provider.getBalance(nftOwnerT2_1);
      let nftOwnerT2_2_Eth = await ethers.provider.getBalance(nftOwnerT2_2);

      let user_get_eth_1 = await info.marketKol.connect(user1).merge.staticCall(1, 2);
      let tx_1 = await info.marketKol.connect(user1).merge(1, 2);
      let gas_1 = await getGas(tx_1);

      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000) + getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);

      await expect(info.mortgageNFTKol.ownerOf(2)).revertedWith("ERC721: invalid token ID");
      expect((await info.mortgageNFTKol.info(2)).amount).eq("");
      expect((await info.mortgageNFTKol.info(2)).tid).eq("");

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await ethers.provider.getBalance(nftOwnerT1_1)).eq(nftOwnerT1_1_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT1_2)).eq(nftOwnerT1_2_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT2_1)).eq(nftOwnerT2_1_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT2_2)).eq(nftOwnerT2_2_Eth);

      let user1_eth_2 = await ethers.provider.getBalance(user1.address);
      let user2_eth_2 = await ethers.provider.getBalance(user2.address);
      let marketKol_eth_2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
      let mortgage_eth_2 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

      expect(user2_eth_2).eq(user2_eth_1);

      let curve_nft_1_new = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000));
      let curve_nft_1_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(10000));
      let curve_nft_2_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(20000));
      expect(marketKol_eth_1 - marketKol_eth_2).eq(curve_nft_1_new - curve_nft_1_old - curve_nft_2_old);
      expect(marketKol_eth_1 - marketKol_eth_2).eq(
        user1_eth_2 - user1_eth_1 + gas_1 + (mortgage_eth_2 - mortgage_eth_1),
      );
      expect((marketKol_eth_1 - marketKol_eth_2) / (mortgage_eth_2 - mortgage_eth_1)).eq(1000);

      expect(user1_eth_2 - user1_eth_1 + gas_1).eq(user_get_eth_1);

      // end
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(2)).tid).eq("");
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(2)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));

      let kol_eth_add =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let kol_eth_remove =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(45000)));

      expect(kol_eth_add - kol_eth_remove).eq(await ethers.provider.getBalance(await info.marketKol.getAddress()));
    });

    it("merge self nft big merge smail", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.eth;

      let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      await info.foundry.connect(info.kolOwnerWallet).setAppOperator(info.appId, newAppOperatorWallet.address);
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT1_1.address, nftOwnerT1_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.nftPercents,
          paramsT1.nftOwers,
          paramsT1.nftData,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT2_1.address, nftOwnerT2_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.nftPercents,
          paramsT2.nftOwers,
          paramsT2.nftData,
        );

      // user1 buy and mortgage 10000 t1 token=1
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.marketKol.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      let getGas = async function (tx: any) {
        let result = await tx.wait();
        let gas = BigInt(0);
        if (result) {
          gas = BigInt(result.gasPrice * result.gasUsed);
        }
        return gas;
      };

      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);

      expect(await info.mortgageNFTKol.ownerOf(2)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_eth_1 = await ethers.provider.getBalance(user1.address);
      let user2_eth_1 = await ethers.provider.getBalance(user2.address);
      let marketKol_eth_1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
      let mortgage_eth_1 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

      let nftOwnerT1_1_Eth = await ethers.provider.getBalance(nftOwnerT1_1);
      let nftOwnerT1_2_Eth = await ethers.provider.getBalance(nftOwnerT1_2);
      let nftOwnerT2_1_Eth = await ethers.provider.getBalance(nftOwnerT2_1);
      let nftOwnerT2_2_Eth = await ethers.provider.getBalance(nftOwnerT2_2);

      let tx_1 = await info.marketKol.connect(user1).merge(2, 1);
      let gas_1 = await getGas(tx_1);

      await expect(info.mortgageNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      expect((await info.mortgageNFTKol.info(1)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(1)).tid).eq("");

      expect(await info.mortgageNFTKol.ownerOf(2)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(10000) + getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await ethers.provider.getBalance(nftOwnerT1_1)).eq(nftOwnerT1_1_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT1_2)).eq(nftOwnerT1_2_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT2_1)).eq(nftOwnerT2_1_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT2_2)).eq(nftOwnerT2_2_Eth);

      let user1_eth_2 = await ethers.provider.getBalance(user1.address);
      let user2_eth_2 = await ethers.provider.getBalance(user2.address);
      let marketKol_eth_2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
      let mortgage_eth_2 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

      expect(user2_eth_2).eq(user2_eth_1);

      let curve_nft_2_new = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000));
      let curve_nft_1_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(10000));
      let curve_nft_2_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(20000));
      expect(marketKol_eth_1 - marketKol_eth_2).eq(curve_nft_2_new - curve_nft_1_old - curve_nft_2_old);
      expect(marketKol_eth_1 - marketKol_eth_2).eq(
        user1_eth_2 - user1_eth_1 + gas_1 + (mortgage_eth_2 - mortgage_eth_1),
      );
      expect((marketKol_eth_1 - marketKol_eth_2) / (mortgage_eth_2 - mortgage_eth_1)).eq(1000);

      // end
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect((await info.mortgageNFTKol.info(1)).tid).eq("");
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));

      let kol_eth_add =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let kol_eth_remove =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(45000)));

      expect(kol_eth_add - kol_eth_remove).eq(await ethers.provider.getBalance(await info.marketKol.getAddress()));
    });

    it("merge self nft merge other user nft", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.eth;

      let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      await info.foundry.connect(info.kolOwnerWallet).setAppOperator(info.appId, newAppOperatorWallet.address);
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT1_1.address, nftOwnerT1_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.nftPercents,
          paramsT1.nftOwers,
          paramsT1.nftData,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT2_1.address, nftOwnerT2_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.nftPercents,
          paramsT2.nftOwers,
          paramsT2.nftData,
        );

      // user1 buy and mortgage 10000 t1 token=1
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.marketKol.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      await info.mortgageNFTKol.connect(user2).approve(user1.address, 5);

      let getGas = async function (tx: any) {
        let result = await tx.wait();
        let gas = BigInt(0);
        if (result) {
          gas = BigInt(result.gasPrice * result.gasUsed);
        }
        return gas;
      };

      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);

      expect(await info.mortgageNFTKol.ownerOf(5)).eq(user2.address);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_eth_1 = await ethers.provider.getBalance(user1.address);
      let user2_eth_1 = await ethers.provider.getBalance(user2.address);
      let marketKol_eth_1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
      let mortgage_eth_1 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

      let nftOwnerT1_1_Eth = await ethers.provider.getBalance(nftOwnerT1_1);
      let nftOwnerT1_2_Eth = await ethers.provider.getBalance(nftOwnerT1_2);
      let nftOwnerT2_1_Eth = await ethers.provider.getBalance(nftOwnerT2_1);
      let nftOwnerT2_2_Eth = await ethers.provider.getBalance(nftOwnerT2_2);

      let tx_1 = await info.marketKol.connect(user1).merge(1, 5);
      let gas_1 = await getGas(tx_1);

      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000) + getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);

      await expect(info.mortgageNFTKol.ownerOf(5)).revertedWith("ERC721: invalid token ID");
      expect((await info.mortgageNFTKol.info(5)).amount).eq("");
      expect((await info.mortgageNFTKol.info(5)).tid).eq("");

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await ethers.provider.getBalance(nftOwnerT1_1)).eq(nftOwnerT1_1_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT1_2)).eq(nftOwnerT1_2_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT2_1)).eq(nftOwnerT2_1_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT2_2)).eq(nftOwnerT2_2_Eth);

      let user1_eth_2 = await ethers.provider.getBalance(user1.address);
      let user2_eth_2 = await ethers.provider.getBalance(user2.address);
      let marketKol_eth_2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
      let mortgage_eth_2 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

      expect(user2_eth_2).eq(user2_eth_1);

      let curve_nft_1_new = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000));
      let curve_nft_1_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(10000));
      let curve_nft_5_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000));
      expect(marketKol_eth_1 - marketKol_eth_2).eq(curve_nft_1_new - curve_nft_1_old - curve_nft_5_old);
      expect(marketKol_eth_1 - marketKol_eth_2).eq(
        user1_eth_2 - user1_eth_1 + gas_1 + (mortgage_eth_2 - mortgage_eth_1),
      );
      expect((marketKol_eth_1 - marketKol_eth_2) / (mortgage_eth_2 - mortgage_eth_1)).eq(1000);

      // end
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq("");
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(0);
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));

      let kol_eth_add =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let kol_eth_remove =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(20000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(45000)));

      expect(kol_eth_add - kol_eth_remove).eq(await ethers.provider.getBalance(await info.marketKol.getAddress()));
    });

    it("merge other user nft merge self nft", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.eth;

      let newAppOperatorWallet = info.wallets[info.nextWalletIndex];
      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      await info.foundry.connect(info.kolOwnerWallet).setAppOperator(info.appId, newAppOperatorWallet.address);
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT1_1.address, nftOwnerT1_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT1.tid,
          paramsT1.tData,
          paramsT1.nftPercents,
          paramsT1.nftOwers,
          paramsT1.nftData,
        );

      let paramsT2 = {
        tid: "t2",
        tData: "0x11",
        nftPercents: [5000, 95000],
        nftOwers: [nftOwnerT2_1.address, nftOwnerT2_2.address],
        nftData: ["0x22", "0x33"],
      };
      await info.foundry
        .connect(newAppOperatorWallet)
        .createToken(
          info.appId,
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.nftPercents,
          paramsT2.nftOwers,
          paramsT2.nftData,
        );

      // user1 buy and mortgage 10000 t1 token=1
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.marketKol.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.marketKol
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000), { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.marketKol.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      await info.mortgageNFTKol.connect(user2).approve(user1.address, 5);

      let getGas = async function (tx: any) {
        let result = await tx.wait();
        let gas = BigInt(0);
        if (result) {
          gas = BigInt(result.gasPrice * result.gasUsed);
        }
        return gas;
      };

      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFTKol.info(1)).tid).eq(paramsT1.tid);

      expect(await info.mortgageNFTKol.ownerOf(5)).eq(user2.address);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_eth_1 = await ethers.provider.getBalance(user1.address);
      let user2_eth_1 = await ethers.provider.getBalance(user2.address);
      let marketKol_eth_1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
      let mortgage_eth_1 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

      let nftOwnerT1_1_Eth = await ethers.provider.getBalance(nftOwnerT1_1);
      let nftOwnerT1_2_Eth = await ethers.provider.getBalance(nftOwnerT1_2);
      let nftOwnerT2_1_Eth = await ethers.provider.getBalance(nftOwnerT2_1);
      let nftOwnerT2_2_Eth = await ethers.provider.getBalance(nftOwnerT2_2);

      let tx_1 = await info.marketKol.connect(user1).merge(5, 1);
      let gas_1 = await getGas(tx_1);

      await expect(info.mortgageNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      expect((await info.mortgageNFTKol.info(1)).amount).eq("");
      expect((await info.mortgageNFTKol.info(1)).tid).eq("");

      expect(await info.mortgageNFTKol.ownerOf(5)).eq(user2.address);
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(10000) + getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await ethers.provider.getBalance(nftOwnerT1_1)).eq(nftOwnerT1_1_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT1_2)).eq(nftOwnerT1_2_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT2_1)).eq(nftOwnerT2_1_Eth);
      expect(await ethers.provider.getBalance(nftOwnerT2_2)).eq(nftOwnerT2_2_Eth);

      let user1_eth_2 = await ethers.provider.getBalance(user1.address);
      let user2_eth_2 = await ethers.provider.getBalance(user2.address);
      let marketKol_eth_2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
      let mortgage_eth_2 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);

      expect(user2_eth_2).eq(user2_eth_1);

      let curve_nft_5_new = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000));
      let curve_nft_1_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(10000));
      let curve_nft_5_old = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000));
      expect(marketKol_eth_1 - marketKol_eth_2).eq(curve_nft_5_new - curve_nft_1_old - curve_nft_5_old);
      expect(marketKol_eth_1 - marketKol_eth_2).eq(
        user1_eth_2 - user1_eth_1 + gas_1 + (mortgage_eth_2 - mortgage_eth_1),
      );
      expect((marketKol_eth_1 - marketKol_eth_2) / (mortgage_eth_2 - mortgage_eth_1)).eq(1000);

      // end
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect((await info.mortgageNFTKol.info(1)).tid).eq("");
      expect((await info.mortgageNFTKol.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFTKol.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFTKol.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFTKol.info(1)).amount).eq("");
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000) + getTokenAmountWei(10000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));

      let kol_eth_add =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let kol_eth_remove =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(20000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(45000)));

      expect(kol_eth_add - kol_eth_remove).eq(await ethers.provider.getBalance(await info.marketKol.getAddress()));
    });
  });
});
