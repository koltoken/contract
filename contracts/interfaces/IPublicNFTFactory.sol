// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IPublicNFTFactory {
  event Create(uint256 appId, string name, address publicNFT);

  function foundry() external view returns (address);

  function create(uint256 appId, string memory name, address owner) external returns (address addr);
}
