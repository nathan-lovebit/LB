// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiBeneficiaryVestingWallet is Context, Ownable {
    using SafeERC20 for IERC20;

    struct Beneficiary {
        uint64 start;
        uint64 duration;
        uint64 period;
        uint256 releaseAmount;
        uint256 released;
        Status status;
    }

    enum Status {
        BeforeSetStartTime,
        StartTimeSetted,
        VestingStarted
    }

    IERC20 private _token;
    mapping(address => Beneficiary) private _beneficiaries;

    event ERC20Released(address indexed beneficiary, uint256 amount);

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "MultiBeneficiaryVestingWallet: token is zero address");
        _token = IERC20(tokenAddress);
    }

    function addBeneficiary(
        address beneficiaryAddress,
        uint64 startTimestamp,
        uint64 durationSeconds,
        uint64 periodSeconds,
        uint256 releaseAmount
    ) public onlyOwner {
        require(beneficiaryAddress != address(0), "MultiBeneficiaryVestingWallet: beneficiary is zero address");
        _beneficiaries[beneficiaryAddress] = Beneficiary(startTimestamp, durationSeconds, periodSeconds, releaseAmount, 0, Status.BeforeSetStartTime);
    }

    function startVesting(address beneficiaryAddress) public onlyOwner {
        require(_beneficiaries[beneficiaryAddress].status == Status.BeforeSetStartTime, "MultiBeneficiaryVestingWallet: vesting already started");
        _beneficiaries[beneficiaryAddress].status = Status.VestingStarted;
    }

    function release(address beneficiaryAddress) public {
        require(_beneficiaries[beneficiaryAddress].status == Status.VestingStarted, "MultiBeneficiaryVestingWallet: vesting not started");
        uint256 releasableAmount = _calculateReleasableAmount(beneficiaryAddress);
        require(releasableAmount >= _beneficiaries[beneficiaryAddress].releaseAmount, "MultiBeneficiaryVestingWallet: not enough tokens to release");
        _beneficiaries[beneficiaryAddress].released += _beneficiaries[beneficiaryAddress].releaseAmount;
        emit ERC20Released(beneficiaryAddress, _beneficiaries[beneficiaryAddress].releaseAmount);
        _token.safeTransfer(beneficiaryAddress, _beneficiaries[beneficiaryAddress].releaseAmount);
    }

    function _calculateReleasableAmount(address beneficiaryAddress) private view returns (uint256) {
        Beneficiary storage _beneficiary = _beneficiaries[beneficiaryAddress];
        uint256 elapsedTime = block.timestamp - _beneficiary.start;

        if (elapsedTime < 0) {
            return 0;
        } else if (elapsedTime >= _beneficiary.duration) {
            uint256 remainingBalance = _token.balanceOf(address(this)) - _beneficiary.released;
            uint256 releasableAmount = remainingBalance / _beneficiary.releaseAmount * _beneficiary.releaseAmount;
            return releasableAmount;
        } else {
            uint256 totalVestedAmount = (_token.balanceOf(address(this)) * (elapsedTime - (elapsedTime % _beneficiary.period) + _beneficiary.period)) / _beneficiary.duration;
            uint256 releasableAmount = (totalVestedAmount - _beneficiary.released) / _beneficiary.releaseAmount * _beneficiary.releaseAmount;
            return releasableAmount;
        }
    }

    function getBeneficiaryDetails(address beneficiaryAddress) public view returns (uint64 start, uint64 duration, uint64 period, uint256 releaseAmount, uint256 released, Status status) {
        Beneficiary storage beneficiary = _beneficiaries[beneficiaryAddress];
        return (beneficiary.start, beneficiary.duration, beneficiary.period, beneficiary.releaseAmount, beneficiary.released, beneficiary.status);
    }

    function removeBeneficiary(address beneficiaryAddress) public onlyOwner {
      require(beneficiaryAddress != address(0), "MultiBeneficiaryVestingWallet: beneficiary is zero address");
      require(_beneficiaries[beneficiaryAddress].status != Status.VestingStarted, "MultiBeneficiaryVestingWallet: cannot remove beneficiary after vesting started");
      delete _beneficiaries[beneficiaryAddress];
  }
}