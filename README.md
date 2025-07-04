# Enhanced ERC20 Token Contract

An ERC20-compliant token deployed to the Sepolia testnet, enhanced with whitelist functionality, delegation (allowance), EIP-2612 permit support and re-entrancy protection.

---

## 1. Install Dependencies

```bash
npm install
```

## 2. Create and configure .env file
Copy contents of `.env.example` and create a `.env` file
Open .env and replace the placeholder values:
- **SEPOLIA_RPC_URL**: go to [infura.io](https://www.infura.io/) (MetaMask Developer) and copy your API key 
- **PRIVATE_KEY**: Setup a Web3 Wallet (If you already have a wallet, just paste the private key, otherwise, get private key from MetaMask):
  - Download [MetaMask Chrome Extension](https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) 
  - Go to **Account Details > Details > Export Private Key**

## 3. Description of Implemented Features

- ERC20 Token: Compliant with OpenZeppelin's ERC20 standards.
- Whitelist Functionality:
  - Only the contract owner can add and remove addresses from the whitelist.
  - `transfer` and `transferFrom` functions are restricted to whitelisted senders and recipients.
- Delegation (Allowance) Functionality:
  - Implements the standard ERC20 `approve` / `transferFrom` flow to allow a spender to transfer tokens on behalf of an owner.
  - Built on top of the whitelist feature; delegated transfers (`transferFrom`) are only allowed if the caller, sender, and recipient are all whitelisted.
  - `approve(address spender, uint256 amount)` is inherited from OpenZeppelin's ERC20 implementation.
  - Enhanced with support for `permit()` (EIP-2612), which enables gasless approvals through the use of signed messages.
- Re-entrancy Protection Functionality:
  - Implements a `withdraw` method using OpenZeppelin's ReentrancyGuard to prevent re-entrancy attacks during ETH transfers.  

- Unit Tests:

  - Deployment:
    - Verify contract owner is correctly set.
    - Initial supply (1,000,000 tokens) minted to owner.
    - Owner automatically added to whitelist.

  - Whitelist Management:
    - Owner can add and remove addresses from whitelist.
    - Emits appropriate events (`AddToWhitelist`, `RemoveFromWhitelist`).
    - Prevents zero address, duplicates, and removal of owner.
    - Reverts if non-owner attempts to modify whitelist.

  - Token Transfers:
    - Allows transfers only between whitelisted addresses.
    - Reverts if sender or recipient is not whitelisted.

  - Delegated Transfers (`transferFrom`):
    - Permits `transferFrom` when caller, sender, and recipient are whitelisted.
    - Reverts if caller or recipient is not whitelisted.

  - EIP-2612 Permit Functionality:
    - Allows off-chain approvals using signed messages via the `permit` function.
    - Verifies that a spender can be approved through `permit()` without calling `approve()`, and the resulting allowance is correctly updated.

  - Re-entrancy Protection (`withdraw`):
    - Ensures `withdraw` function resets balances for user's address
    - Reverts if there are no funds available for withdrawal. 
    - Emits appropriate events (`Withdrawn`).

## 4. Deployment/ Testing 
To deploy to Sepolia Testnet:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

To run unit tests:
```bash 
npx hardhat test
```

## 5. Deployed contract address & Testnet used
- Deployed contract address: [0xa0F2B0469417a6bd6FdE733c967d945eb75e01ed](https://sepolia.etherscan.io/address/0xa0F2B0469417a6bd6FdE733c967d945eb75e01ed)
- Deployed to **Sepolia Testnet**. 

## 6. References 
- [Basic Explanation of How Whitelisting Works in Solidity](https://dev.to/muratcanyuksel/basic-explanation-of-how-whitelisting-works-in-solidity-f19) – Article by Murat Can Yuksel on DEV Community
- [OpenZeppelin Reentrancy Guard: A Quickstart Guide](https://medium.com/@mayankchhipa007/openzeppelin-reentrancy-guard-a-quickstart-guide-7f5e41ee388f) – Article by Mayank Chhipa on Medium



