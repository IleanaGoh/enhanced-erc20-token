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
		const initialSupply = ethers.parseUnits("1000000", 18);

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
			expect(await token.isWhitelisted(addr1.address)).to.equal(false);

			const tx = await token.addToWhitelist(addr1.address);

			await expect(tx)
				.to.emit(token, "AddToWhitelist")
				.withArgs(addr1.address);

			expect(await token.isWhitelisted(addr1.address)).to.equal(true);
		});

		it("Allows owner to remove an address from whitelist", async function () {
			await token.addToWhitelist(addr1.address);
			expect(await token.isWhitelisted(addr1.address)).to.equal(true);

			const tx = await token.removeFromWhitelist(addr1.address);

			await expect(tx)
				.to.emit(token, "RemoveFromWhitelist")
				.withArgs(addr1.address);

			expect(await token.isWhitelisted(addr1.address)).to.equal(false);
		});

		it("Revert if non-owner tries to add to whitelist", async function () {
			await expect(
				token.connect(addr1).addToWhitelist(addr2.address)
			).to.be.reverted;
		});

		it("Revert if non-owner tries to remove from whitelist", async function () {
			await token.addToWhitelist(addr2.address);

			await expect(
				token.connect(addr1).removeFromWhitelist(addr2.address)
			).to.be.reverted;
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

		it("Revert if trying to remove non-whitelisted address", async function () {
			await expect(
				token.removeFromWhitelist(addr1.address)
			).to.be.revertedWith("Address not whitelisted");
		});
	});

	describe("Token Transfers (Whitelist-restricted)", function () {
		it("Allows owner to transfer tokens to another whitelisted address", async function () {
			await token.addToWhitelist(addr1.address);

			const ownerBalanceBefore = await token.balanceOf(owner.address);

			await token.transfer(addr1.address, 1000);

			expect(await token.balanceOf(addr1.address)).to.equal(1000);
			expect(await token.balanceOf(owner.address)).to.equal(ownerBalanceBefore - 1000n);
		});

		it("Allows a whitelisted address to transfer to another whitelisted address", async function () {
			await token.addToWhitelist(addr1.address);
			await token.addToWhitelist(addr2.address);

			await token.transfer(addr1.address, 500);
			await token.connect(addr1).transfer(addr2.address, 500);

			expect(await token.balanceOf(addr1.address)).to.equal(0);
			expect(await token.balanceOf(addr2.address)).to.equal(500);
		});

		it("Revert transfer if sender not whitelisted", async function () {
			await token.addToWhitelist(addr1.address);
			await token.addToWhitelist(addr2.address);
			await token.transfer(addr1.address, 500);
			await token.removeFromWhitelist(addr1.address);

			await expect(
				token.connect(addr1).transfer(addr2.address, 500)
			).to.be.revertedWith("Sender not whitelisted");
		});

		it("Revert transfer if recipient not whitelisted", async function () {
			await expect(
				token.transfer(addr1.address, 500)
			).to.be.revertedWith("Recipient not whitelisted");
		});
	});

	describe("Delegation Feature (Whitelist-restricted)", function () {
		it("Allows transferFrom when both addresses whitelisted", async function () {
			await token.addToWhitelist(addr1.address);
			await token.addToWhitelist(addr2.address);

			await token.transfer(addr1.address, 500);
			await token.connect(addr1).approve(owner.address, 500);
			await token.transferFrom(addr1.address, addr2.address, 500);

			expect(await token.balanceOf(addr1.address)).to.equal(0);
			expect(await token.balanceOf(addr2.address)).to.equal(500);
		});

		it("Reverts transferFrom if sender (msg.sender) not whitelisted", async function () {
			await token.addToWhitelist(addr1.address);
			await token.addToWhitelist(addr2.address);

			await token.transfer(addr1.address, 1000);
			await token.connect(addr1).approve(addr2.address, 500);
			await token.removeFromWhitelist(addr2.address);

			await expect(
				token.connect(addr2).transferFrom(addr1.address, owner.address, 500)
			).to.be.revertedWith("Caller not whitelisted");
		});

		it("Reverts transferFrom if recipient not whitelisted", async function () {
			await token.addToWhitelist(addr1.address);
			await token.transfer(addr1.address, 1000);
			await token.connect(addr1).approve(owner.address, 500);

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
		await token.permit(
			owner.address,
			spender.address,
			value,
			deadline,
			sig.v,
			sig.r,
			sig.s
		);

		expect(await token.allowance(owner.address, spender.address)).to.equal(
			value
		);
    	});
  	});
});
