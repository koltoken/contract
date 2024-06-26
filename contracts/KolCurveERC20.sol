// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "./interfaces/ICurve.sol";

contract KolCurveERC20 is ICurve {
  uint256 public constant X21 = 1000000000000000000000;
  uint256 public constant X24 = 1000000000000000000000000;

  function curveMath(uint256 base, uint256 add) external pure returns (uint256) {
    return _curveMath(base + add) - _curveMath(base);
  }

  function _curveMath(uint256 v) private pure returns (uint256) {
    return (X21 * v) / (X24 - v);
  }
}
