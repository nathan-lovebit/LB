// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is Ownable {
    IERC20 public token;

    struct LockInfo {
        uint256 amount;
        uint256 releaseTime;
    }

    mapping(address => LockInfo) public locks;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function lockTokens(address _beneficiary, uint256 _amount, uint256 _lockupPeriod) public onlyOwner {
        _validateAddress(_beneficiary);
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        locks[_beneficiary] = LockInfo(_amount, block.timestamp + _lockupPeriod);
    }

    function releaseTokens() public {
        _release(msg.sender);
    }

    function releaseTokensForBeneficiary(address _beneficiary) public onlyOwner {
        _release(_beneficiary);
    }

    function _release(address _beneficiary) internal {
        LockInfo storage lockInfo = locks[_beneficiary];
        require(block.timestamp >= lockInfo.releaseTime, "Tokens are locked");
        uint256 amount = lockInfo.amount;
        lockInfo.amount = 0;
        lockInfo.releaseTime = 0;
        require(token.transfer(_beneficiary, amount), "Token transfer to beneficiary failed");
    }

    function getLockInfo(address _beneficiary) public view returns (LockInfo memory) {
        return locks[_beneficiary];
    }

    function _validateAddress(address _addr) internal pure {
        require(_addr != address(0), "Address cannot be zero");
    }
}