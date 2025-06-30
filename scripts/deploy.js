const hre = require("hardhat");

async function main() {
    const TokenFactory = await hre.ethers.getContractFactory("Token");
  
    // deploy() returns a Contract instance immediately in ethers v6
    const token = await TokenFactory.deploy();

    // wait until the deployment transaction is mined
    await token.waitForDeployment();

    console.log("Token deployed to:", await token.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
