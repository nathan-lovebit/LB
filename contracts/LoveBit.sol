// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoveBit is ERC20, ERC20Burnable, Ownable {
    
    mapping(address => bool) public blackList;

    constructor(address contractOwner)
        ERC20("Love Bit", "LB") {
        transferOwnership(contractOwner);
        _mint(contractOwner, 420000000000000 * 10 ** decimals());
    }

    function addToBlackList(address addr) public onlyOwner {
        blackList[addr] = true;
    }

    function removeFromBlackList(address addr) public onlyOwner {
        blackList[addr] = false;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        super._beforeTokenTransfer(from, to, amount);

        require(!blackList[from] && !blackList[to], "Blacklisted address");
    }
}
