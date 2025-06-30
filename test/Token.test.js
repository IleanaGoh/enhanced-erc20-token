const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Contract", function () {
  let token, owner, addr1, addr2;

  beforeEach(async function () {
    const Token = await ethers.getContractFactory("Token");
    [owner, addr1, addr2] = await ethers.getSigners();
    token = await Token.deploy();
    await token.waitForDeployment();
  });

describe("Deployment", function () {

	const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 tokens with 18 decimals

	it("Should set contract owner as the account that deployed it", async function () {
		expect(await token.owner()).to.equal(owner.address);
	});

	it("Should mint initial supply to the owner", async function () {
		const ownerBalance = await token.balanceOf(owner.address);
		expect(ownerBalance).to.equal(initialSupply);
	});

	it("Should add owner to whitelist by default", async function () {
		expect(await token.isWhitelisted(owner.address)).to.equal(true);
  	});
});

describe("Whitelisting Feature", function () {
    it("Allows owner to add an address to whitelist", async function () {
        // Check that addr1 is initially not whitelisted
        expect(await token.isWhitelisted(addr1.address)).to.equal(false);

        // Owner add addr1 to whitelist
        const tx = await token.addToWhitelist(addr1.address);

        // Check that the AddToWhitelist event is emitted with correct address
        await expect(tx)
        .to.emit(token, "AddToWhitelist")
        .withArgs(addr1.address);

        // Check that addr1 is now whitelisted
        expect(await token.isWhitelisted(addr1.address)).to.equal(true);
    }),

    it("Allows owner to remove an address from whitelist", async function () {
        // Add addr1 to the whitelist
        await token.addToWhitelist(addr1.address);
        expect(await token.isWhitelisted(addr1.address)).to.equal(true);

        // Remove addr1 from whitelist
        const tx = await token.removeFromWhitelist(addr1.address);

        // Check that the RemoveFromWhitelist event is emitted with correct address
        await expect(tx)
            .to.emit(token, "RemoveFromWhitelist")
            .withArgs(addr1.address);

        // Check that addr1 is no longer in whitelist
        expect(await token.isWhitelisted(addr1.address)).to.equal(false);
    });

	it("Revert if non-owner tries to add to whitelist", async function () {
		await expect(
			token.connect(addr1).addToWhitelist(addr2.address)
		).to.be.reverted;;
	});

	it("Revert if non-owner tries to remove from whitelist", async function () {
		// Add addr2 to whitelist as owner
		await token.addToWhitelist(addr2.address);

		// Try removing addr2 as addr1 (not owner)
		await expect(
			token.connect(addr1).removeFromWhitelist(addr2.address)
		).to.be.reverted;;
	});

	it("Revert if trying to whitelist zero address", async function () {
		await expect(
			token.addToWhitelist(ethers.ZeroAddress)
		).to.be.revertedWith("Cannot whitelist zero address");
	});

	it("Revert if trying to whitelist an already-whitelisted address", async function () {
		await token.addToWhitelist(addr1.address);
		await expect(
			token.addToWhitelist(addr1.address)
		).to.be.revertedWith("Address already whitelisted");
	});

	it("Revert if trying to remove owner from whitelist", async function () {
		await expect(
			token.removeFromWhitelist(owner.address)
		).to.be.revertedWith("Cannot remove owner from whitelist");
	});

	it("Revert if trying to non-whitelisted address from whitelist", async function () {
		await expect(
			token.removeFromWhitelist(addr1.address)
		).to.be.revertedWith("Address not whitelisted");
	});
});

