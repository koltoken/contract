import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { getTokenAmountWei } from "./shared/utils";

describe("Market", function () {
  describe("buyAndSell.erc20", function () {
    let data = [
      {
        expectNeedPayToken: BigInt("1010001010001009"), // 0.00101
        buyAmount: 1,
      },
      {
        expectNeedPayToken: BigInt("10100101001010010"), // 0.0101
        buyAmount: 10,
      },
      {
        expectNeedPayToken: BigInt("101010101010101010"), // 0.101
        buyAmount: 100,
      },
      {
        expectNeedPayToken: BigInt("1011011011011011010"), // 1.0110
        buyAmount: 1000,
      },
      {
        expectNeedPayToken: BigInt("10202020202020202019"), // 10.2020
        buyAmount: 10000,
      },
      {
        expectNeedPayToken: BigInt("112222222222222222221"), // 112.2222
        buyAmount: 100000,
      },
      {
        expectNeedPayToken: BigInt("252500000000000000000"), // 252.5
        buyAmount: 200000,
      },
      {
        expectNeedPayToken: BigInt("432857142857142857141"), // 432.85714285714283
        buyAmount: 300000,
      },
      {
        expectNeedPayToken: BigInt("673333333333333333332"), // 673.3333333333334
        buyAmount: 400000,
      },
      {
        expectNeedPayToken: BigInt("1010000000000000000000"), // 1010.0
        buyAmount: 500000,
      },
      {
        expectNeedPayToken: BigInt("1515000000000000000000"), // 1515.0
        buyAmount: 600000,
      },
      {
        expectNeedPayToken: BigInt("2356666666666666666665"), // 2356.6666666666665
        buyAmount: 700000,
      },
      {
        expectNeedPayToken: BigInt("4040000000000000000000"), // 4040.0
        buyAmount: 800000,
      },
      {
        expectNeedPayToken: BigInt("9090000000000000000000"), // 9090.0
        buyAmount: 900000,
      },
      {
        expectNeedPayToken: BigInt("100998990000000000000000000"), // 100998989.999
        buyAmount: 999990,
      },
      {
        expectNeedPayToken: BigInt("112221212222222222222222221"), // 112221212.222
        buyAmount: 999991,
      },
      {
        expectNeedPayToken: BigInt("504998990000000000000000000"), // 504998989.999
        buyAmount: 999998,
      },
    ];

    it("buy revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

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
        info.marketKol.buy("t2222", getTokenAmountWei(1000)),
      ).revertedWith("TE");
      // approve < need
      await info.simpleToken.approve(await info.marketKol.getAddress(), 1)
      await expect(
        info.marketKol.buy(params.tid, getTokenAmountWei(1000)),
      ).revertedWith("ERC20: insufficient allowance");
      // buy amount > 1000W
      await info.simpleToken.approve(await info.marketKol.getAddress(), BigInt(10) ** BigInt(18) * BigInt("10000000000"))
      await expect(
        info.marketKol.buy(params.tid, getTokenAmountWei(10000000))
      ).revertedWithPanic("0x11");
      // buy 0
      await expect(info.marketKol.buy(params.tid, 0)).revertedWith("TAE");
    });

    it("sell revert", async function () {
      const allInfo = await loadFixture(deployAllContracts);
      const info = allInfo.erc20Proxy;

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
      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user1).approve(await info.marketKol.getAddress(), BigInt(10) ** BigInt(21))
      await info.simpleToken.connect(user2).approve(await info.marketKol.getAddress(), BigInt(10) ** BigInt(21))
      await info.marketKol
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(1000));
      // user2 buy t1 and t2 1000
      await info.marketKol
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(1000));
      await info.marketKol
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(1000));

      // user not have, test: user1 sell t2 1
      await expect(info.marketKol.connect(user1).sell(paramsT2.tid, getTokenAmountWei(1))).revertedWith("TAE");

      // user not enough, test: user1 sell t1 1001
      await expect(info.marketKol.connect(user1).sell(paramsT1.tid, getTokenAmountWei(1001))).revertedWith("TAE");

      // totalSupply not enough, test: user3 sell t1 1001
      await expect(info.marketKol.connect(user3).sell(paramsT1.tid, getTokenAmountWei(1001))).revertedWith("TAE");

      // sell 0
      await expect(info.marketKol.connect(user1).sell(paramsT1.tid, 0)).revertedWith("TAE");
    });

    it("buy refund result and sell result", async function () {
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

      let buyAmount = getTokenAmountWei(1000);

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt("10000000000"));
      await info.simpleToken.connect(user1).approve(await info.marketKol.getAddress(), BigInt(10) ** BigInt(18) * BigInt("10000000000"))
      let needPayToken = await info.marketKol.connect(user1).buy.staticCall(params.tid, buyAmount);

      let user1PayToken1 = await info.simpleToken.balanceOf(user1.address)

      await info.marketKol.connect(user1).buy(params.tid, buyAmount);

      let user1PayToken2 = await info.simpleToken.balanceOf(user1.address)

      expect(user1PayToken2).eq(user1PayToken1 - needPayToken);

      let userGetPayToken = await info.marketKol.connect(user1).sell.staticCall(params.tid, buyAmount);
      await info.marketKol.connect(user1).sell(params.tid, buyAmount);

      let user1PayToken3 = await info.simpleToken.balanceOf(user1.address)

      expect(user1PayToken3).eq(user1PayToken2 + userGetPayToken);
    });

    it("buy one", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.erc20Proxy;

        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = BigInt(10) ** BigInt(18) * BigInt(data[i].buyAmount);
        let expectNeedPayToken = data[i].expectNeedPayToken;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt("10000000000"))
        await info.simpleToken.connect(user1).approve(await info.marketKol.getAddress(), BigInt(10) ** BigInt(18) * BigInt("10000000000"))
        let needPayToken = await info.marketKol.connect(user1).buy.staticCall(params.tid, buyAmount);

        let user1PayToken1 = await info.simpleToken.balanceOf(user1.address)
        let marketKolPayToken1 = await info.simpleToken.balanceOf(await info.marketKol.getAddress())
        let nftOwner1PayToken1 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayToken1 = await info.simpleToken.balanceOf(nftOwner2.address)

        await info.marketKol.connect(user1).buy(params.tid, buyAmount);

        let curvePayToken = await info.marketKol.getPayTokenAmount(0, buyAmount);

        let user1PayToken2 = await info.simpleToken.balanceOf(user1.address)
        let marketKolPayToken2 = await info.simpleToken.balanceOf(await info.marketKol.getAddress())
        let nftOwner1PayToken2 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayToken2 = await info.simpleToken.balanceOf(nftOwner2.address)

        let nftOwner1AddPayToken = nftOwner1PayToken2 - nftOwner1PayToken1;
        let nftOwner2AddPayToken = nftOwner2PayToken2 - nftOwner2PayToken1;

        expect(needPayToken).eq(expectNeedPayToken);

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(user1PayToken2).eq(user1PayToken1 - needPayToken);
        expect(marketKolPayToken2 - marketKolPayToken1).eq(curvePayToken);
        expect(curvePayToken + nftOwner1AddPayToken + nftOwner2AddPayToken).eq(needPayToken);

        expect(nftOwner2AddPayToken / nftOwner1AddPayToken).eq(19);
        expect(curvePayToken / (nftOwner1AddPayToken + nftOwner2AddPayToken)).eq(100);
      }
    });

    it("buy one and sell one", async function () {
      for (let i = 0; i < data.length; i++) {
        const allInfo = await loadFixture(deployAllContracts);
        const info = allInfo.erc20Proxy;

        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = getTokenAmountWei(data[i].buyAmount);
        let expectNeedPayToken = data[i].expectNeedPayToken;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt("10000000000"))
        await info.simpleToken.connect(user1).approve(await info.marketKol.getAddress(), BigInt(10) ** BigInt(18) * BigInt("10000000000"))
        let needPayToken = await info.marketKol.connect(user1).buy.staticCall(params.tid, buyAmount);

        let user1PayToken1 = await info.simpleToken.balanceOf(user1.address)
        let marketKolPayToken1 = await info.simpleToken.balanceOf(await info.marketKol.getAddress())
        let nftOwner1PayToken1 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayToken1 = await info.simpleToken.balanceOf(nftOwner2.address)

        await info.marketKol.connect(user1).buy(params.tid, buyAmount);

        let curvePayToken = await info.marketKol.getPayTokenAmount(0, buyAmount);

        let user1PayToken2 = await info.simpleToken.balanceOf(user1.address)
        let marketKolPayToken2 = await info.simpleToken.balanceOf(await info.marketKol.getAddress())
        let nftOwner1PayToken2 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayToken2 = await info.simpleToken.balanceOf(nftOwner2.address)

        let nftOwner1AddPayToken = nftOwner1PayToken2 - nftOwner1PayToken1;
        let nftOwner2AddPayToken = nftOwner2PayToken2 - nftOwner2PayToken1;

        expect(needPayToken).eq(expectNeedPayToken);

        expect(await info.marketKol.totalSupply(params.tid)).eq(buyAmount);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(buyAmount);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(user1PayToken2).eq(user1PayToken1 - needPayToken);
        expect(marketKolPayToken2 - marketKolPayToken1).eq(curvePayToken);
        expect(curvePayToken + nftOwner1AddPayToken + nftOwner2AddPayToken).eq(needPayToken);

        expect(nftOwner2AddPayToken / nftOwner1AddPayToken).eq(19);
        expect(curvePayToken / (nftOwner1AddPayToken + nftOwner2AddPayToken)).eq(100);

        // sell
        await info.marketKol.connect(user1).sell(params.tid, buyAmount);

        let user1PayTokenSell1 = await info.simpleToken.balanceOf(user1.address)
        let marketKolPayTokenSell1 = await info.simpleToken.balanceOf(await info.marketKol.getAddress())
        let nftOwner1PayTokenSell1 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayTokenSell1 = await info.simpleToken.balanceOf(nftOwner2.address)

        let nftOwner1AddPayToken2 = nftOwner1PayTokenSell1 - nftOwner1PayToken2;
        let nftOwner2AddPayToken2 = nftOwner2PayTokenSell1 - nftOwner2PayToken2;
        let user1PayTokenSellAdd = user1PayTokenSell1 - user1PayToken2;

        expect(await info.marketKol.totalSupply(params.tid)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, await info.marketKol.getAddress())).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.marketKol.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(nftOwner2AddPayToken2 / nftOwner1AddPayToken2).eq(19);
        expect(user1PayTokenSellAdd / (nftOwner1AddPayToken2 + nftOwner2AddPayToken2)).eq(99);
        expect(marketKolPayTokenSell1).eq(0);
        expect(marketKolPayToken2).eq(user1PayTokenSellAdd + nftOwner1AddPayToken2 + nftOwner2AddPayToken2);
      }
    });
  });
});
