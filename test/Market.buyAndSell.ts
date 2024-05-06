import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { getTokenAmountWei } from "./shared/utils";
import Decimal from "decimal.js";

describe("Market", function () {
  describe("buyAndSell", function () {
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
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      // not tid
      await expect(
        info.marketKol.buy("t2222", getTokenAmountWei(1000), { value: BigInt(10) ** BigInt(18) }),
      ).revertedWith("TE");
      // msg.value < need
      let needEth = await info.marketKol.buy.staticCall(params.tid, getTokenAmountWei(1000), {
        value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
      });
      await expect(
        info.marketKol.buy(params.tid, getTokenAmountWei(1000), { value: needEth - BigInt(1) }),
      ).revertedWith("VE");
      // buy amount > 1000W
      await expect(
        info.marketKol.buy(params.tid, getTokenAmountWei(10000000), {
          value: BigInt(10) ** BigInt(18) * BigInt(100000),
        }),
      ).revertedWithPanic("0x11");
      // buy 0
      await expect(info.marketKol.buy(params.tid, 0, { value: needEth - BigInt(1) })).revertedWith("TAE");
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
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);
      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2U1.address,
        onftOwner: nftOwnerT2U2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);

      // not tid
      await expect(info.marketKol.sell("t123", getTokenAmountWei(1000))).revertedWith("TE");

      // totalSupply not have, test: user1 sell t1 1
      await expect(info.marketKol.connect(user1).sell(paramsT1.tid, getTokenAmountWei(1))).revertedWith("TAE");

      // user1 buy t1 1000
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(1000), { value: BigInt(10) ** BigInt(19) });
      // user2 buy t1 and t2 1000
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(1000), { value: BigInt(10) ** BigInt(19) });
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(1000), { value: BigInt(10) ** BigInt(19) });

      // user not have, test: user1 sell t2 1
      await expect(info.marketKol.connect(user1).sell(paramsT2.tid, getTokenAmountWei(1))).revertedWith("TAE");

      // user not enough, test: user1 sell t1 1001
      await expect(info.marketKol.connect(user1).sell(paramsT1.tid, getTokenAmountWei(1001))).revertedWith("TAE");

      // totalSupply not enough, test: user3 sell t1 1001
      await expect(info.marketKol.connect(user3).sell(paramsT1.tid, getTokenAmountWei(1001))).revertedWith("TAE");

      // sell 0
      await expect(info.marketKol.connect(user1).sell(paramsT1.tid, 0)).revertedWith("TAE");
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
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      let buyAmount = getTokenAmountWei(1000);

      let needEth = await info.marketKol.buy.staticCall(params.tid, buyAmount, {
        value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
      });

      let user1Eth1 = await ethers.provider.getBalance(user1.address);

      let tx = await info.marketKol.connect(user1).buy(params.tid, buyAmount, { value: needEth * BigInt(12) });
      let result = await tx.wait();
      let gas = BigInt(0);
      if (result) {
        gas = result.gasPrice * result.gasUsed;
      }

      let user1Eth2 = await ethers.provider.getBalance(user1.address);

      expect(user1Eth2).eq(user1Eth1 - gas - needEth);

      let userGetEth = await info.marketKol.connect(user1).sell.staticCall(params.tid, buyAmount);
      let tx_2 = await info.marketKol.connect(user1).sell(params.tid, buyAmount);
      let result_2 = await tx_2.wait();
      let gas_2 = BigInt(0);
      if (result_2) {
        gas_2 = result_2.gasPrice * result_2.gasUsed;
      }

      let user1Eth3 = await ethers.provider.getBalance(user1.address);

      expect(user1Eth3).eq(user1Eth2 - gas_2 + userGetEth);
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

        let needEth = await info.marketKol.buy.staticCall(params.tid, buyAmount, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let tx = await info.marketKol.connect(user1).buy(params.tid, buyAmount, { value: needEth });
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

    it("buy multi", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.ethProxy;


        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = getTokenAmountWei(BigInt(data[i].buyAmount));
        let expectNeedEth = data[i].expectNeedEth;

        if (buyAmount < getTokenAmountWei(BigInt(10))) {
          continue;
        }

        let part1 = buyAmount / BigInt(9);
        let part2 = (buyAmount - part1) / BigInt(7);
        let part3 = (buyAmount - part1) / BigInt(5);
        let part4 = (buyAmount - part1) / BigInt(3);
        let part5 = buyAmount - part1 - part2 - part3 - part4;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let needEthPart1 = await info.marketKol.buy.staticCall(params.tid, part1, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart1 = await info.marketKol.connect(user1).buy(params.tid, part1, { value: needEthPart1 });
        let resultPart1 = await txPart1.wait();
        let gasPart1 = BigInt(0);
        if (resultPart1) {
          gasPart1 = resultPart1.gasPrice * resultPart1.gasUsed;
        }

        let curveEthPart1 = await info.marketKol.getPayTokenAmount(0, part1);

        let user1Eth2 = await ethers.provider.getBalance(user1.address);
        let marketKolEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth1 = nftOwner1Eth2 - nftOwner1Eth1;
        let nftOwner2AddEth1 = nftOwner2Eth2 - nftOwner2Eth1;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part2
        let needEthPart2 = await info.marketKol.buy.staticCall(params.tid, part2, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart2 = await info.marketKol.connect(user1).buy(params.tid, part2, { value: needEthPart2 });
        let resultPart2 = await txPart2.wait();
        let gasPart2 = BigInt(0);
        if (resultPart2) {
          gasPart2 = resultPart2.gasPrice * resultPart2.gasUsed;
        }

        let curveEthPart2 = await info.marketKol.getPayTokenAmount(part1, part2);

        let user1Eth3 = await ethers.provider.getBalance(user1.address);
        let marketKolEth3 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth3 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth3 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth2 = nftOwner1Eth3 - nftOwner1Eth2;
        let nftOwner2AddEth2 = nftOwner2Eth3 - nftOwner2Eth2;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part3
        let needEthPart3 = await info.marketKol.buy.staticCall(params.tid, part3, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart3 = await info.marketKol.connect(user1).buy(params.tid, part3, { value: needEthPart3 });
        let resultPart3 = await txPart3.wait();
        let gasPart3 = BigInt(0);
        if (resultPart3) {
          gasPart3 = resultPart3.gasPrice * resultPart3.gasUsed;
        }

        let curveEthPart3 = await info.marketKol.getPayTokenAmount(part1 + part2, part3);

        let user1Eth4 = await ethers.provider.getBalance(user1.address);
        let marketKolEth4 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth4 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth4 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth3 = nftOwner1Eth4 - nftOwner1Eth3;
        let nftOwner2AddEth3 = nftOwner2Eth4 - nftOwner2Eth3;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part4
        let needEthPart4 = await info.marketKol.buy.staticCall(params.tid, part4, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart4 = await info.marketKol.connect(user1).buy(params.tid, part4, { value: needEthPart4 });
        let resultPart4 = await txPart4.wait();
        let gasPart4 = BigInt(0);
        if (resultPart4) {
          gasPart4 = resultPart4.gasPrice * resultPart4.gasUsed;
        }

        let curveEthPart4 = await info.marketKol.getPayTokenAmount(part1 + part2 + part3, part4);

        let user1Eth5 = await ethers.provider.getBalance(user1.address);
        let marketKolEth5 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth5 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth5 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth4 = nftOwner1Eth5 - nftOwner1Eth4;
        let nftOwner2AddEth4 = nftOwner2Eth5 - nftOwner2Eth4;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3 + part4);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3 + part4);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part 5
        let needEthPart5 = await info.marketKol.buy.staticCall(params.tid, part5, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart5 = await info.marketKol.connect(user1).buy(params.tid, part5, { value: needEthPart5 });
        let resultPart5 = await txPart5.wait();
        let gasPart5 = BigInt(0);
        if (resultPart5) {
          gasPart5 = resultPart5.gasPrice * resultPart5.gasUsed;
        }

        let curveEthPart5 = await info.marketKol.getPayTokenAmount(part1 + part2 + part3 + part4, part5);

        let user1Eth6 = await ethers.provider.getBalance(user1.address);
        let marketKolEth6 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth6 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth6 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth5 = nftOwner1Eth6 - nftOwner1Eth5;
        let nftOwner2AddEth5 = nftOwner2Eth6 - nftOwner2Eth5;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3 + part4 + part5);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3 + part4 + part5);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        let curveEth = await info.marketKol.getPayTokenAmount(0, part1 + part2 + part3 + part4 + part5);

        let needEth = needEthPart1 + needEthPart2 + needEthPart3 + needEthPart4 + needEthPart5;

        expect(expectNeedEth - needEth).lte(7);
        expect(expectNeedEth - needEth).gte(0);

        expect(user1Eth2).eq(user1Eth1 - needEthPart1 - gasPart1);
        expect(user1Eth3).eq(user1Eth2 - needEthPart2 - gasPart2);
        expect(user1Eth4).eq(user1Eth3 - needEthPart3 - gasPart3);
        expect(user1Eth5).eq(user1Eth4 - needEthPart4 - gasPart4);
        expect(user1Eth6).eq(user1Eth5 - needEthPart5 - gasPart5);
        expect(user1Eth6).eq(
          user1Eth1 -
          needEthPart1 -
          needEthPart2 -
          needEthPart3 -
          needEthPart4 -
          needEthPart5 -
          gasPart1 -
          gasPart2 -
          gasPart3 -
          gasPart4 -
          gasPart5,
        );

        expect(marketKolEth2 - marketKolEth1).eq(curveEthPart1);
        expect(marketKolEth3 - marketKolEth2).eq(curveEthPart2);
        expect(marketKolEth4 - marketKolEth3).eq(curveEthPart3);
        expect(marketKolEth5 - marketKolEth4).eq(curveEthPart4);
        expect(marketKolEth6 - marketKolEth5).eq(curveEthPart5);
        expect(marketKolEth6 - marketKolEth1)
          .eq(curveEth)
          .eq(curveEthPart1 + curveEthPart2 + curveEthPart3 + curveEthPart4 + curveEthPart5);

        expect(curveEthPart1 + nftOwner1AddEth1 + nftOwner2AddEth1).eq(needEthPart1);
        expect(curveEthPart2 + nftOwner1AddEth2 + nftOwner2AddEth2).eq(needEthPart2);
        expect(curveEthPart3 + nftOwner1AddEth3 + nftOwner2AddEth3).eq(needEthPart3);
        expect(curveEthPart4 + nftOwner1AddEth4 + nftOwner2AddEth4).eq(needEthPart4);
        expect(curveEthPart5 + nftOwner1AddEth5 + nftOwner2AddEth5).eq(needEthPart5);

        expect(nftOwner2AddEth1 / nftOwner1AddEth1).eq(19);
        expect(nftOwner2AddEth2 / nftOwner1AddEth2).eq(19);
        expect(nftOwner2AddEth3 / nftOwner1AddEth3).eq(19);
        expect(nftOwner2AddEth4 / nftOwner1AddEth4).eq(19);
        expect(nftOwner2AddEth5 / nftOwner1AddEth5).eq(19);

        expect(curveEthPart1 / (nftOwner1AddEth1 + nftOwner2AddEth1)).eq(100);
        expect(curveEthPart2 / (nftOwner1AddEth2 + nftOwner2AddEth2)).eq(100);
        expect(curveEthPart3 / (nftOwner1AddEth3 + nftOwner2AddEth3)).eq(100);
        expect(curveEthPart4 / (nftOwner1AddEth4 + nftOwner2AddEth4)).eq(100);
        expect(curveEthPart5 / (nftOwner1AddEth5 + nftOwner2AddEth5)).eq(100);
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
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let needEth = await info.marketKol.buy.staticCall(params.tid, buyAmount, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let tx = await info.marketKol.connect(user1).buy(params.tid, buyAmount, { value: needEth });
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
        let txSell = await info.marketKol.connect(user1).sell(params.tid, buyAmount);
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

    it("buy multi and sell one", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.ethProxy;


        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = getTokenAmountWei(BigInt(data[i].buyAmount));
        let expectNeedEth = data[i].expectNeedEth;

        if (buyAmount < getTokenAmountWei(BigInt(10))) {
          continue;
        }

        let part1 = buyAmount / BigInt(9);
        let part2 = (buyAmount - part1) / BigInt(7);
        let part3 = (buyAmount - part1) / BigInt(5);
        let part4 = (buyAmount - part1) / BigInt(3);
        let part5 = buyAmount - part1 - part2 - part3 - part4;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let needEthPart1 = await info.marketKol.buy.staticCall(params.tid, part1, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart1 = await info.marketKol.connect(user1).buy(params.tid, part1, { value: needEthPart1 });
        let resultPart1 = await txPart1.wait();
        let gasPart1 = BigInt(0);
        if (resultPart1) {
          gasPart1 = resultPart1.gasPrice * resultPart1.gasUsed;
        }

        let curveEthPart1 = await info.marketKol.getPayTokenAmount(0, part1);

        let user1Eth2 = await ethers.provider.getBalance(user1.address);
        let marketKolEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth1 = nftOwner1Eth2 - nftOwner1Eth1;
        let nftOwner2AddEth1 = nftOwner2Eth2 - nftOwner2Eth1;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part2
        let needEthPart2 = await info.marketKol.buy.staticCall(params.tid, part2, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart2 = await info.marketKol.connect(user1).buy(params.tid, part2, { value: needEthPart2 });
        let resultPart2 = await txPart2.wait();
        let gasPart2 = BigInt(0);
        if (resultPart2) {
          gasPart2 = resultPart2.gasPrice * resultPart2.gasUsed;
        }

        let curveEthPart2 = await info.marketKol.getPayTokenAmount(part1, part2);

        let user1Eth3 = await ethers.provider.getBalance(user1.address);
        let marketKolEth3 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth3 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth3 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth2 = nftOwner1Eth3 - nftOwner1Eth2;
        let nftOwner2AddEth2 = nftOwner2Eth3 - nftOwner2Eth2;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part3
        let needEthPart3 = await info.marketKol.buy.staticCall(params.tid, part3, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart3 = await info.marketKol.connect(user1).buy(params.tid, part3, { value: needEthPart3 });
        let resultPart3 = await txPart3.wait();
        let gasPart3 = BigInt(0);
        if (resultPart3) {
          gasPart3 = resultPart3.gasPrice * resultPart3.gasUsed;
        }

        let curveEthPart3 = await info.marketKol.getPayTokenAmount(part1 + part2, part3);

        let user1Eth4 = await ethers.provider.getBalance(user1.address);
        let marketKolEth4 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth4 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth4 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth3 = nftOwner1Eth4 - nftOwner1Eth3;
        let nftOwner2AddEth3 = nftOwner2Eth4 - nftOwner2Eth3;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part4
        let needEthPart4 = await info.marketKol.buy.staticCall(params.tid, part4, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart4 = await info.marketKol.connect(user1).buy(params.tid, part4, { value: needEthPart4 });
        let resultPart4 = await txPart4.wait();
        let gasPart4 = BigInt(0);
        if (resultPart4) {
          gasPart4 = resultPart4.gasPrice * resultPart4.gasUsed;
        }

        let curveEthPart4 = await info.marketKol.getPayTokenAmount(part1 + part2 + part3, part4);

        let user1Eth5 = await ethers.provider.getBalance(user1.address);
        let marketKolEth5 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth5 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth5 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth4 = nftOwner1Eth5 - nftOwner1Eth4;
        let nftOwner2AddEth4 = nftOwner2Eth5 - nftOwner2Eth4;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3 + part4);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3 + part4);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part 5
        let needEthPart5 = await info.marketKol.buy.staticCall(params.tid, part5, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart5 = await info.marketKol.connect(user1).buy(params.tid, part5, { value: needEthPart5 });
        let resultPart5 = await txPart5.wait();
        let gasPart5 = BigInt(0);
        if (resultPart5) {
          gasPart5 = resultPart5.gasPrice * resultPart5.gasUsed;
        }

        let curveEthPart5 = await info.marketKol.getPayTokenAmount(part1 + part2 + part3 + part4, part5);

        let user1Eth6 = await ethers.provider.getBalance(user1.address);
        let marketKolEth6 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth6 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth6 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth5 = nftOwner1Eth6 - nftOwner1Eth5;
        let nftOwner2AddEth5 = nftOwner2Eth6 - nftOwner2Eth5;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3 + part4 + part5);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3 + part4 + part5);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        let curveEth = await info.marketKol.getPayTokenAmount(0, part1 + part2 + part3 + part4 + part5);

        let needEth = needEthPart1 + needEthPart2 + needEthPart3 + needEthPart4 + needEthPart5;

        expect(expectNeedEth - needEth).lte(7);
        expect(expectNeedEth - needEth).gte(0);

        expect(user1Eth2).eq(user1Eth1 - needEthPart1 - gasPart1);
        expect(user1Eth3).eq(user1Eth2 - needEthPart2 - gasPart2);
        expect(user1Eth4).eq(user1Eth3 - needEthPart3 - gasPart3);
        expect(user1Eth5).eq(user1Eth4 - needEthPart4 - gasPart4);
        expect(user1Eth6).eq(user1Eth5 - needEthPart5 - gasPart5);
        expect(user1Eth6).eq(
          user1Eth1 -
          needEthPart1 -
          needEthPart2 -
          needEthPart3 -
          needEthPart4 -
          needEthPart5 -
          gasPart1 -
          gasPart2 -
          gasPart3 -
          gasPart4 -
          gasPart5,
        );

        expect(marketKolEth2 - marketKolEth1).eq(curveEthPart1);
        expect(marketKolEth3 - marketKolEth2).eq(curveEthPart2);
        expect(marketKolEth4 - marketKolEth3).eq(curveEthPart3);
        expect(marketKolEth5 - marketKolEth4).eq(curveEthPart4);
        expect(marketKolEth6 - marketKolEth5).eq(curveEthPart5);
        expect(marketKolEth6 - marketKolEth1)
          .eq(curveEth)
          .eq(curveEthPart1 + curveEthPart2 + curveEthPart3 + curveEthPart4 + curveEthPart5);

        expect(curveEthPart1 + nftOwner1AddEth1 + nftOwner2AddEth1).eq(needEthPart1);
        expect(curveEthPart2 + nftOwner1AddEth2 + nftOwner2AddEth2).eq(needEthPart2);
        expect(curveEthPart3 + nftOwner1AddEth3 + nftOwner2AddEth3).eq(needEthPart3);
        expect(curveEthPart4 + nftOwner1AddEth4 + nftOwner2AddEth4).eq(needEthPart4);
        expect(curveEthPart5 + nftOwner1AddEth5 + nftOwner2AddEth5).eq(needEthPart5);

        expect(nftOwner2AddEth1 / nftOwner1AddEth1).eq(19);
        expect(nftOwner2AddEth2 / nftOwner1AddEth2).eq(19);
        expect(nftOwner2AddEth3 / nftOwner1AddEth3).eq(19);
        expect(nftOwner2AddEth4 / nftOwner1AddEth4).eq(19);
        expect(nftOwner2AddEth5 / nftOwner1AddEth5).eq(19);

        expect(curveEthPart1 / (nftOwner1AddEth1 + nftOwner2AddEth1)).eq(100);
        expect(curveEthPart2 / (nftOwner1AddEth2 + nftOwner2AddEth2)).eq(100);
        expect(curveEthPart3 / (nftOwner1AddEth3 + nftOwner2AddEth3)).eq(100);
        expect(curveEthPart4 / (nftOwner1AddEth4 + nftOwner2AddEth4)).eq(100);
        expect(curveEthPart5 / (nftOwner1AddEth5 + nftOwner2AddEth5)).eq(100);

        // sell
        let txSell = await info.marketKol.connect(user1).sell(params.tid, buyAmount);
        let resultSell = await txSell.wait();
        let gasSell = BigInt(0);
        if (resultSell) {
          gasSell = resultSell.gasPrice * resultSell.gasUsed;
        }

        let user1EthSell1 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell1 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell = nftOwner1EthSell1 - nftOwner1Eth6;
        let nftOwner2AddEthSell = nftOwner2EthSell1 - nftOwner2Eth6;
        let user1EthSellAdd = user1EthSell1 - user1Eth6 + gasSell;

        expect(await info.marketKol.totalSupply(params.tid)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(nftOwner2AddEthSell / nftOwner1AddEthSell).eq(19);
        expect(user1EthSellAdd / (nftOwner1AddEthSell + nftOwner2AddEthSell)).eq(99);
        expect(marketKolEthSell1).eq(0);
        expect(marketKolEth6).eq(user1EthSellAdd + nftOwner1AddEthSell + nftOwner2AddEthSell);
      }
    });

    it("buy multi and sell multi", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.ethProxy;


        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = getTokenAmountWei(BigInt(data[i].buyAmount));
        let expectNeedEth = data[i].expectNeedEth;

        if (buyAmount < getTokenAmountWei(BigInt(10))) {
          continue;
        }

        let part1 = buyAmount / BigInt(9);
        let part2 = (buyAmount - part1) / BigInt(7);
        let part3 = (buyAmount - part1) / BigInt(5);
        let part4 = (buyAmount - part1) / BigInt(3);
        let part5 = buyAmount - part1 - part2 - part3 - part4;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let needEthPart1 = await info.marketKol.buy.staticCall(params.tid, part1, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart1 = await info.marketKol.connect(user1).buy(params.tid, part1, { value: needEthPart1 });
        let resultPart1 = await txPart1.wait();
        let gasPart1 = BigInt(0);
        if (resultPart1) {
          gasPart1 = resultPart1.gasPrice * resultPart1.gasUsed;
        }

        let curveEthPart1 = await info.marketKol.getPayTokenAmount(0, part1);

        let user1Eth2 = await ethers.provider.getBalance(user1.address);
        let marketKolEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth1 = nftOwner1Eth2 - nftOwner1Eth1;
        let nftOwner2AddEth1 = nftOwner2Eth2 - nftOwner2Eth1;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part2
        let needEthPart2 = await info.marketKol.buy.staticCall(params.tid, part2, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart2 = await info.marketKol.connect(user1).buy(params.tid, part2, { value: needEthPart2 });
        let resultPart2 = await txPart2.wait();
        let gasPart2 = BigInt(0);
        if (resultPart2) {
          gasPart2 = resultPart2.gasPrice * resultPart2.gasUsed;
        }

        let curveEthPart2 = await info.marketKol.getPayTokenAmount(part1, part2);

        let user1Eth3 = await ethers.provider.getBalance(user1.address);
        let marketKolEth3 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth3 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth3 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth2 = nftOwner1Eth3 - nftOwner1Eth2;
        let nftOwner2AddEth2 = nftOwner2Eth3 - nftOwner2Eth2;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part3
        let needEthPart3 = await info.marketKol.buy.staticCall(params.tid, part3, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart3 = await info.marketKol.connect(user1).buy(params.tid, part3, { value: needEthPart3 });
        let resultPart3 = await txPart3.wait();
        let gasPart3 = BigInt(0);
        if (resultPart3) {
          gasPart3 = resultPart3.gasPrice * resultPart3.gasUsed;
        }

        let curveEthPart3 = await info.marketKol.getPayTokenAmount(part1 + part2, part3);

        let user1Eth4 = await ethers.provider.getBalance(user1.address);
        let marketKolEth4 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth4 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth4 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth3 = nftOwner1Eth4 - nftOwner1Eth3;
        let nftOwner2AddEth3 = nftOwner2Eth4 - nftOwner2Eth3;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part4
        let needEthPart4 = await info.marketKol.buy.staticCall(params.tid, part4, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart4 = await info.marketKol.connect(user1).buy(params.tid, part4, { value: needEthPart4 });
        let resultPart4 = await txPart4.wait();
        let gasPart4 = BigInt(0);
        if (resultPart4) {
          gasPart4 = resultPart4.gasPrice * resultPart4.gasUsed;
        }

        let curveEthPart4 = await info.marketKol.getPayTokenAmount(part1 + part2 + part3, part4);

        let user1Eth5 = await ethers.provider.getBalance(user1.address);
        let marketKolEth5 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth5 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth5 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth4 = nftOwner1Eth5 - nftOwner1Eth4;
        let nftOwner2AddEth4 = nftOwner2Eth5 - nftOwner2Eth4;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3 + part4);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3 + part4);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part 5
        let needEthPart5 = await info.marketKol.buy.staticCall(params.tid, part5, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart5 = await info.marketKol.connect(user1).buy(params.tid, part5, { value: needEthPart5 });
        let resultPart5 = await txPart5.wait();
        let gasPart5 = BigInt(0);
        if (resultPart5) {
          gasPart5 = resultPart5.gasPrice * resultPart5.gasUsed;
        }

        let curveEthPart5 = await info.marketKol.getPayTokenAmount(part1 + part2 + part3 + part4, part5);

        let user1Eth6 = await ethers.provider.getBalance(user1.address);
        let marketKolEth6 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth6 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth6 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth5 = nftOwner1Eth6 - nftOwner1Eth5;
        let nftOwner2AddEth5 = nftOwner2Eth6 - nftOwner2Eth5;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3 + part4 + part5);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1 + part2 + part3 + part4 + part5);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        let curveEth = await info.marketKol.getPayTokenAmount(0, part1 + part2 + part3 + part4 + part5);

        let needEth = needEthPart1 + needEthPart2 + needEthPart3 + needEthPart4 + needEthPart5;

        expect(expectNeedEth - needEth).lte(7);
        expect(expectNeedEth - needEth).gte(0);

        expect(user1Eth2).eq(user1Eth1 - needEthPart1 - gasPart1);
        expect(user1Eth3).eq(user1Eth2 - needEthPart2 - gasPart2);
        expect(user1Eth4).eq(user1Eth3 - needEthPart3 - gasPart3);
        expect(user1Eth5).eq(user1Eth4 - needEthPart4 - gasPart4);
        expect(user1Eth6).eq(user1Eth5 - needEthPart5 - gasPart5);
        expect(user1Eth6).eq(
          user1Eth1 -
          needEthPart1 -
          needEthPart2 -
          needEthPart3 -
          needEthPart4 -
          needEthPart5 -
          gasPart1 -
          gasPart2 -
          gasPart3 -
          gasPart4 -
          gasPart5,
        );

        expect(marketKolEth2 - marketKolEth1).eq(curveEthPart1);
        expect(marketKolEth3 - marketKolEth2).eq(curveEthPart2);
        expect(marketKolEth4 - marketKolEth3).eq(curveEthPart3);
        expect(marketKolEth5 - marketKolEth4).eq(curveEthPart4);
        expect(marketKolEth6 - marketKolEth5).eq(curveEthPart5);
        expect(marketKolEth6 - marketKolEth1)
          .eq(curveEth)
          .eq(curveEthPart1 + curveEthPart2 + curveEthPart3 + curveEthPart4 + curveEthPart5);

        expect(curveEthPart1 + nftOwner1AddEth1 + nftOwner2AddEth1).eq(needEthPart1);
        expect(curveEthPart2 + nftOwner1AddEth2 + nftOwner2AddEth2).eq(needEthPart2);
        expect(curveEthPart3 + nftOwner1AddEth3 + nftOwner2AddEth3).eq(needEthPart3);
        expect(curveEthPart4 + nftOwner1AddEth4 + nftOwner2AddEth4).eq(needEthPart4);
        expect(curveEthPart5 + nftOwner1AddEth5 + nftOwner2AddEth5).eq(needEthPart5);

        expect(nftOwner2AddEth1 / nftOwner1AddEth1).eq(19);
        expect(nftOwner2AddEth2 / nftOwner1AddEth2).eq(19);
        expect(nftOwner2AddEth3 / nftOwner1AddEth3).eq(19);
        expect(nftOwner2AddEth4 / nftOwner1AddEth4).eq(19);
        expect(nftOwner2AddEth5 / nftOwner1AddEth5).eq(19);

        expect(curveEthPart1 / (nftOwner1AddEth1 + nftOwner2AddEth1)).eq(100);
        expect(curveEthPart2 / (nftOwner1AddEth2 + nftOwner2AddEth2)).eq(100);
        expect(curveEthPart3 / (nftOwner1AddEth3 + nftOwner2AddEth3)).eq(100);
        expect(curveEthPart4 / (nftOwner1AddEth4 + nftOwner2AddEth4)).eq(100);
        expect(curveEthPart5 / (nftOwner1AddEth5 + nftOwner2AddEth5)).eq(100);

        // sell part1
        let txSellPart1 = await info.marketKol.connect(user1).sell(params.tid, part1);
        let resultSellPart1 = await txSellPart1.wait();
        let gasSellPart1 = BigInt(0);
        if (resultSellPart1) {
          gasSellPart1 = resultSellPart1.gasPrice * resultSellPart1.gasUsed;
        }

        let user1EthSell1 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell1 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell1 = nftOwner1EthSell1 - nftOwner1Eth6;
        let nftOwner2AddEthSell1 = nftOwner2EthSell1 - nftOwner2Eth6;
        let user1EthSellAdd1 = user1EthSell1 - user1Eth6 + gasSellPart1;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount - part1);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part2
        let txSellPart2 = await info.marketKol.connect(user1).sell(params.tid, part2);
        let resultSellPart2 = await txSellPart2.wait();
        let gasSellPart2 = BigInt(0);
        if (resultSellPart2) {
          gasSellPart2 = resultSellPart2.gasPrice * resultSellPart2.gasUsed;
        }

        let user1EthSell2 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell2 = nftOwner1EthSell2 - nftOwner1EthSell1;
        let nftOwner2AddEthSell2 = nftOwner2EthSell2 - nftOwner2EthSell1;
        let user1EthSellAdd2 = user1EthSell2 - user1EthSell1 + gasSellPart2;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount - part1 - part2);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part3
        let txSellPart3 = await info.marketKol.connect(user1).sell(params.tid, part3);
        let resultSellPart3 = await txSellPart3.wait();
        let gasSellPart3 = BigInt(0);
        if (resultSellPart3) {
          gasSellPart3 = resultSellPart3.gasPrice * resultSellPart3.gasUsed;
        }

        let user1EthSell3 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell3 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell3 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell3 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell3 = nftOwner1EthSell3 - nftOwner1EthSell2;
        let nftOwner2AddEthSell3 = nftOwner2EthSell3 - nftOwner2EthSell2;
        let user1EthSellAdd3 = user1EthSell3 - user1EthSell2 + gasSellPart3;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2 - part3);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount - part1 - part2 - part3);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part4
        let txSellPart4 = await info.marketKol.connect(user1).sell(params.tid, part4);
        let resultSellPart4 = await txSellPart4.wait();
        let gasSellPart4 = BigInt(0);
        if (resultSellPart4) {
          gasSellPart4 = resultSellPart4.gasPrice * resultSellPart4.gasUsed;
        }

        let user1EthSell4 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell4 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell4 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell4 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell4 = nftOwner1EthSell4 - nftOwner1EthSell3;
        let nftOwner2AddEthSell4 = nftOwner2EthSell4 - nftOwner2EthSell3;
        let user1EthSellAdd4 = user1EthSell4 - user1EthSell3 + gasSellPart4;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2 - part3 - part4);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount - part1 - part2 - part3 - part4);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part5
        let txSellPart5 = await info.marketKol.connect(user1).sell(params.tid, part5);
        let resultSellPart5 = await txSellPart5.wait();
        let gasSellPart5 = BigInt(0);
        if (resultSellPart5) {
          gasSellPart5 = resultSellPart5.gasPrice * resultSellPart5.gasUsed;
        }

        let user1EthSell5 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell5 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell5 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell5 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell5 = nftOwner1EthSell5 - nftOwner1EthSell4;
        let nftOwner2AddEthSell5 = nftOwner2EthSell5 - nftOwner2EthSell4;
        let user1EthSellAdd5 = user1EthSell5 - user1EthSell4 + gasSellPart5;

        expect(await info.marketKol.totalSupply(params.tid)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(nftOwner2AddEthSell1 / nftOwner1AddEthSell1).eq(19);
        expect(nftOwner2AddEthSell2 / nftOwner1AddEthSell2).eq(19);
        expect(nftOwner2AddEthSell3 / nftOwner1AddEthSell3).eq(19);
        expect(nftOwner2AddEthSell4 / nftOwner1AddEthSell4).eq(19);
        expect(nftOwner2AddEthSell5 / nftOwner1AddEthSell5).eq(19);

        expect(user1EthSellAdd1 / (nftOwner1AddEthSell1 + nftOwner2AddEthSell1)).eq(99);
        expect(user1EthSellAdd2 / (nftOwner1AddEthSell2 + nftOwner2AddEthSell2)).eq(99);
        expect(user1EthSellAdd3 / (nftOwner1AddEthSell3 + nftOwner2AddEthSell3)).eq(99);
        expect(user1EthSellAdd4 / (nftOwner1AddEthSell4 + nftOwner2AddEthSell4)).eq(99);
        expect(user1EthSellAdd5 / (nftOwner1AddEthSell5 + nftOwner2AddEthSell5)).eq(99);

        expect(marketKolEthSell5).eq(0);
        expect(marketKolEth6).eq(
          user1EthSellAdd1 +
          nftOwner1AddEthSell1 +
          nftOwner2AddEthSell1 +
          user1EthSellAdd2 +
          nftOwner1AddEthSell2 +
          nftOwner2AddEthSell2 +
          user1EthSellAdd3 +
          nftOwner1AddEthSell3 +
          nftOwner2AddEthSell3 +
          user1EthSellAdd4 +
          nftOwner1AddEthSell4 +
          nftOwner2AddEthSell4 +
          user1EthSellAdd5 +
          nftOwner1AddEthSell5 +
          nftOwner2AddEthSell5,
        );
      }
    });

    it("buy one and sell multi", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.ethProxy;


        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = getTokenAmountWei(BigInt(data[i].buyAmount));
        let expectNeedEth = data[i].expectNeedEth;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let needEth = await info.marketKol.buy.staticCall(params.tid, buyAmount, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let tx = await info.marketKol.connect(user1).buy(params.tid, buyAmount, { value: needEth });
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

        //
        if (buyAmount < getTokenAmountWei(BigInt(10))) {
          continue;
        }

        let part1 = buyAmount / BigInt(9);
        let part2 = (buyAmount - part1) / BigInt(7);
        let part3 = (buyAmount - part1) / BigInt(5);
        let part4 = (buyAmount - part1) / BigInt(3);
        let part5 = buyAmount - part1 - part2 - part3 - part4;

        // sell part1
        let txSellPart1 = await info.marketKol.connect(user1).sell(params.tid, part1);
        let resultSellPart1 = await txSellPart1.wait();
        let gasSellPart1 = BigInt(0);
        if (resultSellPart1) {
          gasSellPart1 = resultSellPart1.gasPrice * resultSellPart1.gasUsed;
        }

        let user1EthSell1 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell1 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell1 = nftOwner1EthSell1 - nftOwner1Eth2;
        let nftOwner2AddEthSell1 = nftOwner2EthSell1 - nftOwner2Eth2;
        let user1EthSellAdd1 = user1EthSell1 - user1Eth2 + gasSellPart1;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount - part1);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part2
        let txSellPart2 = await info.marketKol.connect(user1).sell(params.tid, part2);
        let resultSellPart2 = await txSellPart2.wait();
        let gasSellPart2 = BigInt(0);
        if (resultSellPart2) {
          gasSellPart2 = resultSellPart2.gasPrice * resultSellPart2.gasUsed;
        }

        let user1EthSell2 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell2 = nftOwner1EthSell2 - nftOwner1EthSell1;
        let nftOwner2AddEthSell2 = nftOwner2EthSell2 - nftOwner2EthSell1;
        let user1EthSellAdd2 = user1EthSell2 - user1EthSell1 + gasSellPart2;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount - part1 - part2);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part3
        let txSellPart3 = await info.marketKol.connect(user1).sell(params.tid, part3);
        let resultSellPart3 = await txSellPart3.wait();
        let gasSellPart3 = BigInt(0);
        if (resultSellPart3) {
          gasSellPart3 = resultSellPart3.gasPrice * resultSellPart3.gasUsed;
        }

        let user1EthSell3 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell3 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell3 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell3 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell3 = nftOwner1EthSell3 - nftOwner1EthSell2;
        let nftOwner2AddEthSell3 = nftOwner2EthSell3 - nftOwner2EthSell2;
        let user1EthSellAdd3 = user1EthSell3 - user1EthSell2 + gasSellPart3;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2 - part3);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount - part1 - part2 - part3);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part4
        let txSellPart4 = await info.marketKol.connect(user1).sell(params.tid, part4);
        let resultSellPart4 = await txSellPart4.wait();
        let gasSellPart4 = BigInt(0);
        if (resultSellPart4) {
          gasSellPart4 = resultSellPart4.gasPrice * resultSellPart4.gasUsed;
        }

        let user1EthSell4 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell4 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell4 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell4 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell4 = nftOwner1EthSell4 - nftOwner1EthSell3;
        let nftOwner2AddEthSell4 = nftOwner2EthSell4 - nftOwner2EthSell3;
        let user1EthSellAdd4 = user1EthSell4 - user1EthSell3 + gasSellPart4;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2 - part3 - part4);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount - part1 - part2 - part3 - part4);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part5
        let txSellPart5 = await info.marketKol.connect(user1).sell(params.tid, part5);
        let resultSellPart5 = await txSellPart5.wait();
        let gasSellPart5 = BigInt(0);
        if (resultSellPart5) {
          gasSellPart5 = resultSellPart5.gasPrice * resultSellPart5.gasUsed;
        }

        let user1EthSell5 = await ethers.provider.getBalance(user1.address);
        let marketKolEthSell5 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell5 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell5 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell5 = nftOwner1EthSell5 - nftOwner1EthSell4;
        let nftOwner2AddEthSell5 = nftOwner2EthSell5 - nftOwner2EthSell4;
        let user1EthSellAdd5 = user1EthSell5 - user1EthSell4 + gasSellPart5;

        expect(await info.marketKol.totalSupply(params.tid)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(nftOwner2AddEthSell1 / nftOwner1AddEthSell1).eq(19);
        expect(nftOwner2AddEthSell2 / nftOwner1AddEthSell2).eq(19);
        expect(nftOwner2AddEthSell3 / nftOwner1AddEthSell3).eq(19);
        expect(nftOwner2AddEthSell4 / nftOwner1AddEthSell4).eq(19);
        expect(nftOwner2AddEthSell5 / nftOwner1AddEthSell5).eq(19);

        expect(user1EthSellAdd1 / (nftOwner1AddEthSell1 + nftOwner2AddEthSell1)).eq(99);
        expect(user1EthSellAdd2 / (nftOwner1AddEthSell2 + nftOwner2AddEthSell2)).eq(99);
        expect(user1EthSellAdd3 / (nftOwner1AddEthSell3 + nftOwner2AddEthSell3)).eq(99);
        expect(user1EthSellAdd4 / (nftOwner1AddEthSell4 + nftOwner2AddEthSell4)).eq(99);
        expect(user1EthSellAdd5 / (nftOwner1AddEthSell5 + nftOwner2AddEthSell5)).eq(99);

        expect(marketKolEthSell5).eq(0);
        expect(marketKolEth2).eq(
          user1EthSellAdd1 +
          nftOwner1AddEthSell1 +
          nftOwner2AddEthSell1 +
          user1EthSellAdd2 +
          nftOwner1AddEthSell2 +
          nftOwner2AddEthSell2 +
          user1EthSellAdd3 +
          nftOwner1AddEthSell3 +
          nftOwner2AddEthSell3 +
          user1EthSellAdd4 +
          nftOwner1AddEthSell4 +
          nftOwner2AddEthSell4 +
          user1EthSellAdd5 +
          nftOwner1AddEthSell5 +
          nftOwner2AddEthSell5,
        );
      }
    });

    it("buy multi and sell multi by multi user", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.ethProxy;


        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];
        let user2 = info.wallets[info.nextWalletIndex + 4];
        let user3 = info.wallets[info.nextWalletIndex + 5];
        let user4 = info.wallets[info.nextWalletIndex + 6];
        let user5 = info.wallets[info.nextWalletIndex + 7];

        let buyAmount = getTokenAmountWei(BigInt(data[i].buyAmount));
        let expectNeedEth = data[i].expectNeedEth;

        if (buyAmount < getTokenAmountWei(BigInt(10))) {
          continue;
        }

        let part1 = buyAmount / BigInt(9);
        let part2 = (buyAmount - part1) / BigInt(7);
        let part3 = (buyAmount - part1) / BigInt(5);
        let part4 = (buyAmount - part1) / BigInt(3);
        let part5 = buyAmount - part1 - part2 - part3 - part4;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let user1Eth1 = await ethers.provider.getBalance(user1.address);
        let user2Eth1 = await ethers.provider.getBalance(user2.address);
        let user3Eth1 = await ethers.provider.getBalance(user3.address);
        let user4Eth1 = await ethers.provider.getBalance(user4.address);
        let user5Eth1 = await ethers.provider.getBalance(user5.address);
        let marketKolEth1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        let needEthPart1 = await info.marketKol.connect(user1).buy.staticCall(params.tid, part1, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart1 = await info.marketKol.connect(user1).buy(params.tid, part1, { value: needEthPart1 });
        let resultPart1 = await txPart1.wait();
        let gasPart1 = BigInt(0);
        if (resultPart1) {
          gasPart1 = resultPart1.gasPrice * resultPart1.gasUsed;
        }

        let curveEthPart1 = await info.marketKol.getPayTokenAmount(0, part1);

        let user1Eth2 = await ethers.provider.getBalance(user1.address);
        let user2Eth2 = await ethers.provider.getBalance(user2.address);
        let user3Eth2 = await ethers.provider.getBalance(user3.address);
        let user4Eth2 = await ethers.provider.getBalance(user4.address);
        let user5Eth2 = await ethers.provider.getBalance(user5.address);
        let marketKolEth2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth1 = nftOwner1Eth2 - nftOwner1Eth1;
        let nftOwner2AddEth1 = nftOwner2Eth2 - nftOwner2Eth1;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part2
        let needEthPart2 = await info.marketKol.connect(user2).buy.staticCall(params.tid, part2, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart2 = await info.marketKol.connect(user2).buy(params.tid, part2, { value: needEthPart2 });
        let resultPart2 = await txPart2.wait();
        let gasPart2 = BigInt(0);
        if (resultPart2) {
          gasPart2 = resultPart2.gasPrice * resultPart2.gasUsed;
        }

        let curveEthPart2 = await info.marketKol.getPayTokenAmount(part1, part2);

        let user1Eth3 = await ethers.provider.getBalance(user1.address);
        let user2Eth3 = await ethers.provider.getBalance(user2.address);
        let user3Eth3 = await ethers.provider.getBalance(user3.address);
        let user4Eth3 = await ethers.provider.getBalance(user4.address);
        let user5Eth3 = await ethers.provider.getBalance(user5.address);
        let marketKolEth3 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth3 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth3 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth2 = nftOwner1Eth3 - nftOwner1Eth2;
        let nftOwner2AddEth2 = nftOwner2Eth3 - nftOwner2Eth2;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(part2);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part3
        let needEthPart3 = await info.marketKol.connect(user3).buy.staticCall(params.tid, part3, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart3 = await info.marketKol.connect(user3).buy(params.tid, part3, { value: needEthPart3 });
        let resultPart3 = await txPart3.wait();
        let gasPart3 = BigInt(0);
        if (resultPart3) {
          gasPart3 = resultPart3.gasPrice * resultPart3.gasUsed;
        }

        let curveEthPart3 = await info.marketKol.getPayTokenAmount(part1 + part2, part3);

        let user1Eth4 = await ethers.provider.getBalance(user1.address);
        let user2Eth4 = await ethers.provider.getBalance(user2.address);
        let user3Eth4 = await ethers.provider.getBalance(user3.address);
        let user4Eth4 = await ethers.provider.getBalance(user4.address);
        let user5Eth4 = await ethers.provider.getBalance(user5.address);
        let marketKolEth4 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth4 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth4 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth3 = nftOwner1Eth4 - nftOwner1Eth3;
        let nftOwner2AddEth3 = nftOwner2Eth4 - nftOwner2Eth3;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(part2);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(part3);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part4
        let needEthPart4 = await info.marketKol.connect(user4).buy.staticCall(params.tid, part4, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart4 = await info.marketKol.connect(user4).buy(params.tid, part4, { value: needEthPart4 });
        let resultPart4 = await txPart4.wait();
        let gasPart4 = BigInt(0);
        if (resultPart4) {
          gasPart4 = resultPart4.gasPrice * resultPart4.gasUsed;
        }

        let curveEthPart4 = await info.marketKol.getPayTokenAmount(part1 + part2 + part3, part4);

        let user1Eth5 = await ethers.provider.getBalance(user1.address);
        let user2Eth5 = await ethers.provider.getBalance(user2.address);
        let user3Eth5 = await ethers.provider.getBalance(user3.address);
        let user4Eth5 = await ethers.provider.getBalance(user4.address);
        let user5Eth5 = await ethers.provider.getBalance(user5.address);
        let marketKolEth5 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth5 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth5 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth4 = nftOwner1Eth5 - nftOwner1Eth4;
        let nftOwner2AddEth4 = nftOwner2Eth5 - nftOwner2Eth4;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3 + part4);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(part2);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(part3);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(part4);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // part 5
        let needEthPart5 = await info.marketKol.connect(user5).buy.staticCall(params.tid, part5, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });
        let txPart5 = await info.marketKol.connect(user5).buy(params.tid, part5, { value: needEthPart5 });
        let resultPart5 = await txPart5.wait();
        let gasPart5 = BigInt(0);
        if (resultPart5) {
          gasPart5 = resultPart5.gasPrice * resultPart5.gasUsed;
        }

        let curveEthPart5 = await info.marketKol.getPayTokenAmount(part1 + part2 + part3 + part4, part5);

        let user1Eth6 = await ethers.provider.getBalance(user1.address);
        let user2Eth6 = await ethers.provider.getBalance(user2.address);
        let user3Eth6 = await ethers.provider.getBalance(user3.address);
        let user4Eth6 = await ethers.provider.getBalance(user4.address);
        let user5Eth6 = await ethers.provider.getBalance(user5.address);
        let marketKolEth6 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1Eth6 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth6 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth5 = nftOwner1Eth6 - nftOwner1Eth5;
        let nftOwner2AddEth5 = nftOwner2Eth6 - nftOwner2Eth5;

        expect(await info.marketKol.totalSupply(params.tid)).eq(part1 + part2 + part3 + part4 + part5);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(part1);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(part2);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(part3);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(part4);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(part5);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        let curveEth = await info.marketKol.getPayTokenAmount(0, part1 + part2 + part3 + part4 + part5);

        let needEth = needEthPart1 + needEthPart2 + needEthPart3 + needEthPart4 + needEthPart5;

        expect(expectNeedEth - needEth).lte(7);
        expect(expectNeedEth - needEth).gte(0);

        expect(user1Eth2).eq(user1Eth1 - needEthPart1 - gasPart1);
        expect(user1Eth2).eq(user1Eth3).eq(user1Eth4).eq(user1Eth5).eq(user1Eth6);

        expect(user2Eth3).eq(user2Eth2 - needEthPart2 - gasPart2);
        expect(user2Eth1).eq(user2Eth2);
        expect(user2Eth3).eq(user2Eth4).eq(user2Eth5).eq(user2Eth6);

        expect(user3Eth4).eq(user3Eth3 - needEthPart3 - gasPart3);
        expect(user3Eth1).eq(user3Eth2).eq(user3Eth3);
        expect(user3Eth4).eq(user3Eth5).eq(user3Eth6);

        expect(user4Eth5).eq(user4Eth4 - needEthPart4 - gasPart4);
        expect(user5Eth6).eq(user5Eth5 - needEthPart5 - gasPart5);

        expect(marketKolEth2 - marketKolEth1).eq(curveEthPart1);
        expect(marketKolEth3 - marketKolEth2).eq(curveEthPart2);
        expect(marketKolEth4 - marketKolEth3).eq(curveEthPart3);
        expect(marketKolEth5 - marketKolEth4).eq(curveEthPart4);
        expect(marketKolEth6 - marketKolEth5).eq(curveEthPart5);
        expect(marketKolEth6 - marketKolEth1)
          .eq(curveEth)
          .eq(curveEthPart1 + curveEthPart2 + curveEthPart3 + curveEthPart4 + curveEthPart5);

        expect(curveEthPart1 + nftOwner1AddEth1 + nftOwner2AddEth1).eq(needEthPart1);
        expect(curveEthPart2 + nftOwner1AddEth2 + nftOwner2AddEth2).eq(needEthPart2);
        expect(curveEthPart3 + nftOwner1AddEth3 + nftOwner2AddEth3).eq(needEthPart3);
        expect(curveEthPart4 + nftOwner1AddEth4 + nftOwner2AddEth4).eq(needEthPart4);
        expect(curveEthPart5 + nftOwner1AddEth5 + nftOwner2AddEth5).eq(needEthPart5);

        expect(nftOwner2AddEth1 / nftOwner1AddEth1).eq(19);
        expect(nftOwner2AddEth2 / nftOwner1AddEth2).eq(19);
        expect(nftOwner2AddEth3 / nftOwner1AddEth3).eq(19);
        expect(nftOwner2AddEth4 / nftOwner1AddEth4).eq(19);
        expect(nftOwner2AddEth5 / nftOwner1AddEth5).eq(19);

        expect(curveEthPart1 / (nftOwner1AddEth1 + nftOwner2AddEth1)).eq(100);
        expect(curveEthPart2 / (nftOwner1AddEth2 + nftOwner2AddEth2)).eq(100);
        expect(curveEthPart3 / (nftOwner1AddEth3 + nftOwner2AddEth3)).eq(100);
        expect(curveEthPart4 / (nftOwner1AddEth4 + nftOwner2AddEth4)).eq(100);
        expect(curveEthPart5 / (nftOwner1AddEth5 + nftOwner2AddEth5)).eq(100);

        // sell part1
        let txSellPart1 = await info.marketKol.connect(user1).sell(params.tid, part1);
        let resultSellPart1 = await txSellPart1.wait();
        let gasSellPart1 = BigInt(0);
        if (resultSellPart1) {
          gasSellPart1 = resultSellPart1.gasPrice * resultSellPart1.gasUsed;
        }

        let user1EthSell1 = await ethers.provider.getBalance(user1.address);
        let user2EthSell1 = await ethers.provider.getBalance(user2.address);
        let user3EthSell1 = await ethers.provider.getBalance(user3.address);
        let user4EthSell1 = await ethers.provider.getBalance(user4.address);
        let user5EthSell1 = await ethers.provider.getBalance(user5.address);
        let marketKolEthSell1 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell1 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell1 = nftOwner1EthSell1 - nftOwner1Eth6;
        let nftOwner2AddEthSell1 = nftOwner2EthSell1 - nftOwner2Eth6;
        let user1EthSellAdd1 = user1EthSell1 - user1Eth6 + gasSellPart1;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(part2);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(part3);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(part4);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(part5);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part2
        let txSellPart2 = await info.marketKol.connect(user2).sell(params.tid, part2);
        let resultSellPart2 = await txSellPart2.wait();
        let gasSellPart2 = BigInt(0);
        if (resultSellPart2) {
          gasSellPart2 = resultSellPart2.gasPrice * resultSellPart2.gasUsed;
        }

        let user1EthSell2 = await ethers.provider.getBalance(user1.address);
        let user2EthSell2 = await ethers.provider.getBalance(user2.address);
        let user3EthSell2 = await ethers.provider.getBalance(user3.address);
        let user4EthSell2 = await ethers.provider.getBalance(user4.address);
        let user5EthSell2 = await ethers.provider.getBalance(user5.address);
        let marketKolEthSell2 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell2 = nftOwner1EthSell2 - nftOwner1EthSell1;
        let nftOwner2AddEthSell2 = nftOwner2EthSell2 - nftOwner2EthSell1;
        let user2EthSellAdd2 = user2EthSell2 - user2EthSell1 + gasSellPart2;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(part3);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(part4);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(part5);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part3
        let txSellPart3 = await info.marketKol.connect(user3).sell(params.tid, part3);
        let resultSellPart3 = await txSellPart3.wait();
        let gasSellPart3 = BigInt(0);
        if (resultSellPart3) {
          gasSellPart3 = resultSellPart3.gasPrice * resultSellPart3.gasUsed;
        }

        let user1EthSell3 = await ethers.provider.getBalance(user1.address);
        let user2EthSell3 = await ethers.provider.getBalance(user2.address);
        let user3EthSell3 = await ethers.provider.getBalance(user3.address);
        let user4EthSell3 = await ethers.provider.getBalance(user4.address);
        let user5EthSell3 = await ethers.provider.getBalance(user5.address);
        let marketKolEthSell3 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell3 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell3 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell3 = nftOwner1EthSell3 - nftOwner1EthSell2;
        let nftOwner2AddEthSell3 = nftOwner2EthSell3 - nftOwner2EthSell2;
        let user3EthSellAdd3 = user3EthSell3 - user3EthSell2 + gasSellPart3;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2 - part3);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(part4);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(part5);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part4
        let txSellPart4 = await info.marketKol.connect(user4).sell(params.tid, part4);
        let resultSellPart4 = await txSellPart4.wait();
        let gasSellPart4 = BigInt(0);
        if (resultSellPart4) {
          gasSellPart4 = resultSellPart4.gasPrice * resultSellPart4.gasUsed;
        }

        let user1EthSell4 = await ethers.provider.getBalance(user1.address);
        let user2EthSell4 = await ethers.provider.getBalance(user2.address);
        let user3EthSell4 = await ethers.provider.getBalance(user3.address);
        let user4EthSell4 = await ethers.provider.getBalance(user4.address);
        let user5EthSell4 = await ethers.provider.getBalance(user5.address);
        let marketKolEthSell4 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell4 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell4 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell4 = nftOwner1EthSell4 - nftOwner1EthSell3;
        let nftOwner2AddEthSell4 = nftOwner2EthSell4 - nftOwner2EthSell3;
        let user4EthSellAdd4 = user4EthSell4 - user4EthSell3 + gasSellPart4;

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount - part1 - part2 - part3 - part4);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(part5);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        // sell part5
        let txSellPart5 = await info.marketKol.connect(user5).sell(params.tid, part5);
        let resultSellPart5 = await txSellPart5.wait();
        let gasSellPart5 = BigInt(0);
        if (resultSellPart5) {
          gasSellPart5 = resultSellPart5.gasPrice * resultSellPart5.gasUsed;
        }

        let user1EthSell5 = await ethers.provider.getBalance(user1.address);
        let user2EthSell5 = await ethers.provider.getBalance(user2.address);
        let user3EthSell5 = await ethers.provider.getBalance(user3.address);
        let user4EthSell5 = await ethers.provider.getBalance(user4.address);
        let user5EthSell5 = await ethers.provider.getBalance(user5.address);
        let marketKolEthSell5 = await ethers.provider.getBalance(await info.marketKol.getAddress());
        let nftOwner1EthSell5 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2EthSell5 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEthSell5 = nftOwner1EthSell5 - nftOwner1EthSell4;
        let nftOwner2AddEthSell5 = nftOwner2EthSell5 - nftOwner2EthSell4;
        let user5EthSellAdd5 = user5EthSell5 - user5EthSell4 + gasSellPart5;

        expect(user1Eth6).lt(user1EthSell1);
        expect(user1EthSell1).eq(user1EthSell2).eq(user1EthSell3).eq(user1EthSell4).eq(user1EthSell5);

        expect(user2EthSell1).lt(user2EthSell2);
        expect(user2EthSell2).eq(user2EthSell3).eq(user2EthSell4).eq(user2EthSell5);

        expect(user3EthSell1).eq(user3EthSell2);
        expect(user3EthSell2).lt(user3EthSell3);
        expect(user3EthSell3).eq(user3EthSell4).eq(user3EthSell5);

        expect(user4EthSell1).eq(user4EthSell2).eq(user4EthSell3);
        expect(user4EthSell3).lt(user4EthSell4);
        expect(user4EthSell4).eq(user4EthSell5);

        expect(user5EthSell1).eq(user5EthSell2).eq(user5EthSell3).eq(user5EthSell4);
        expect(user5EthSell4).lt(user5EthSell5);

        expect(await info.marketKol.totalSupply(params.tid)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user2.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user3.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user4.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user5.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(nftOwner2AddEthSell1 / nftOwner1AddEthSell1).eq(19);
        expect(nftOwner2AddEthSell2 / nftOwner1AddEthSell2).eq(19);
        expect(nftOwner2AddEthSell3 / nftOwner1AddEthSell3).eq(19);
        expect(nftOwner2AddEthSell4 / nftOwner1AddEthSell4).eq(19);
        expect(nftOwner2AddEthSell5 / nftOwner1AddEthSell5).eq(19);

        expect(user1EthSellAdd1 / (nftOwner1AddEthSell1 + nftOwner2AddEthSell1)).eq(99);
        expect(user2EthSellAdd2 / (nftOwner1AddEthSell2 + nftOwner2AddEthSell2)).eq(99);
        expect(user3EthSellAdd3 / (nftOwner1AddEthSell3 + nftOwner2AddEthSell3)).eq(99);
        expect(user4EthSellAdd4 / (nftOwner1AddEthSell4 + nftOwner2AddEthSell4)).eq(99);
        expect(user5EthSellAdd5 / (nftOwner1AddEthSell5 + nftOwner2AddEthSell5)).eq(99);

        expect(marketKolEthSell5).eq(0);
        expect(marketKolEth6).eq(
          user1EthSellAdd1 +
          nftOwner1AddEthSell1 +
          nftOwner2AddEthSell1 +
          user2EthSellAdd2 +
          nftOwner1AddEthSell2 +
          nftOwner2AddEthSell2 +
          user3EthSellAdd3 +
          nftOwner1AddEthSell3 +
          nftOwner2AddEthSell3 +
          user4EthSellAdd4 +
          nftOwner1AddEthSell4 +
          nftOwner2AddEthSell4 +
          user5EthSellAdd5 +
          nftOwner1AddEthSell5 +
          nftOwner2AddEthSell5,
        );
      }
    });

    it("buy multi tid and sell multi tid by multi user", async function () {
      /**
       * user1 buy  t1 1000
       * user2 buy  t2 10000
       * user3 buy  t1 10000
       * user4 buy  t2 1000
       * user1 sell t1 1000
       * user2 sell t2 10000
       * user3 sell t1 10000
       * user4 sell t2 1000
       */
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.ethProxy;

      let nftOwnerT1U1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1U2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2U1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2U2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];
      let user3 = info.wallets[info.nextWalletIndex + 7];
      let user4 = info.wallets[info.nextWalletIndex + 8];

      let inputData = {
        u1: {
          buyAmount: getTokenAmountWei(1000),
        },
        u2: {
          buyAmount: getTokenAmountWei(10000),
        },
        u3: {
          buyAmount: getTokenAmountWei(10000),
        },
        u4: {
          buyAmount: getTokenAmountWei(1000),
        },
      };

      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwnerT1U1.address,
        onftOwner: nftOwnerT1U2.address,
      };
      await info.appOperator
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);
      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2U1.address,
        onftOwner: nftOwnerT2U2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);

      let user1EthStart = await ethers.provider.getBalance(user1.address);
      let user2EthStart = await ethers.provider.getBalance(user2.address);
      let user3EthStart = await ethers.provider.getBalance(user3.address);
      let user4EthStart = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthStart = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthStart = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthStart = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthStart = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthStart = await ethers.provider.getBalance(await info.marketKol.getAddress());

      let curveEthBuyT1U1ByBuy = await info.marketKol.getBuyPayTokenAmount(paramsT1.tid, inputData.u1.buyAmount);

      // user1 buy  t1 1000
      let needEthU1 = await info.marketKol.connect(user1).buy.staticCall(paramsT1.tid, inputData.u1.buyAmount, {
        value: BigInt(10) ** BigInt(18) * BigInt(100000000),
      });
      let txBuyU1 = await info.marketKol.connect(user1).buy(paramsT1.tid, inputData.u1.buyAmount, { value: needEthU1 });
      let resultBuyU1 = await txBuyU1.wait();
      let gasBuyU1 = BigInt(0);
      if (resultBuyU1) {
        gasBuyU1 = resultBuyU1.gasPrice * resultBuyU1.gasUsed;
      }

      let user1EthBuyU1End = await ethers.provider.getBalance(user1.address);
      let user2EthBuyU1End = await ethers.provider.getBalance(user2.address);
      let user3EthBuyU1End = await ethers.provider.getBalance(user3.address);
      let user4EthBuyU1End = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthBuyU1End = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthBuyU1End = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthBuyU1End = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthBuyU1End = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthBuyU1End = await ethers.provider.getBalance(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(inputData.u1.buyAmount);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(inputData.u1.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      // user1 buy t1 1000 check eth
      let curveEthBuyT1U1 = await info.marketKol.getPayTokenAmount(0, inputData.u1.buyAmount);

      let nftOwnerT1U1EthBuyT1U1Add = nftOwnerT1U1EthBuyU1End - nftOwnerT1U1EthStart;
      let nftOwnerT1U2EthBuyT1U1Add = nftOwnerT1U2EthBuyU1End - nftOwnerT1U2EthStart;

      let needEthBuyU1 = user1EthStart - gasBuyU1 - user1EthBuyU1End;

      expect(marketKolEthStart).eq(0);
      expect(marketKolEthBuyU1End).eq(marketKolEthStart + curveEthBuyT1U1);

      expect(nftOwnerT1U2EthBuyT1U1Add / nftOwnerT1U1EthBuyT1U1Add).eq(19);
      expect(curveEthBuyT1U1 / (nftOwnerT1U2EthBuyT1U1Add + nftOwnerT1U1EthBuyT1U1Add)).eq(100);
      expect(needEthBuyU1 - nftOwnerT1U2EthBuyT1U1Add - nftOwnerT1U1EthBuyT1U1Add).eq(curveEthBuyT1U1);

      expect(curveEthBuyT1U1ByBuy).eq(curveEthBuyT1U1);

      // eq
      expect(user2EthStart).eq(user2EthBuyU1End);
      expect(user3EthStart).eq(user3EthBuyU1End);
      expect(user4EthStart).eq(user4EthBuyU1End);

      expect(nftOwnerT2U1EthBuyU1End).eq(nftOwnerT2U1EthStart);
      expect(nftOwnerT2U2EthBuyU1End).eq(nftOwnerT2U2EthStart);

      // user2 buy  t2 10000
      let curveEthBuyT2U2ByBuy = await info.marketKol.getBuyPayTokenAmount(paramsT2.tid, inputData.u2.buyAmount);

      let needEthU2 = await info.marketKol.connect(user2).buy.staticCall(paramsT2.tid, inputData.u2.buyAmount, {
        value: BigInt(10) ** BigInt(18) * BigInt(100000000),
      });
      let txBuyU2 = await info.marketKol.connect(user2).buy(paramsT2.tid, inputData.u2.buyAmount, { value: needEthU2 });
      let resultBuyU2 = await txBuyU2.wait();
      let gasBuyU2 = BigInt(0);
      if (resultBuyU2) {
        gasBuyU2 = resultBuyU2.gasPrice * resultBuyU2.gasUsed;
      }

      let user1EthBuyU2End = await ethers.provider.getBalance(user1.address);
      let user2EthBuyU2End = await ethers.provider.getBalance(user2.address);
      let user3EthBuyU2End = await ethers.provider.getBalance(user3.address);
      let user4EthBuyU2End = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthBuyU2End = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthBuyU2End = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthBuyU2End = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthBuyU2End = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthBuyU2End = await ethers.provider.getBalance(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(inputData.u1.buyAmount);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(inputData.u2.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(inputData.u1.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(inputData.u2.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      // user2 buy t2 10000 check eth
      let curveEthBuyT2U2 = await info.marketKol.getPayTokenAmount(0, inputData.u2.buyAmount);

      let nftOwnerT2U1EthBuyT1U2Add = nftOwnerT2U1EthBuyU2End - nftOwnerT2U1EthStart;
      let nftOwnerT2U2EthBuyT1U2Add = nftOwnerT2U2EthBuyU2End - nftOwnerT2U2EthStart;

      let needEthBuyU2 = user2EthStart - gasBuyU2 - user2EthBuyU2End;

      expect(marketKolEthBuyU2End).eq(marketKolEthBuyU1End + curveEthBuyT2U2);

      expect(nftOwnerT2U2EthBuyT1U2Add / nftOwnerT2U1EthBuyT1U2Add).eq(19);
      expect(curveEthBuyT2U2 / (nftOwnerT2U2EthBuyT1U2Add + nftOwnerT2U1EthBuyT1U2Add)).eq(100);
      expect(needEthBuyU2 - nftOwnerT2U2EthBuyT1U2Add - nftOwnerT2U1EthBuyT1U2Add).eq(curveEthBuyT2U2);

      expect(curveEthBuyT2U2ByBuy).eq(curveEthBuyT2U2);

      // eq
      expect(user1EthBuyU1End).eq(user1EthBuyU2End);
      expect(user3EthBuyU1End).eq(user3EthBuyU2End);
      expect(user4EthBuyU1End).eq(user4EthBuyU2End);

      expect(nftOwnerT1U1EthBuyU2End).eq(nftOwnerT1U1EthBuyU1End);
      expect(nftOwnerT1U2EthBuyU2End).eq(nftOwnerT1U2EthBuyU1End);

      // user3 buy  t1 10000
      let curveEthBuyT1U3ByBuy = await info.marketKol.getBuyPayTokenAmount(paramsT1.tid, inputData.u3.buyAmount);

      let needEthU3 = await info.marketKol.connect(user3).buy.staticCall(paramsT1.tid, inputData.u3.buyAmount, {
        value: BigInt(10) ** BigInt(18) * BigInt(100000000),
      });
      let txBuyU3 = await info.marketKol.connect(user3).buy(paramsT1.tid, inputData.u3.buyAmount, { value: needEthU3 });
      let resultBuyU3 = await txBuyU3.wait();
      let gasBuyU3 = BigInt(0);
      if (resultBuyU3) {
        gasBuyU3 = resultBuyU3.gasPrice * resultBuyU3.gasUsed;
      }

      let user1EthBuyU3End = await ethers.provider.getBalance(user1.address);
      let user2EthBuyU3End = await ethers.provider.getBalance(user2.address);
      let user3EthBuyU3End = await ethers.provider.getBalance(user3.address);
      let user4EthBuyU3End = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthBuyU3End = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthBuyU3End = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthBuyU3End = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthBuyU3End = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthBuyU3End = await ethers.provider.getBalance(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(inputData.u1.buyAmount + inputData.u3.buyAmount);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(inputData.u2.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(inputData.u1.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user3.address)).eq(inputData.u3.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(inputData.u2.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      // user3 buy t1 10000 check eth
      let curveEthBuyT1U3 = await info.marketKol.getPayTokenAmount(inputData.u1.buyAmount, inputData.u3.buyAmount);

      let nftOwnerT1U1EthBuyT1U3Add = nftOwnerT1U1EthBuyU3End - nftOwnerT1U1EthBuyU2End;
      let nftOwnerT1U2EthBuyT1U3Add = nftOwnerT1U2EthBuyU3End - nftOwnerT1U2EthBuyU2End;

      let needEthBuyU3 = user3EthBuyU2End - gasBuyU3 - user3EthBuyU3End;

      expect(marketKolEthBuyU3End).eq(marketKolEthBuyU2End + curveEthBuyT1U3);

      expect(nftOwnerT1U2EthBuyT1U3Add / nftOwnerT1U1EthBuyT1U3Add).eq(19);
      expect(curveEthBuyT1U3 / (nftOwnerT1U2EthBuyT1U3Add + nftOwnerT1U1EthBuyT1U3Add)).eq(100);
      expect(needEthBuyU3 - nftOwnerT1U2EthBuyT1U3Add - nftOwnerT1U1EthBuyT1U3Add).eq(curveEthBuyT1U3);

      expect(curveEthBuyT1U3ByBuy).eq(curveEthBuyT1U3);

      // eq
      expect(user1EthBuyU2End).eq(user1EthBuyU3End);
      expect(user2EthBuyU2End).eq(user2EthBuyU3End);
      expect(user4EthBuyU2End).eq(user4EthBuyU3End);

      expect(nftOwnerT2U1EthBuyU3End).eq(nftOwnerT2U1EthBuyU2End);
      expect(nftOwnerT2U2EthBuyU3End).eq(nftOwnerT2U2EthBuyU2End);

      // user4 buy  t2 1000
      let curveEthBuyT2U4ByBuy = await info.marketKol.getBuyPayTokenAmount(paramsT2.tid, inputData.u4.buyAmount);

      let needEthU4 = await info.marketKol.connect(user4).buy.staticCall(paramsT2.tid, inputData.u4.buyAmount, {
        value: BigInt(10) ** BigInt(18) * BigInt(100000000),
      });
      let txBuyU4 = await info.marketKol.connect(user4).buy(paramsT2.tid, inputData.u4.buyAmount, { value: needEthU4 });
      let resultBuyU4 = await txBuyU4.wait();
      let gasBuyU4 = BigInt(0);
      if (resultBuyU4) {
        gasBuyU4 = resultBuyU4.gasPrice * resultBuyU4.gasUsed;
      }

      let user1EthBuyU4End = await ethers.provider.getBalance(user1.address);
      let user2EthBuyU4End = await ethers.provider.getBalance(user2.address);
      let user3EthBuyU4End = await ethers.provider.getBalance(user3.address);
      let user4EthBuyU4End = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthBuyU4End = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthBuyU4End = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthBuyU4End = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthBuyU4End = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthBuyU4End = await ethers.provider.getBalance(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(inputData.u1.buyAmount + inputData.u3.buyAmount);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(inputData.u2.buyAmount + inputData.u4.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(inputData.u1.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user3.address)).eq(inputData.u3.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(inputData.u2.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user4.address)).eq(inputData.u4.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      // user4 buy t2 1000 check eth
      let curveEthBuyT2U4 = await info.marketKol.getPayTokenAmount(inputData.u2.buyAmount, inputData.u4.buyAmount);

      let nftOwnerT2U1EthBuyT2U4Add = nftOwnerT2U1EthBuyU4End - nftOwnerT2U1EthBuyU3End;
      let nftOwnerT2U2EthBuyT2U4Add = nftOwnerT2U2EthBuyU4End - nftOwnerT2U2EthBuyU3End;

      let needEthBuyU4 = user4EthBuyU3End - gasBuyU4 - user4EthBuyU4End;

      expect(marketKolEthBuyU4End).eq(marketKolEthBuyU3End + curveEthBuyT2U4);

      expect(nftOwnerT2U2EthBuyT2U4Add / nftOwnerT2U1EthBuyT2U4Add).eq(19);
      expect(curveEthBuyT2U4 / (nftOwnerT2U2EthBuyT2U4Add + nftOwnerT2U1EthBuyT2U4Add)).eq(100);
      expect(needEthBuyU4 - nftOwnerT2U2EthBuyT2U4Add - nftOwnerT2U1EthBuyT2U4Add).eq(curveEthBuyT2U4);

      expect(curveEthBuyT2U4ByBuy).eq(curveEthBuyT2U4);

      // eq
      expect(user1EthBuyU3End).eq(user1EthBuyU4End);
      expect(user2EthBuyU3End).eq(user2EthBuyU4End);
      expect(user3EthBuyU3End).eq(user3EthBuyU4End);

      expect(nftOwnerT1U1EthBuyU4End).eq(nftOwnerT1U1EthBuyU3End);
      expect(nftOwnerT1U2EthBuyU4End).eq(nftOwnerT1U2EthBuyU3End);

      // user1 sell t1 1000
      let curveEthSellT1U1BySell = await info.marketKol.getSellPayTokenAmount(paramsT1.tid, inputData.u1.buyAmount);

      let txSellU1 = await info.marketKol.connect(user1).sell(paramsT1.tid, inputData.u1.buyAmount);
      let resultSellU1 = await txSellU1.wait();
      let gasSellU1 = BigInt(0);
      if (resultSellU1) {
        gasSellU1 = resultSellU1.gasPrice * resultSellU1.gasUsed;
      }

      let user1EthSellU1End = await ethers.provider.getBalance(user1.address);
      let user2EthSellU1End = await ethers.provider.getBalance(user2.address);
      let user3EthSellU1End = await ethers.provider.getBalance(user3.address);
      let user4EthSellU1End = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthSellU1End = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthSellU1End = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthSellU1End = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthSellU1End = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthSellU1End = await ethers.provider.getBalance(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(inputData.u3.buyAmount);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(inputData.u2.buyAmount + inputData.u4.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user3.address)).eq(inputData.u3.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(inputData.u2.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user4.address)).eq(inputData.u4.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      // user1 sell t1 1000 check eth
      let curveEthSellT1U1 = await info.marketKol.getPayTokenAmount(inputData.u3.buyAmount, inputData.u1.buyAmount);

      let nftOwnerT2U1EthSellU1Add = nftOwnerT1U1EthSellU1End - nftOwnerT1U1EthBuyU4End;
      let nftOwnerT2U2EthSellU1Add = nftOwnerT1U2EthSellU1End - nftOwnerT1U2EthBuyU4End;

      let getEthSellU1 = user1EthSellU1End - user1EthBuyU4End + gasSellU1;

      expect(marketKolEthSellU1End).eq(marketKolEthBuyU4End - curveEthSellT1U1);

      expect(nftOwnerT2U2EthSellU1Add / nftOwnerT2U1EthSellU1Add).eq(19);
      expect(curveEthSellT1U1 / (nftOwnerT2U2EthSellU1Add + nftOwnerT2U1EthSellU1Add)).eq(100);
      expect(getEthSellU1 + nftOwnerT2U2EthSellU1Add + nftOwnerT2U1EthSellU1Add).eq(curveEthSellT1U1);

      expect(curveEthSellT1U1BySell).eq(curveEthSellT1U1);

      // eq
      expect(user2EthBuyU4End).eq(user2EthSellU1End);
      expect(user3EthBuyU4End).eq(user3EthSellU1End);
      expect(user4EthBuyU4End).eq(user4EthSellU1End);

      expect(nftOwnerT2U1EthSellU1End).eq(nftOwnerT2U1EthBuyU4End);
      expect(nftOwnerT2U2EthSellU1End).eq(nftOwnerT2U2EthBuyU4End);

      // user2 sell t2 10000
      let curveEthSellT2U2BySell = await info.marketKol.getSellPayTokenAmount(paramsT2.tid, inputData.u2.buyAmount);

      let txSellU2 = await info.marketKol.connect(user2).sell(paramsT2.tid, inputData.u2.buyAmount);
      let resultSellU2 = await txSellU2.wait();
      let gasSellU2 = BigInt(0);
      if (resultSellU2) {
        gasSellU2 = resultSellU2.gasPrice * resultSellU2.gasUsed;
      }

      let user1EthSellU2End = await ethers.provider.getBalance(user1.address);
      let user2EthSellU2End = await ethers.provider.getBalance(user2.address);
      let user3EthSellU2End = await ethers.provider.getBalance(user3.address);
      let user4EthSellU2End = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthSellU2End = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthSellU2End = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthSellU2End = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthSellU2End = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthSellU2End = await ethers.provider.getBalance(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(inputData.u3.buyAmount);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(inputData.u4.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user3.address)).eq(inputData.u3.buyAmount);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user4.address)).eq(inputData.u4.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      // user2 sell t2 10000 check eth
      let curveEthSellT2U2 = await info.marketKol.getPayTokenAmount(inputData.u4.buyAmount, inputData.u2.buyAmount);

      let nftOwnerT2U1EthSellU2Add = nftOwnerT2U1EthSellU2End - nftOwnerT2U1EthSellU1End;
      let nftOwnerT2U2EthSellU2Add = nftOwnerT2U2EthSellU2End - nftOwnerT2U2EthSellU1End;

      let getEthSellU2 = user2EthSellU2End - user2EthSellU1End + gasSellU2;

      expect(marketKolEthSellU2End).eq(marketKolEthSellU1End - curveEthSellT2U2);

      expect(nftOwnerT2U2EthSellU2Add / nftOwnerT2U1EthSellU2Add).eq(19);
      expect(curveEthSellT2U2 / (nftOwnerT2U2EthSellU2Add + nftOwnerT2U1EthSellU2Add)).eq(100);
      expect(getEthSellU2 + nftOwnerT2U2EthSellU2Add + nftOwnerT2U1EthSellU2Add).eq(curveEthSellT2U2);

      expect(curveEthSellT2U2BySell).eq(curveEthSellT2U2);

      // eq
      expect(user1EthSellU1End).eq(user1EthSellU2End);
      expect(user3EthSellU1End).eq(user3EthSellU2End);
      expect(user4EthSellU1End).eq(user4EthSellU2End);

      expect(nftOwnerT1U1EthSellU2End).eq(nftOwnerT1U1EthSellU1End);
      expect(nftOwnerT1U2EthSellU2End).eq(nftOwnerT1U2EthSellU1End);

      // user3 sell t1 10000
      let curveEthSellT1U3BySell = await info.marketKol.getSellPayTokenAmount(paramsT1.tid, inputData.u3.buyAmount);

      let txSellU3 = await info.marketKol.connect(user3).sell(paramsT1.tid, inputData.u3.buyAmount);
      let resultSellU3 = await txSellU3.wait();
      let gasSellU3 = BigInt(0);
      if (resultSellU3) {
        gasSellU3 = resultSellU3.gasPrice * resultSellU3.gasUsed;
      }

      let user1EthSellU3End = await ethers.provider.getBalance(user1.address);
      let user2EthSellU3End = await ethers.provider.getBalance(user2.address);
      let user3EthSellU3End = await ethers.provider.getBalance(user3.address);
      let user4EthSellU3End = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthSellU3End = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthSellU3End = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthSellU3End = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthSellU3End = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthSellU3End = await ethers.provider.getBalance(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(0);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(inputData.u4.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user4.address)).eq(inputData.u4.buyAmount);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      // user3 sell t1 10000 check eth
      let curveEthSellT1U3 = await info.marketKol.getPayTokenAmount(0, inputData.u3.buyAmount);

      let nftOwnerT1U1EthSellU3Add = nftOwnerT1U1EthSellU3End - nftOwnerT1U1EthSellU2End;
      let nftOwnerT1U2EthSellU3Add = nftOwnerT1U2EthSellU3End - nftOwnerT1U2EthSellU2End;

      let getEthSellU3 = user3EthSellU3End - user3EthSellU2End + gasSellU3;

      expect(marketKolEthSellU3End).eq(marketKolEthSellU2End - curveEthSellT1U3);

      expect(nftOwnerT1U2EthSellU3Add / nftOwnerT1U1EthSellU3Add).eq(19);
      expect(curveEthSellT1U3 / (nftOwnerT1U2EthSellU3Add + nftOwnerT1U1EthSellU3Add)).eq(100);
      expect(getEthSellU3 + nftOwnerT1U2EthSellU3Add + nftOwnerT1U1EthSellU3Add).eq(curveEthSellT1U3);

      expect(curveEthSellT1U3BySell).eq(curveEthSellT1U3);

      // eq
      expect(user1EthSellU2End).eq(user1EthSellU3End);
      expect(user2EthSellU2End).eq(user2EthSellU3End);
      expect(user4EthSellU2End).eq(user4EthSellU3End);

      expect(nftOwnerT2U1EthSellU3End).eq(nftOwnerT2U1EthSellU2End);
      expect(nftOwnerT2U2EthSellU3End).eq(nftOwnerT2U2EthSellU2End);

      // user4 sell t2 1000
      let curveEthSellT2U4BySell = await info.marketKol.getSellPayTokenAmount(paramsT2.tid, inputData.u4.buyAmount);

      let txSellU4 = await info.marketKol.connect(user4).sell(paramsT2.tid, inputData.u4.buyAmount);
      let resultSellU4 = await txSellU4.wait();
      let gasSellU4 = BigInt(0);
      if (resultSellU4) {
        gasSellU4 = resultSellU4.gasPrice * resultSellU4.gasUsed;
      }

      let user1EthSellU4End = await ethers.provider.getBalance(user1.address);
      let user2EthSellU4End = await ethers.provider.getBalance(user2.address);
      let user3EthSellU4End = await ethers.provider.getBalance(user3.address);
      let user4EthSellU4End = await ethers.provider.getBalance(user4.address);
      let nftOwnerT1U1EthSellU4End = await ethers.provider.getBalance(nftOwnerT1U1.address);
      let nftOwnerT1U2EthSellU4End = await ethers.provider.getBalance(nftOwnerT1U2.address);
      let nftOwnerT2U1EthSellU4End = await ethers.provider.getBalance(nftOwnerT2U1.address);
      let nftOwnerT2U2EthSellU4End = await ethers.provider.getBalance(nftOwnerT2U2.address);
      let marketKolEthSellU4End = await ethers.provider.getBalance(await info.marketKol.getAddress());

      expect(await info.marketKol.totalSupply(paramsT1.tid)).eq(0);
      expect(await info.marketKol.totalSupply(paramsT2.tid)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user3.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, user4.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT1.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT1U2.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U1.address)).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, nftOwnerT2U2.address)).eq(0);

      expect(await info.marketKol.balanceOf(paramsT1.tid, await info.marketKol.getAddress())).eq(0);
      expect(await info.marketKol.balanceOf(paramsT2.tid, await info.marketKol.getAddress())).eq(0);

      // user4 sell t2 1000 check eth
      let curveEthSellT2U4 = await info.marketKol.getPayTokenAmount(0, inputData.u4.buyAmount);

      let nftOwnerT2U1EthSellU4Add = nftOwnerT2U1EthSellU4End - nftOwnerT2U1EthSellU3End;
      let nftOwnerT2U2EthSellU4Add = nftOwnerT2U2EthSellU4End - nftOwnerT2U2EthSellU3End;

      let getEthSellU4 = user4EthSellU4End - user4EthSellU3End + gasSellU4;

      expect(marketKolEthSellU4End).eq(marketKolEthSellU3End - curveEthSellT2U4);

      expect(nftOwnerT2U2EthSellU4Add / nftOwnerT2U1EthSellU4Add).eq(19);
      expect(curveEthSellT2U4 / (nftOwnerT2U2EthSellU4Add + nftOwnerT2U1EthSellU4Add)).eq(100);
      expect(getEthSellU4 + nftOwnerT2U2EthSellU4Add + nftOwnerT2U1EthSellU4Add).eq(curveEthSellT2U4);

      expect(curveEthSellT2U4BySell).eq(curveEthSellT2U4);

      // eq
      expect(user1EthSellU3End).eq(user1EthSellU4End);
      expect(user2EthSellU3End).eq(user2EthSellU4End);
      expect(user3EthSellU3End).eq(user3EthSellU4End);

      expect(nftOwnerT1U1EthSellU4End).eq(nftOwnerT1U1EthSellU3End);
      expect(nftOwnerT1U2EthSellU4End).eq(nftOwnerT1U2EthSellU3End);

      // end
      expect(marketKolEthSellU4End).eq(0);
    });

    it("buy table", async function () {
      let wei = BigInt(10) ** BigInt(18);
      let amounts = [];

      for (let i = 0; i < 6; i++) {
        for (let j = 10 ** i; j < 10 ** (i + 1); j += 10 ** i) {
          amounts.push(getTokenAmountWei(j));
        }
      }

      amounts.push(getTokenAmountWei(999990));
      amounts.push(getTokenAmountWei(999991));
      amounts.push(getTokenAmountWei(999992));
      amounts.push(getTokenAmountWei(999993));
      amounts.push(getTokenAmountWei(999994));
      amounts.push(getTokenAmountWei(999995));
      amounts.push(getTokenAmountWei(999996));
      amounts.push(getTokenAmountWei(999997));
      amounts.push(getTokenAmountWei(999998));
      amounts.push(getTokenAmountWei(999999));

      let data = [];
      for (let i = 0; i < amounts.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.ethProxy;

        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = amounts[i];

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        let needEth = await info.marketKol.buy.staticCall(params.tid, buyAmount, {
          value: BigInt(10) ** BigInt(18) * BigInt("10000000000"),
        });

        let nftOwner1Eth1 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth1 = await ethers.provider.getBalance(nftOwner2.address);

        await info.marketKol.connect(user1).buy(params.tid, buyAmount, { value: needEth });

        let nftOwner1Eth2 = await ethers.provider.getBalance(nftOwner1.address);
        let nftOwner2Eth2 = await ethers.provider.getBalance(nftOwner2.address);

        let nftOwner1AddEth = nftOwner1Eth2 - nftOwner1Eth1;
        let nftOwner2AddEth = nftOwner2Eth2 - nftOwner2Eth1;

        // xxx
        let eth = new Decimal(needEth.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        // 10**45 / ((10**24 - x)**2)
        let a = BigInt(10) ** BigInt(45);
        let b = (BigInt(10) ** BigInt(24) - buyAmount) ** BigInt(2);
        let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

        let mcapWei = await info.kolCurve.curveMath(0, buyAmount);
        let mcap = new Decimal(mcapWei.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        let pst = new Decimal(buyAmount.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        let p = new Decimal(pst.toString()).times(new Decimal("100")).dividedBy(new Decimal("1000000")).toFixed(1);

        let feeWei = nftOwner1AddEth + nftOwner2AddEth;
        let fee = new Decimal(feeWei.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        data.push({
          eth: eth,
          price: price,
          mcap: mcap,
          pst: pst,
          pp: p,
          fee: fee,
        });
      }
      console.log(data);
    });
  });
});
