// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

import "../../KolCurve.sol";

contract TestKolCurve {
  KolCurve private k;

  constructor() {
    k = new KolCurve();
  }

  function checkCurveMath1(
    uint256 sum,
    uint256 first1,
    uint256 first2,
    uint8 count1,
    uint8 count2,
    uint64 step1,
    uint64 step2
  ) external view {
    require(10 ** 18 * 1000000 - 1 >= sum);
    require(first1 < sum);
    require(first2 < sum);
    require(count1 > 0);
    require(count2 > 0);

    uint256 ret = k.curveMath(0, sum);
    uint256 ret1 = curveMathSplit(sum, first1, count1, step1);
    uint256 ret2 = curveMathSplit(sum, first2, count2, step2);

    assert(ret == ret1);
    assert(ret == ret2);
  }

  function curveMathSplit(uint256 sum, uint256 first, uint8 count, uint64 step) private view returns (uint256) {
    uint256 ret = 0;
    uint256 currentBase = 0;
    for (uint256 i = 0; i < count; i++) {
      uint256 add = first + step * i;

      if (i == count - 1 || currentBase + add > sum) {
        add = sum - currentBase;
      }

      ret += k.curveMath(currentBase, add);
      currentBase = currentBase + add;

      if (currentBase == sum) {
        break;
      }
    }

    return ret;
  }
}
