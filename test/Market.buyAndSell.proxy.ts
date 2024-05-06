import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { getTokenAmountWei } from "./shared/utils";
import Decimal from "decimal.js";

describe("Market", function () {
  describe("buyAndSell.proxy", function () {
    let data = [
      {
        expectNeedEth: BigInt("1010001010001009"), // 0.00101
        buyAmount: 1,
      },
      {
        expectNeedEth: BigInt("10100101001010010"), // 0.0101
        buyAmount: 10,
      },
      {
        expectNeedEth: BigInt("101010101010101010"), // 0.101
        buyAmount: 100,
      },
      {
        expectNeedEth: BigInt("1011011011011011010"), // 1.0110
        buyAmount: 1000,
      },
      {
        expectNeedEth: BigInt("10202020202020202019"), // 10.2020
        buyAmount: 10000,
      },
      {
        expectNeedEth: BigInt("112222222222222222221"), // 112.2222
        buyAmount: 100000,
      },
      {
        expectNeedEth: BigInt("252500000000000000000"), // 252.5
        buyAmount: 200000,
      },
      {
        expectNeedEth: BigInt("432857142857142857141"), // 432.85714285714283
        buyAmount: 300000,
      },
      {
        expectNeedEth: BigInt("673333333333333333332"), // 673.3333333333334
        buyAmount: 400000,
      },
      {
        expectNeedEth: BigInt("1010000000000000000000"), // 1010.0
        buyAmount: 500000,
      },
      {
        expectNeedEth: BigInt("1515000000000000000000"), // 1515.0
        buyAmount: 600000,
      },
      {
        expectNeedEth: BigInt("2356666666666666666665"), // 2356.6666666666665
        buyAmount: 700000,
      },
      {
        expectNeedEth: BigInt("4040000000000000000000"), // 4040.0
        buyAmount: 800000,
      },
      {
        expectNeedEth: BigInt("9090000000000000000000"), // 9090.0
        buyAmount: 900000,
      },
      {
        expectNeedEth: BigInt("100998990000000000000000000"), // 100998989.999
        buyAmount: 999990,
      },
      {
        expectNeedEth: BigInt("112221212222222222222222221"), // 112221212.222
        buyAmount: 999991,
      },
      {
        expectNeedEth: BigInt("504998990000000000000000000"), // 504998989.999
        buyAmount: 999998,
      },
    ];

    it("buy revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.ethProxy;
      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator.createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      // not tid
      await expect(
        info.appOperator.buy("t2222", getTokenAmountWei(1000), 0, { value: BigInt(10) ** BigInt(18) }),
      ).revertedWith("TE");
      // msg.value < need
      let needEth = await info.appOperator.buy.staticCall(params.tid, getTokenAmountWei(1000), 0, {
        value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
      });
      await expect(
        info.appOperator.buy(params.tid, getTokenAmountWei(1000), 0, { value: needEth - BigInt(1) }),
      ).revertedWith("VE");
      // buy amount > 1000W
      await expect(
        info.appOperator.buy(params.tid, getTokenAmountWei(10000000), 0, {
          value: BigInt(10) ** BigInt(18) * BigInt(100000),
        }),
      ).revertedWithPanic("0x11");
      // buy 0
      await expect(info.appOperator.buy(params.tid, 0, 0, { value: needEth - BigInt(1) })).revertedWith("TAE");
    });

    it("sell revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.ethProxy;

      let nftOwnerT1U1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1U2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2U1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2U2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];
      let user3 = info.wallets[info.nextWalletIndex + 7];

      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwnerT1U1.address,
        onftOwner: nftOwnerT1U2.address,
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
        cnftOwner: nftOwnerT2U1.address,
        onftOwner: nftOwnerT2U2.address,
      };
      await info.appOperator
        .createToken(
          paramsT2.tid,
          paramsT2.tData,
          paramsT2.cnftOwner,
          paramsT2.onftOwner,
        );

      // not tid
      await expect(info.appOperator.sell("t123", getTokenAmountWei(1000))).revertedWith("TE");

      // totalSupply not have, test: user1 sell t1 1
      await expect(info.appOperator.connect(user1).sell(paramsT1.tid, getTokenAmountWei(1))).revertedWith("TAE");

      // user1 buy t1 1000
      await info.appOperator
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(1000), 0, { value: BigInt(10) ** BigInt(19) });
      // user2 buy t1 and t2 1000
      await info.appOperator
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(1000), 0, { value: BigInt(10) ** BigInt(19) });
      await info.appOperator
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(1000), 0, { value: BigInt(10) ** BigInt(19) });

      // user not have, test: user1 sell t2 1
      await expect(info.appOperator.connect(user1).sell(paramsT2.tid, getTokenAmountWei(1))).revertedWith("TAE");

      // user not enough, test: user1 sell t1 1001
      await expect(info.appOperator.connect(user1).sell(paramsT1.tid, getTokenAmountWei(1001))).revertedWith("TAE");

      // totalSupply not enough, test: user3 sell t1 1001
      await expect(info.appOperator.connect(user3).sell(paramsT1.tid, getTokenAmountWei(1001))).revertedWith("TAE");

      // sell 0
      await expect(info.appOperator.connect(user1).sell(paramsT1.tid, 0)).revertedWith("TAE");
    });

    it("buy refundETH result and sell result", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.ethProxy;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOnwer: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOnwer, params.onftOwner);

      let buyAmount = getTokenAmountWei(1000);

      let needEth = await info.appOperator.buy.staticCall(params.tid, buyAmount, 0, {
        value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
      });

      let user1Eth1 = await ethers.provider.getBalance(user1.address);

      let tx = await info.appOperator.connect(user1).buy(params.tid, buyAmount, 0, { value: needEth * BigInt(12) });
      let result = await tx.wait();
      let gas = BigInt(0);
      if (result) {
        gas = result.gasPrice * result.gasUsed;
      }

      let user1Eth2 = await ethers.provider.getBalance(user1.address);

      expect(user1Eth2).eq(user1Eth1 - gas - needEth);
      expect(await ethers.provider.getBalance(await info.appOperator.getAddress())).eq(0)

      let userGetEth = await info.appOperator.connect(user1).sell.staticCall(params.tid, buyAmount);
      let tx_2 = await info.appOperator.connect(user1).sell(params.tid, buyAmount);
      let result_2 = await tx_2.wait();
      let gas_2 = BigInt(0);
      if (result_2) {
        gas_2 = result_2.gasPrice * result_2.gasUsed;
      }

      let user1Eth3 = await ethers.provider.getBalance(user1.address);

      expect(user1Eth3).eq(user1Eth2 - gas_2 + userGetEth);
      expect(await ethers.provider.getBalance(await info.appOperator.getAddress())).eq(0)
    });

    it("buy one", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.ethProxy;

        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = BigInt(10) ** BigInt(18) * BigInt(data[i].buyAmount);
        let expectNeedEth = data[i].expectNeedEth;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let needEth = await info.appOperator.buy.staticCall(params.tid, buyAmount, 0, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let tx = await info.appOperator.connect(user1).buy(params.tid, buyAmount, 0, { value: needEth });
        let result = await tx.wait();
        let gas = BigInt(0);
        if (result) {
          gas = result.gasPrice * result.gasUsed;
        }

        let curveEth = await info.marketKol.getPayTokenAmount(0, buyAmount);

        let user1Eth2 = await ethers.provider.getBalance(user1.address);
        let marketKolEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth = nftOwner1Eth2 - nftOwner1Eth1;
        let nftOwner2AddEth = nftOwner2Eth2 - nftOwner2Eth1;

        expect(needEth).eq(expectNeedEth);

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(user1Eth2).eq(user1Eth1 - needEth - gas);
        expect(marketKolEth2 - marketKolEth1).eq(curveEth);
        expect(curveEth + nftOwner1AddEth + nftOwner2AddEth).eq(needEth);

        expect(nftOwner2AddEth / nftOwner1AddEth).eq(19);
        expect(curveEth / (nftOwner1AddEth + nftOwner2AddEth)).eq(100);
      }
    });

    it("buy one and sell one", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.ethProxy;

        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = getTokenAmountWei(data[i].buyAmount);
        let expectNeedEth = data[i].expectNeedEth;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1,
          onftOwner: nftOwner2,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let needEth = await info.appOperator.buy.staticCall(params.tid, buyAmount, 0, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let tx = await info.appOperator.connect(user1).buy(params.tid, buyAmount, 0, { value: needEth });
        let result = await tx.wait();
        let gas = BigInt(0);
        if (result) {
          gas = result.gasPrice * result.gasUsed;
        }

        let curveEth = await info.marketKol.getPayTokenAmount(0, buyAmount);

        let user1Eth2 = await ethers.provider.getBalance(user1.address);
        let marketKolEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth = nftOwner1Eth2 - nftOwner1Eth1;
        let nftOwner2AddEth = nftOwner2Eth2 - nftOwner2Eth1;

        expect(needEth).eq(expectNeedEth);

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(user1Eth2).eq(user1Eth1 - needEth - gas);
        expect(marketKolEth2 - marketKolEth1).eq(curveEth);
        expect(curveEth + nftOwner1AddEth + nftOwner2AddEth).eq(needEth);

        expect(nftOwner2AddEth / nftOwner1AddEth).eq(19);
        expect(curveEth / (nftOwner1AddEth + nftOwner2AddEth)).eq(100);

        // sell
        let txSell = await info.appOperator.connect(user1).sell(params.tid, buyAmount);
        let resultSell = await txSell.wait();
        let gasSell = BigInt(0);
        if (resultSell) {
          gasSell = resultSell.gasPrice * resultSell.gasUsed;
        }

        let user1EthSell1 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell1 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth2 = nftOwner1EthSell1 - nftOwner1Eth2;
        let nftOwner2AddEth2 = nftOwner2EthSell1 - nftOwner2Eth2;
        let user1EthSellAdd = user1EthSell1 - user1Eth2 + gasSell;

        expect(await info.marketKol.totalSupply(params.tid)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(nftOwner2AddEth2 / nftOwner1AddEth2).eq(19);
        expect(user1EthSellAdd / (nftOwner1AddEth2 + nftOwner2AddEth2)).eq(99);
        expect(marketKolEthSell1).eq(0);
        expect(marketKolEth2).eq(user1EthSellAdd + nftOwner1AddEth2 + nftOwner2AddEth2);
      }
    });
  });
});