describe("Token Transfers (Whitelist-restricted)", function () {
    it("Allows owner to transfer tokens to another whitelisted address", async function () {
        // Whitelist addr1
        await token.addToWhitelist(addr1.address);

		// Initial owner balance
		const ownerBalanceBefore = await token.balanceOf(owner.address);

		// Transfer tokens from owner to addr1
        await token.transfer(addr1.address, 1000);

		// Check balance for addr1 
        expect(await token.balanceOf(addr1.address)).to.equal(1000);

		// Check owner balance 
		expect(await token.balanceOf(owner.address)).to.equal(ownerBalanceBefore - 1000n);
    });

	it("Allows a whitelisted address to transfer tokens to another whitelisted address", async function () {
        // Whitelist addr1
        await token.addToWhitelist(addr1.address);

		// Whitelist addr2
        await token.addToWhitelist(addr2.address);

		// Transfer tokens from owner to addr1
        await token.transfer(addr1.address, 500);

		// Transfer tokens from addr1 to addr2
		await token.connect(addr1).transfer(addr2.address, 500);

		// Check balance for addr1 
        expect(await token.balanceOf(addr1.address)).to.equal(0);

		// Check balance for addr2 
		expect(await token.balanceOf(addr2.address)).to.equal(500);
    });

	it("Revert transfer if sender not whitelisted", async function () {
		// temporarily whitelist addr1 so owner can transfer tokens to it
		await token.addToWhitelist(addr1.address);

		// Whitelist addr2 only
		await token.addToWhitelist(addr2.address);

		// Transfer tokens from owner to addr1 
		await token.transfer(addr1.address, 500);

		// remove addr1 from whitelist
		await token.removeFromWhitelist(addr1.address);

		// addr1 tries to send to addr2, but addr1 nt whitelisted
		await expect(
			token.connect(addr1).transfer(addr2.address, 500)
		).to.be.revertedWith("Sender not whitelisted");
	});

	it("Revert transfer if recipient not whitelisted", async function () {
		// owner tries to send to addr1, but addr1 nt whitelisted
		await expect(
			token.transfer(addr1.address, 500)
		).to.be.revertedWith("Recipient not whitelisted");
	});
});


describe("Delegation Feature (Whitelist-restricted)", function () {
    it("Allows transferFrom when both addresses whitelisted", async function () {
        // Whitelist addr1 and addr2
        await token.addToWhitelist(addr1.address);
        await token.addToWhitelist(addr2.address);

        // Transfer tokens from owner to addr1
        await token.transfer(addr1.address, 500);

        // Approve owner to spend 500 tokens on behalf of addr1
        await token.connect(addr1).approve(owner.address, 500);

        // transferFrom by owner from addr1 to addr2
        await token.transferFrom(addr1.address, addr2.address, 500);

        // Verify balances
        expect(await token.balanceOf(addr1.address)).to.equal(0);
        expect(await token.balanceOf(addr2.address)).to.equal(500);
	});

	it("Reverts transferFrom if sender (msg.sender) not whitelisted", async function () {
		// Whitelist addr1 
		await token.addToWhitelist(addr1.address);

		// Temporarily whitelist addr2 
		await token.addToWhitelist(addr2.address);

		// Transfer tokens to addr1
		await token.transfer(addr1.address, 1000);

		// addr1 approves addr2 to spend 500 tokens on its behalf
		await token.connect(addr1).approve(addr2.address, 500);

		// Remove addr2 from whitelist
		await token.removeFromWhitelist(addr2.address);

		// addr2 call transferFrom
		await expect(
			token.connect(addr2).transferFrom(addr1.address, owner.address, 500)
		).to.be.revertedWith("Caller not whitelisted");

	});
	
	it("Reverts transferFrom if recipient not whitelisted", async function () {
		// Whitelist addr1 
		await token.addToWhitelist(addr1.address);

		// Transfer tokens to addr1
		await token.transfer(addr1.address, 1000);

		// addr1 approves owner to spend 500 tokens on its behalf
		await token.connect(addr1).approve(owner.address, 500);

		// addr2 call transferFrom
		await expect(
			token.transferFrom(owner.address, addr2.address, 500)
		).to.be.revertedWith("Recipient not whitelisted");
	});
});

describe("EIP-2612 Permit Functionality", function () {

	it("Should allow permit-based approval (EIP-2612)", async function () {
		const [owner, spender] = await ethers.getSigners();

		const deadline = Math.floor(Date.now() / 1000) + 3600;
		const value = 1000n;

		const nonce = Number(await token.nonces(owner.address));
		const name = await token.name();
		const version = "1";
		const chainId = Number((await ethers.provider.getNetwork()).chainId);
		const verifyingContract = await token.getAddress();

		const domain = {
			name,
			version,
			chainId,
			verifyingContract,
		};

		const types = {
			Permit: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "deadline", type: "uint256" },
			],
		};

		const message = {
			owner: owner.address,
			spender: spender.address,
			value: value,
			nonce,
			deadline,
		};

		const signature = await owner.signTypedData(domain, types, message);

		const sig = ethers.Signature.from(signature);
		await token.permit(owner.address, spender.address, value, deadline, sig.v, sig.r, sig.s);

		expect(await token.allowance(owner.address, spender.address)).to.equal(value);
	});

});

});