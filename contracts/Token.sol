// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract Token is ERC20, ERC20Permit, Ownable {
    mapping(address => bool) public whitelist;

    // Events for whitelist actions
    event AddToWhitelist(address indexed account);
    event RemoveFromWhitelist(address indexed account);

    constructor() ERC20("Token", "TKN") ERC20Permit("Token") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Mint initial supply to owner
        whitelist[msg.sender] = true; // adds owner to whitelist by default
        emit AddToWhitelist(msg.sender); 
    }

    // only owner can add to whitelist
    function addToWhitelist(address account) external onlyOwner {
        require(account != address(0), "Cannot whitelist zero address");
        require(!whitelist[account], "Address already whitelisted");
        whitelist[account] = true;
        emit AddToWhitelist(account);
    }

    // only owner can remove from whitelist
    function removeFromWhitelist(address account) external onlyOwner {
        require(account != owner(), "Cannot remove owner from whitelist");
        require(whitelist[account], "Address not whitelisted");
        whitelist[account] = false;
        emit RemoveFromWhitelist(account);
    }

    function isWhitelisted(address account) external view returns (bool) {
        return whitelist[account];
    }

    // Override transfer to restrict to whitelist
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(whitelist[msg.sender], "Sender not whitelisted");
        require(whitelist[to], "Recipient not whitelisted");
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(whitelist[msg.sender], "Caller not whitelisted");
        require(whitelist[from], "From address not whitelisted");
        require(whitelist[to], "Recipient not whitelisted");
        return super.transferFrom(from, to, amount);
    }

    // approve(address spender, uint256 amount) function inherited from OpenZeppelin ERC20
    // Used to allow delegated transfers by spender via transferFrom    
}