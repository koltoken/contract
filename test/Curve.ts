import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import Decimal from "decimal.js";
import { KolCurve } from "../typechain-types";

const expectCurve = async function (
  kolCurve: KolCurve,
  count: bigint,
  ethStr: string,
  priceStr: string,
  mcapStr: string,
  feeStr: string,
) {
  let ethWei = (BigInt(10) ** BigInt(18)).toString();

  let mcap = await kolCurve.curveMath(0, count);
  let fee = new Decimal(mcap.toString()).dividedBy(100);
  let eth = new Decimal(mcap.toString()).add(fee);
  // let price = await kolCurve.curveMath(count, BigInt(10) ** BigInt(18));

  // 10**45 / ((10**24 - x)**2)
  let a = BigInt(10) ** BigInt(45);
  let b = (BigInt(10) ** BigInt(24) - count) ** BigInt(2);
  let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

  // eth eq
  expect(eth.dividedBy(ethWei).toFixed(3)).eq(ethStr);
  // price eq
  expect(price).eq(priceStr);
  // mcap eq
  expect(new Decimal(mcap.toString()).dividedBy(ethWei).toFixed(3)).eq(mcapStr);
  // fee eq
  expect(fee.dividedBy(ethWei).toFixed(3)).eq(feeStr);

  let countInt = BigInt(count);
  if (countInt > BigInt(10)) {
    let part1 = countInt / BigInt(4);
    let part2 = (countInt - part1) / BigInt(3);
    let part3 = countInt - part1 - part2;
    let mcap1 = await kolCurve.curveMath(0, part1);
    let mcap2 = await kolCurve.curveMath(part1, part2);
    let mcap3 = await kolCurve.curveMath(part1 + part2, part3);

    expect(mcap1 + mcap2 + mcap3).eq(mcap);
  }
};

describe("Curve", function () {
  it("curveMath max 100W", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    const max = BigInt(10) ** BigInt(18) * BigInt(1000000); // 100 W

    expect(await info.kolCurve.curveMath(0, 1)).eq(0);
    expect(await info.kolCurve.curveMath(0, 999)).eq(0);
    expect(await info.kolCurve.curveMath(0, 1000)).eq(1);

    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18))).eq("1000001000001000"); // 0.001
    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(10))).eq("10000100001000010"); // 0.01
    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(100))).eq("100010001000100010"); // 0.1
    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(1000))).eq("1001001001001001001"); // 1.001
    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(10000))).eq("10101010101010101010"); // 10.101
    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(100000))).eq("111111111111111111111"); // 111.111
    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(500000))).eq("1000000000000000000000"); // 1000
    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(900000))).eq("9000000000000000000000"); // 9000
    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(999990))).eq("99999000000000000000000000");  // 99999000

    expect(await info.kolCurve.curveMath(0, max - BigInt(1))).eq(BigInt("999999999999999999999999000000000000000000000"));
    await expect(info.kolCurve.curveMath(0, max)).revertedWithPanic("0x12");
    await expect(info.kolCurve.curveMath(1, max - BigInt(1))).revertedWithPanic("0x12");

    expect(await info.kolCurve.curveMath(0, max - BigInt(1))).eq(
      (await info.kolCurve.curveMath(0, 1)) + (await info.kolCurve.curveMath(1, max - BigInt(2))),
    );

    expect(await info.kolCurve.curveMath(0, 10000)).eq(
      (await info.kolCurve.curveMath(0, 1000)) +
      (await info.kolCurve.curveMath(1000, 2000)) +
      (await info.kolCurve.curveMath(3000, 3000)) +
      (await info.kolCurve.curveMath(6000, 4000)),
    );
  });

  it("curveMath todo", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    expect(await info.kolCurve.curveMath(0, BigInt(10) ** BigInt(18))).eq("1000001000001000");
    expect(await info.kolCurve.curveMath(BigInt(10) ** BigInt(18), BigInt(10) ** BigInt(18))).eq("1000003000007000");
  });

  it("curve", async function () {
    const allInfo = await loadFixture(deployAllContracts);
    const info = allInfo.eth;

    let data = [
      {
        count: 1,
        eth: "0.001",
        price: "0.0010000",
        mcap: "0.001",
        fee: "0.000",
      },
      {
        count: 40,
        eth: "0.040",
        price: "0.0010001",
        mcap: "0.040",
        fee: "0.000",
      },
      {
        count: 50,
        eth: "0.051",
        price: "0.0010001",
        mcap: "0.050",
        fee: "0.001",
      },
      {
        count: 100,
        eth: "0.101",
        price: "0.0010002",
        mcap: "0.100",
        fee: "0.001",
      },
      {
        count: 200,
        eth: "0.202",
        price: "0.0010004",
        mcap: "0.200",
        fee: "0.002",
      },
      {
        count: 1000,
        eth: "1.011",
        price: "0.0010020",
        mcap: "1.001",
        fee: "0.010",
      },
      {
        count: 3000,
        eth: "3.039",
        price: "0.0010060",
        mcap: "3.009",
        fee: "0.030",
      },
      {
        count: 10000,
        eth: "10.202",
        price: "0.0010203",
        mcap: "10.101",
        fee: "0.101",
      },
      {
        count: 20000,
        eth: "20.612",
        price: "0.0010412",
        mcap: "20.408",
        fee: "0.204",
      },
      {
        count: 100000,
        eth: "112.222",
        price: "0.0012346",
        mcap: "111.111",
        fee: "1.111",
      },
      {
        count: 200000,
        eth: "252.500",
        price: "0.0015625",
        mcap: "250.000",
        fee: "2.500",
      },
      {
        count: 300000,
        eth: "432.857",
        price: "0.0020408",
        mcap: "428.571",
        fee: "4.286",
      },
      {
        count: 400000,
        eth: "673.333",
        price: "0.0027778",
        mcap: "666.667",
        fee: "6.667",
      },
      {
        count: 500000,
        eth: "1010.000",
        price: "0.0040000",
        mcap: "1000.000",
        fee: "10.000",
      },
      {
        count: 600000,
        eth: "1515.000",
        price: "0.0062500",
        mcap: "1500.000",
        fee: "15.000",
      },
      {
        count: 700000,
        eth: "2356.667",
        price: "0.0111111",
        mcap: "2333.333",
        fee: "23.333",
      },
      {
        count: 800000,
        eth: "4040.000",
        price: "0.0250000",
        mcap: "4000.000",
        fee: "40.000",
      },
      {
        count: 900000,
        eth: "9090.000",
        price: "0.1000000",
        mcap: "9000.000",
        fee: "90.000",
      },
      {
        count: 999990,
        eth: "100998990.000", //  100998989.999
        price: "10000000.0000000", // 9999999.9998356
        mcap: "99999000.000", // 99998999.999
        fee: "999990.000",
      },
      {
        count: 999997,
        eth: "336665656.667", // 336665656.668
        price: "111111111.1111111", // 111111111.1118407
        mcap: "333332333.333", // 333332333.334
        fee: "3333323.333",
      },
      {
        count: 999998,
        eth: "504998990.000", // 504998990.002
        price: "250000000.0000000", // 250000000.0016415
        mcap: "499999000.000", // 499999000.002
        fee: "4999990.000",
      },
    ];
    for (let i = 0; i < data.length; i++) {
      await expectCurve(
        info.kolCurve,
        BigInt(10) ** BigInt(18) * BigInt(data[i].count),
        data[i].eth,
        data[i].price,
        data[i].mcap,
        data[i].fee,
      );
    }
  });
});
