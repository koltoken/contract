// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "./interfaces/IPublicNFT.sol";
import "./interfaces/IMortgageNFT.sol";
import "./interfaces/IMarket.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/ICurve.sol";
import "./interfaces/IPublicNFTVault.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

contract Market is IMarket, ReentrancyGuard {
  uint256 public immutable override feeDenominator;
  uint256 public immutable override totalPercent;

  address public immutable override foundry;
  uint256 public immutable override appId;

  address public immutable override curve;
  address public immutable override payToken;
  uint256 public immutable override buySellFee;

  address public override publicNFT;
  address public override mortgageNFT;

  // tid => totalSupply
  mapping(string => uint256) private _totalSupply;

  // tid => account => amount
  mapping(string => mapping(address => uint256)) private _balanceOf;

  constructor(
    address _foundry,
    uint256 _appId,
    uint256 _feeDenominator,
    uint256 _totalPercent,
    address _curve,
    address _payToken,
    uint256 _buySellFee
  ) {
    foundry = _foundry;
    appId = _appId;

    feeDenominator = _feeDenominator;
    totalPercent = _totalPercent;

    curve = _curve;
    payToken = _payToken;
    buySellFee = _buySellFee;
  }

  function initialize(address _publicNFT, address _mortgageNFT) external override {
    require(msg.sender == foundry, "onlyFoundry");

    publicNFT = _publicNFT;
    mortgageNFT = _mortgageNFT;

    emit Initialize(_publicNFT, _mortgageNFT);
  }

  function totalSupply(string memory tid) external view override returns (uint256) {
    return _totalSupply[tid];
  }

  function balanceOf(string memory tid, address account) external view override returns (uint256) {
    return _balanceOf[tid][account];
  }

  function getBuyPayTokenAmount(
    string memory tid,
    uint256 tokenAmount
  ) public view override returns (uint256 payTokenAmount) {
    uint256 ts = _totalSupply[tid];
    return getPayTokenAmount(ts, tokenAmount);
  }

  function getSellPayTokenAmount(
    string memory tid,
    uint256 tokenAmount
  ) public view override returns (uint256 payTokenAmount) {
    uint256 ts = _totalSupply[tid];
    return getPayTokenAmount(ts - tokenAmount, tokenAmount);
  }

  function getPayTokenAmount(uint256 base, uint256 add) public view override returns (uint256 payTokenAmount) {
    return ICurve(curve).curveMath(base, add);
  }

  function buy(
    string memory tid,
    uint256 tokenAmount
  ) external payable override nonReentrant returns (uint256 payTokenAmount) {
    require(IFoundry(foundry).tokenExist(appId, tid), "TE");

    require(tokenAmount > 0, "TAE");

    uint256[] memory feeTokenIds;
    address[] memory feeTos;
    uint256[] memory feeAmounts;

    (payTokenAmount, feeTokenIds, feeTos, feeAmounts) = _buyWithoutPay(msg.sender, tid, tokenAmount);

    if (_payTokenIsERC20()) {
      _transferFromERC20PayTokenFromSender(payTokenAmount);
      _batchTransferERC20PayTokenToNFTOwners(feeTokenIds, feeTos, feeAmounts);
    } else {
      require(msg.value >= payTokenAmount, "VE");
      _batchTransferEthToNFTOwners(feeTokenIds, feeTos, feeAmounts);
      _refundETH(payTokenAmount);
    }

    emit Buy(tid, tokenAmount, payTokenAmount, msg.sender, feeTokenIds, feeTos, feeAmounts);
  }

  function sell(
    string memory tid,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 payTokenAmount) {
    require(IFoundry(foundry).tokenExist(appId, tid), "TE");

    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= _balanceOf[tid][msg.sender], "TAE");

    uint256[] memory feeTokenIds;
    address[] memory feeTos;
    uint256[] memory feeAmounts;

    (payTokenAmount, feeTokenIds, feeTos, feeAmounts) = _sellWithoutPay(msg.sender, tid, tokenAmount);

    if (_payTokenIsERC20()) {
      _transferERC20PayToken(msg.sender, payTokenAmount);
      _batchTransferERC20PayTokenToNFTOwners(feeTokenIds, feeTos, feeAmounts);
    } else {
      _transferEth(msg.sender, payTokenAmount);
      _batchTransferEthToNFTOwners(feeTokenIds, feeTos, feeAmounts);
    }

    emit Sell(tid, tokenAmount, payTokenAmount, msg.sender, feeTokenIds, feeTos, feeAmounts);
  }

  function mortgage(
    string memory tid,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 nftTokenId, uint256 payTokenAmount) {
    require(IFoundry(foundry).tokenExist(appId, tid), "TE");
    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= _balanceOf[tid][msg.sender], "TAE");

    nftTokenId = IMortgageNFT(mortgageNFT).mint(msg.sender, tid, tokenAmount);

    payTokenAmount = _mortgageAdd(nftTokenId, tid, 0, tokenAmount);
  }

  function mortgageAdd(
    uint256 nftTokenId,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 payTokenAmount) {
    require(IMortgageNFT(mortgageNFT).isApprovedOrOwner(msg.sender, nftTokenId), "AOE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= _balanceOf[tid][msg.sender], "TAE");

    IMortgageNFT(mortgageNFT).add(nftTokenId, tokenAmount);

    payTokenAmount = _mortgageAdd(nftTokenId, tid, oldAmount, tokenAmount);
  }

  function redeem(
    uint256 nftTokenId,
    uint256 tokenAmount
  ) external payable override nonReentrant returns (uint256 payTokenAmount) {
    require(IMortgageNFT(mortgageNFT).isApprovedOrOwner(msg.sender, nftTokenId), "AOE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= oldAmount, "TAE");

    payTokenAmount = getPayTokenAmount(oldAmount - tokenAmount, tokenAmount);

    IMortgageNFT(mortgageNFT).remove(nftTokenId, tokenAmount);

    _balanceOf[tid][address(this)] -= tokenAmount;
    _balanceOf[tid][msg.sender] += tokenAmount;

    if (_payTokenIsERC20()) {
      _transferFromERC20PayTokenFromSender(payTokenAmount);
    } else {
      require(msg.value >= payTokenAmount, "VE");
      _refundETH(payTokenAmount);
    }

    emit Redeem(nftTokenId, tid, tokenAmount, payTokenAmount, msg.sender);
  }

  function multiply(
    string memory tid,
    uint256 multiplyAmount
  ) external payable override nonReentrant returns (uint256 nftTokenId, uint256 payTokenAmount) {
    require(IFoundry(foundry).tokenExist(appId, tid), "TE");
    require(multiplyAmount > 0, "TAE");

    nftTokenId = IMortgageNFT(mortgageNFT).mint(msg.sender, tid, multiplyAmount);

    payTokenAmount = _multiplyAdd(nftTokenId, tid, 0, multiplyAmount);
  }

  function multiplyAdd(
    uint256 nftTokenId,
    uint256 multiplyAmount
  ) external payable override nonReentrant returns (uint256 payTokenAmount) {
    require(IMortgageNFT(mortgageNFT).isApprovedOrOwner(msg.sender, nftTokenId), "AOE");
    require(multiplyAmount > 0, "TAE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    IMortgageNFT(mortgageNFT).add(nftTokenId, multiplyAmount);

    payTokenAmount = _multiplyAdd(nftTokenId, tid, oldAmount, multiplyAmount);
  }

  function cash(
    uint256 nftTokenId,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 payTokenAmount) {
    require(IMortgageNFT(mortgageNFT).isApprovedOrOwner(msg.sender, nftTokenId), "AOE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= oldAmount, "TAE");

    IMortgageNFT(mortgageNFT).remove(nftTokenId, tokenAmount);

    (
      uint256 sellAmount,
      uint256[] memory feeTokenIds,
      address[] memory feeTos,
      uint256[] memory feeAmounts
    ) = _sellWithoutPay(address(this), tid, tokenAmount);

    uint256 redeemPayTokenAmount = getPayTokenAmount(oldAmount - tokenAmount, tokenAmount);

    require(sellAmount >= redeemPayTokenAmount, "CE");
    payTokenAmount = sellAmount - redeemPayTokenAmount;

    if (_payTokenIsERC20()) {
      if (payTokenAmount > 0) {
        _transferERC20PayToken(msg.sender, payTokenAmount);
      }
      _batchTransferERC20PayTokenToNFTOwners(feeTokenIds, feeTos, feeAmounts);
    } else {
      if (payTokenAmount > 0) {
        _transferEth(msg.sender, payTokenAmount);
      }
      _batchTransferEthToNFTOwners(feeTokenIds, feeTos, feeAmounts);
    }

    emit Cash(nftTokenId, tid, tokenAmount, payTokenAmount, msg.sender, feeTokenIds, feeTos, feeAmounts);
  }

  function merge(
    uint256 nftTokenId,
    uint256 otherNFTTokenId
  ) external override nonReentrant returns (uint256 payTokenAmount) {
    require(IMortgageNFT(mortgageNFT).isApprovedOrOwner(msg.sender, nftTokenId), "AOE1");
    require(IMortgageNFT(mortgageNFT).isApprovedOrOwner(msg.sender, otherNFTTokenId), "AOE2");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    (string memory otherTid, uint256 otherOldAmount) = IMortgageNFT(mortgageNFT).info(otherNFTTokenId);

    require(keccak256(abi.encodePacked(tid)) == keccak256(abi.encodePacked(otherTid)), "TE");

    IMortgageNFT(mortgageNFT).burn(otherNFTTokenId);
    IMortgageNFT(mortgageNFT).add(nftTokenId, otherOldAmount);

    uint256 curveAmount = getPayTokenAmount(oldAmount, otherOldAmount) - getPayTokenAmount(0, otherOldAmount);
    uint256 feeAmount = _mortgageFee(curveAmount);
    payTokenAmount = curveAmount - feeAmount;

    if (_payTokenIsERC20()) {
      _transferERC20PayToken(msg.sender, payTokenAmount);
      _transferERC20PayTokenToMortgageFeeRecipient(feeAmount);
    } else {
      _transferEth(msg.sender, payTokenAmount);
      _transferEthToMortgageFeeRecipient(feeAmount);
    }

    emit Merge(nftTokenId, tid, otherNFTTokenId, payTokenAmount, feeAmount, msg.sender);
  }

  function split(
    uint256 nftTokenId,
    uint256 splitAmount
  ) external payable override nonReentrant returns (uint256 payTokenAmount, uint256 newNFTTokenId) {
    require(IMortgageNFT(mortgageNFT).isApprovedOrOwner(msg.sender, nftTokenId), "AOE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    require(splitAmount > 0, "SAE");
    require(splitAmount < oldAmount, "SAE");

    IMortgageNFT(mortgageNFT).remove(nftTokenId, splitAmount);
    newNFTTokenId = IMortgageNFT(mortgageNFT).mint(msg.sender, tid, splitAmount);

    payTokenAmount = getPayTokenAmount(oldAmount - splitAmount, splitAmount) - getPayTokenAmount(0, splitAmount);

    if (_payTokenIsERC20()) {
      _transferFromERC20PayTokenFromSender(payTokenAmount);
    } else {
      require(msg.value >= payTokenAmount, "VE");
      _refundETH(payTokenAmount);
    }

    emit Split(nftTokenId, newNFTTokenId, tid, splitAmount, payTokenAmount, msg.sender);
  }

  function _buyWithoutPay(
    address to,
    string memory tid,
    uint256 tokenAmount
  )
    private
    returns (uint256 payTokenAmount, uint256[] memory feeTokenIds, address[] memory feeTos, uint256[] memory feeAmounts)
  {
    uint256 amount = getBuyPayTokenAmount(tid, tokenAmount);

    uint256 totalFee;
    (totalFee, feeTokenIds, feeTos, feeAmounts) = _getFee(tid, amount);
    payTokenAmount = amount + totalFee;

    _totalSupply[tid] += tokenAmount;
    _balanceOf[tid][to] += tokenAmount;
  }

  function _sellWithoutPay(
    address from,
    string memory tid,
    uint256 tokenAmount
  )
    private
    returns (uint256 payTokenAmount, uint256[] memory feeTokenIds, address[] memory feeTos, uint256[] memory feeAmounts)
  {
    uint256 amount = getSellPayTokenAmount(tid, tokenAmount);

    uint256 totalFee;
    (totalFee, feeTokenIds, feeTos, feeAmounts) = _getFee(tid, amount);
    payTokenAmount = amount - totalFee;

    _totalSupply[tid] -= tokenAmount;
    _balanceOf[tid][from] -= tokenAmount;
  }

  function _mortgageAdd(
    uint256 tokenId,
    string memory tid,
    uint256 oldAmount,
    uint256 addAmount
  ) private returns (uint256 payTokenAmount) {
    uint256 curveAmount = getPayTokenAmount(oldAmount, addAmount);
    uint256 feeAmount = _mortgageFee(curveAmount);

    _balanceOf[tid][msg.sender] -= addAmount;
    _balanceOf[tid][address(this)] += addAmount;

    payTokenAmount = curveAmount - feeAmount;

    if (_payTokenIsERC20()) {
      _transferERC20PayToken(msg.sender, payTokenAmount);
      _transferERC20PayTokenToMortgageFeeRecipient(feeAmount);
    } else {
      _transferEth(msg.sender, payTokenAmount);
      _transferEthToMortgageFeeRecipient(feeAmount);
    }

    emit Mortgage(tokenId, tid, addAmount, payTokenAmount, feeAmount, msg.sender);
  }

  function _multiplyAdd(
    uint256 nftTokenId,
    string memory tid,
    uint256 oldAmount,
    uint256 multiplyAmount
  ) private returns (uint256 payTokenAmount) {
    (
      uint256 multiplyPayTokenAmount,
      uint256[] memory feeTokenIds,
      address[] memory feeTos,
      uint256[] memory feeAmounts
    ) = _buyWithoutPay(address(this), tid, multiplyAmount);

    uint256 curveAmount = getPayTokenAmount(oldAmount, multiplyAmount);
    uint256 feeAmount = _mortgageFee(curveAmount);
    uint256 mortAmount = curveAmount - feeAmount;
    payTokenAmount = multiplyPayTokenAmount - mortAmount;

    if (_payTokenIsERC20()) {
      _transferFromERC20PayTokenFromSender(payTokenAmount);

      _transferERC20PayTokenToMortgageFeeRecipient(feeAmount);
      _batchTransferERC20PayTokenToNFTOwners(feeTokenIds, feeTos, feeAmounts);
    } else {
      require(msg.value >= payTokenAmount, "VE");

      _transferEthToMortgageFeeRecipient(feeAmount);
      _batchTransferEthToNFTOwners(feeTokenIds, feeTos, feeAmounts);
      _refundETH(payTokenAmount);
    }

    emit Multiply(
      nftTokenId,
      tid,
      multiplyAmount,
      payTokenAmount,
      feeAmount,
      msg.sender,
      feeTokenIds,
      feeTos,
      feeAmounts
    );
  }

  function _getFee(
    string memory tid,
    uint256 amount
  )
    private
    view
    returns (uint256 totalFee, uint256[] memory tokenIds, address[] memory owners, uint256[] memory feeAmounts)
  {
    uint256[] memory percents;
    (tokenIds, percents, , owners) = IPublicNFT(publicNFT).tidToInfos(tid);

    feeAmounts = new uint256[](percents.length);

    for (uint256 i = 0; i < percents.length; i++) {
      uint256 feeAmount = (amount * buySellFee * percents[i]) / totalPercent / feeDenominator;
      feeAmounts[i] = feeAmount;
      totalFee += feeAmount;
    }
  }

  function _payTokenIsERC20() private view returns (bool) {
    return payToken != address(0);
  }

  function _transferFromERC20PayTokenFromSender(uint256 value) private {
    SafeERC20.safeTransferFrom(IERC20(payToken), msg.sender, address(this), value);
  }

  function _batchTransferEthToNFTOwners(
    uint256[] memory tokenIds,
    address[] memory tos,
    uint256[] memory amounts
  ) private {
    for (uint256 i = 0; i < amounts.length; i++) {
      bool sup = ERC165Checker.supportsInterface(tos[i], type(IPublicNFTVault).interfaceId);

      if (sup) {
        _transferEthWithData(tokenIds[i], tos[i], amounts[i]);
      } else {
        _transferEth(tos[i], amounts[i]);
      }
    }
  }

  function _batchTransferERC20PayTokenToNFTOwners(
    uint256[] memory tokenIds,
    address[] memory tos,
    uint256[] memory amounts
  ) private {
    for (uint256 i = 0; i < amounts.length; i++) {
      bool sup = ERC165Checker.supportsInterface(tos[i], type(IPublicNFTVault).interfaceId);

      if (sup) {
        _transferERC20PayTokenWithData(tokenIds[i], tos[i], amounts[i]);
      } else {
        _transferERC20PayToken(tos[i], amounts[i]);
      }
    }
  }

  function _transferEthToMortgageFeeRecipient(uint256 feeAmount) private {
    _transferEth(IFoundry(foundry).mortgageFeeRecipient(appId), feeAmount);
  }

  function _transferERC20PayTokenToMortgageFeeRecipient(uint256 feeAmount) private {
    _transferERC20PayToken(IFoundry(foundry).mortgageFeeRecipient(appId), feeAmount);
  }

  function _refundETH(uint256 needPay) private {
    uint256 refund = msg.value - needPay;
    if (refund > 0) {
      _transferEth(msg.sender, refund);
    }
  }

  function _transferEth(address to, uint256 value) private {
    (bool success, ) = to.call{value: value}(new bytes(0));
    require(success, "TEE");
  }

  function _transferEthWithData(uint256 tokenId, address to, uint256 value) private {
    _transferEth(to, value);
    bool success = IPublicNFTVault(to).recordReceiveBuySellFee(tokenId, value);
    require(success, "TEWDE");
  }

  function _transferERC20PayToken(address to, uint256 value) private {
    SafeERC20.safeTransfer(IERC20(payToken), to, value);
  }

  function _transferERC20PayTokenWithData(uint256 tokenId, address to, uint256 value) private {
    _transferERC20PayToken(to, value);
    bool success = IPublicNFTVault(to).recordReceiveBuySellFee(tokenId, value);
    require(success, "TE2WDE");
  }

  function _mortgageFee(uint256 amount) private view returns (uint256) {
    return (IFoundry(foundry).mortgageFee(appId) * amount) / feeDenominator;
  }
}
