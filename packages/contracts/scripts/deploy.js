import hre from "hardhat";

async function main() {
  console.log("Deploying ZKPVerifier contract...");

  const ZKPVerifier = await hre.ethers.getContractFactory("ZKPVerifier");
  const zkpVerifier = await ZKPVerifier.deploy();

  await zkpVerifier.waitForDeployment();

  const address = await zkpVerifier.getAddress();
  console.log(`ZKPVerifier deployed to: ${address}`);

  // Save deployment info
  const deploymentInfo = {
    contract: "ZKPVerifier",
    address: address,
    network: hre.network.name,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };

  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
