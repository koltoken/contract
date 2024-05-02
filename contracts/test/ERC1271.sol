// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ERC1271 is IERC1271 {
  struct TokenInfo {
    string tid;
    string tTwitterName;
    string cid;
    string cTwitterName;
    uint256 followers;
    uint256 omf;
  }

  // bytes4(keccak256("isValidSignature(bytes32,bytes)")
  bytes4 internal constant MAGICVALUE = 0x1626ba7e;

  // hash => signature
  mapping(bytes32 => bytes) public validSignature;

  function addClaimSignature(string memory tid, address nftOwner, bytes memory signature) external {
    bytes32 raw = keccak256(abi.encode(tid, nftOwner));

    validSignature[ECDSA.toEthSignedMessageHash(raw)] = signature;
  }

  function addCreateTokenSignature(
    TokenInfo memory info,
    uint256 nftPrice,
    uint256 deadline,
    address sender,
    bytes memory signature
  ) external {
    bytes32 raw = keccak256(abi.encode(info, nftPrice, deadline, sender));
    validSignature[ECDSA.toEthSignedMessageHash(raw)] = signature;
  }

  function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue) {
    bytes memory s = validSignature[hash];
    if (keccak256(s) == keccak256(signature)) {
      return MAGICVALUE;
    } else {
      return 0xffffffff;
    }
  }
}
