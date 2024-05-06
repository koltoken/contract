import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { getTokenAmountWei } from "./shared/utils";

describe("Market", function () {
  describe("cash.proxy", function () {
    it("cash revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.ethProxy;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOnwer: nftOwner1.address,
        onftOnwer: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOnwer, params.onftOnwer);

      await info.appOperator
        .connect(user1)
        .buy(params.tid, getTokenAmountWei(1000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(10000) });
      await info.appOperator
        .connect(user2)
        .buy(params.tid, getTokenAmountWei(1000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(10000) });
      await info.appOperator.connect(user1).mortgage(params.tid, getTokenAmountWei(1000));
      await info.appOperator.connect(user2).mortgage(params.tid, getTokenAmountWei(1000));
      expect(await info.mortgageNFTKol.ownerOf(1)).eq(user1.address);
      expect(await info.mortgageNFTKol.ownerOf(2)).eq(user2.address);
      await info.appOperator
        .connect(user1)
        .redeem(1, getTokenAmountWei(1000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(10000) });
      await expect(info.mortgageNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      // cash not tokenid
      await expect(info.appOperator.connect(user1).cash(5, 100)).revertedWith("ERC721: invalid token ID");
      // cash deleted tokenid
      await expect(info.appOperator.connect(user1).cash(1, 10)).revertedWith("ERC721: invalid token ID");
      // cash other user tokenid
      await expect(info.appOperator.connect(user1).cash(2, 10)).revertedWith("AOE");

      // cash not enough
      await expect(info.appOperator.connect(user2).cash(2, getTokenAmountWei(3000))).revertedWith("TAE");
      // cash 0
      await expect(info.appOperator.connect(user2).cash(2, 0)).revertedWith("TAE");
      // cash no eth get
      await expect(info.appOperator.connect(user2).cash(2, getTokenAmountWei(10))).revertedWith("CE");
    });

    it("cash", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.ethProxy;

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

      // user1 buy and mortgage 10000 t1 token=1
      await info.appOperator
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.appOperator.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.appOperator.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.appOperator
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.appOperator.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.appOperator
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.appOperator.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.appOperator
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.appOperator.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.appOperator
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.appOperator.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.appOperator
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.appOperator.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.appOperator
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.appOperator.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.appOperator
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000), 0, { value: BigInt(10) ** BigInt(18) * BigInt(1000) });
      await info.appOperator.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));
      //

      let getGas = async function (tx: any) {
        let result = await tx.wait();
        let gas = BigInt(0);
        if (result) {
          gas = BigInt(result.gasPrice * result.gasUsed);
        }
        return gas;
      };

      /**
       * cash (redeem and sell)
       * cash part success ok
       * nft amount change - ok
       * market token change - ok
       * total supoort - ok
       * user token no change ok
       * user get eth ok
       * mortgage no eth ok
       * cnft add eth ok
       * onft add eth ok
       * curve_sell - cnft_fee - onft_fee - curve_redeem = user get eth ok
       */
      let user1_tid1_0 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user1_tid2_0 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_tid1_0 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user2_tid2_0 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let user1_eth_0 = await ethers.provider.getBalance(user1.address);
      let user2_eth_0 = await ethers.provider.getBalance(user2.address);
      let mortgage_eth_0 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);
      let nftOwnerT1_1_eth_0 = await ethers.provider.getBalance(nftOwnerT1_1.address);
      let nftOwnerT1_2_eth_0 = await ethers.provider.getBalance(nftOwnerT1_2.address);
      let nftOwnerT2_1_eth_0 = await ethers.provider.getBalance(nftOwnerT2_1.address);
      let nftOwnerT2_2_eth_0 = await ethers.provider.getBalance(nftOwnerT2_2.address);
      let marketKol_eth_0 = await ethers.provider.getBalance(await info.marketKol.getAddress());

      let curve_sell_0 = await info.marketKol.getSellPayTokenAmount(paramsT1.tid, getTokenAmountWei(1000));
      expect(curve_sell_0).eq(
        await info.marketKol.getPayTokenAmount(getTokenAmountWei(70000) - getTokenAmountWei(1000), getTokenAmountWei(1000)),
      );
      let curve_redeem_0 = await info.marketKol.getPayTokenAmount(
        getTokenAmountWei(10000) - getTokenAmountWei(1000),
        getTokenAmountWei(1000),
      );

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000));
      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let userGetEth_0 = await info.appOperator.connect(user1).cash.staticCall(1, getTokenAmountWei(1000));
      let tx_0 = await info.appOperator.connect(user1).cash(1, getTokenAmountWei(1000));
      let gas_0 = await getGas(tx_0);

      expect((await info.mortgageNFTKol.info(1)).amount).eq(getTokenAmountWei(10000) - getTokenAmountWei(1000));
      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000),
      );
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000) - getTokenAmountWei(1000));
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_tid1_1 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user1_tid2_1 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_tid1_1 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user2_tid2_1 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let user1_eth_1 = await ethers.provider.getBalance(user1.address);
      let user2_eth_1 = await ethers.provider.getBalance(user2.address);
      let mortgage_eth_1 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);
      let nftOwnerT1_1_eth_1 = await ethers.provider.getBalance(nftOwnerT1_1.address);
      let nftOwnerT1_2_eth_1 = await ethers.provider.getBalance(nftOwnerT1_2.address);
      let nftOwnerT2_1_eth_1 = await ethers.provider.getBalance(nftOwnerT2_1.address);
      let nftOwnerT2_2_eth_1 = await ethers.provider.getBalance(nftOwnerT2_2.address);
      let marketKol_eth_1 = await ethers.provider.getBalance(await info.marketKol.getAddress());

      let nftOwnerT1_2_add = nftOwnerT1_2_eth_1 - nftOwnerT1_2_eth_0;
      let nftOwnerT1_1_add = nftOwnerT1_1_eth_1 - nftOwnerT1_1_eth_0;

      expect(user1_tid1_1).eq(user1_tid1_0);
      expect(user1_tid2_1).eq(user1_tid2_0);
      expect(user2_tid1_1).eq(user2_tid1_0);
      expect(user2_tid2_1).eq(user2_tid2_0);

      expect(mortgage_eth_1).eq(mortgage_eth_0);

      expect(nftOwnerT2_1_eth_1).eq(nftOwnerT2_1_eth_0);
      expect(nftOwnerT2_2_eth_1).eq(nftOwnerT2_2_eth_0);

      expect(nftOwnerT1_2_add / nftOwnerT1_1_add).eq(19);
      expect(curve_sell_0 / (nftOwnerT1_2_add + nftOwnerT1_1_add)).eq(100);

      expect(user1_eth_1 - user1_eth_0 + gas_0).gt(0);
      expect(user1_eth_1 - user1_eth_0 + gas_0).eq(userGetEth_0);

      expect(curve_sell_0 - nftOwnerT1_2_add - nftOwnerT1_1_add - curve_redeem_0).eq(user1_eth_1 - user1_eth_0 + gas_0);

      expect(marketKol_eth_0 - marketKol_eth_1)
        .eq(user1_eth_1 - user1_eth_0 + gas_0 + nftOwnerT1_2_add + nftOwnerT1_1_add)
        .eq(curve_sell_0 - curve_redeem_0);

      expect(user2_eth_1).eq(user2_eth_0);

      // user1 cash 9000 t1 token1
      let curve_sell_1 = await info.marketKol.getSellPayTokenAmount(paramsT1.tid, getTokenAmountWei(9000));
      expect(curve_sell_1).eq(
        await info.marketKol.getPayTokenAmount(
          getTokenAmountWei(70000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
          getTokenAmountWei(9000),
        ),
      );
      let curve_redeem_1 = await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(9000));

      let user1_eth_2_before = await ethers.provider.getBalance(user1.address);
      let user2_eth_2_before = await ethers.provider.getBalance(user2.address);

      let tx_1 = await info.appOperator.connect(user1).cash(1, getTokenAmountWei(9000));
      let gas_1 = await getGas(tx_1);

      await expect(info.mortgageNFTKol.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      expect((await info.mortgageNFTKol.info(1)).amount).eq(
        getTokenAmountWei(10000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
      );
      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
      );
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
      );
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(
        getTokenAmountWei(150000),
      );
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_tid1_2 = await info.marketKol.balanceOf(paramsT1.tid, user1.address);
      let user1_tid2_2 = await info.marketKol.balanceOf(paramsT2.tid, user1.address);
      let user2_tid1_2 = await info.marketKol.balanceOf(paramsT1.tid, user2.address);
      let user2_tid2_2 = await info.marketKol.balanceOf(paramsT2.tid, user2.address);

      let user1_eth_2 = await ethers.provider.getBalance(user1.address);
      let user2_eth_2 = await ethers.provider.getBalance(user2.address);
      let mortgage_eth_2 = await ethers.provider.getBalance(info.mortgageFeeWallet.address);
      let nftOwnerT1_1_eth_2 = await ethers.provider.getBalance(nftOwnerT1_1.address);
      let nftOwnerT1_2_eth_2 = await ethers.provider.getBalance(nftOwnerT1_2.address);
      let nftOwnerT2_1_eth_2 = await ethers.provider.getBalance(nftOwnerT2_1.address);
      let nftOwnerT2_2_eth_2 = await ethers.provider.getBalance(nftOwnerT2_2.address);
      let marketKol_eth_2 = await ethers.provider.getBalance(await info.marketKol.getAddress());

      let nftOwnerT1_2_add_1 = nftOwnerT1_2_eth_2 - nftOwnerT1_2_eth_1;
      let nftOwnerT1_1_add_1 = nftOwnerT1_1_eth_2 - nftOwnerT1_1_eth_1;

      expect(user1_tid1_2).eq(user1_tid1_1);
      expect(user1_tid2_2).eq(user1_tid2_1);
      expect(user2_tid1_2).eq(user2_tid1_1);
      expect(user2_tid2_2).eq(user2_tid2_1);

      expect(mortgage_eth_2).eq(mortgage_eth_1);

      expect(nftOwnerT2_1_eth_2).eq(nftOwnerT2_1_eth_1);
      expect(nftOwnerT2_2_eth_2).eq(nftOwnerT2_2_eth_1);

      expect(nftOwnerT1_2_add_1 / nftOwnerT1_1_add_1).eq(19);
      expect(curve_sell_1 / (nftOwnerT1_2_add_1 + nftOwnerT1_1_add_1)).eq(100);

      expect(user1_eth_2 - user1_eth_2_before + gas_1).gt(0);
      expect(curve_sell_1 - nftOwnerT1_2_add_1 - nftOwnerT1_1_add_1 - curve_redeem_1).eq(
        user1_eth_2 - user1_eth_2_before + gas_1,
      );

      expect(marketKol_eth_1 - marketKol_eth_2)
        .eq(user1_eth_2 - user1_eth_2_before + gas_1 + nftOwnerT1_2_add_1 + nftOwnerT1_1_add_1)
        .eq(curve_sell_1 - curve_redeem_1);

      expect(user2_eth_2).eq(user2_eth_2_before);

      // end
      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(60000));
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
      expect((await info.mortgageNFTKol.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFTKol.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFTKol.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFTKol.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFTKol.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFTKol.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFTKol.info(8)).amount).eq(getTokenAmountWei(45000));

      let kol_eth_add =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(60000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let kol_eth_remove =
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(20000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(40000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(15000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.marketKol.getPayTokenAmount(0, getTokenAmountWei(45000)));

      expect(kol_eth_add - kol_eth_remove).eq(await ethers.provider.getBalance(await info.marketKol.getAddress()));
    });
  });
});
