# Enhanced ERC20 Token Contract

An ERC20-compliant token deployed to the Sepolia testnet, enhanced with whitelist functionality, delegation (allowance) and EIP-2612 permit support.

---

## 1. Install Dependencies

```bash
npm install
```

## 2. Create and configure .env file
Copy contents of `.env.example` and create a `.env` file
Open .env and replace the placeholder values:
- For SEPOLIA_RPC_URL: go to infuria.io (MetaMask Developer) and copy your API key 
- For private key: go to MetaMask wallet (Account Details > Details > Show private key)

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

- Unit Tests: Comprehensive coverage including:

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
    - Test validates that a spender can be approved through `permit()` without calling `approve()`, and the resulting allowance is correctly updated.


## 4. Deployment/ Testing 
To deploy to Sepolia Testnet:
```bash
npm hardhat run scripts/deploy.js --network sepolia
```

To run unit tests:
```bash 
npx hardhat test
```

## 5. Deployed contract address
- [TODO: Add deployed contract address]

## 6. Testnet used
- [TODO: Add Testnet]




