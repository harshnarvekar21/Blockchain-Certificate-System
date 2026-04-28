const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying BlockCert contract...");

  const BlockCert = await hre.ethers.getContractFactory("BlockCert");
  const blockCert = await BlockCert.deploy();

  await blockCert.waitForDeployment();

  const address = await blockCert.getAddress();
  console.log(`BlockCert deployed to: ${address}`);

  // Save the contract's artifact and address to the frontend directory
  saveFrontendFiles(address);
}

function saveFrontendFiles(contractAddress) {
  const contractsDir = path.join(__dirname, "..", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ BlockCert: contractAddress }, undefined, 2)
  );

  const BlockCertArtifact = artifacts.readArtifactSync("BlockCert");

  fs.writeFileSync(
    path.join(contractsDir, "BlockCert.json"),
    JSON.stringify(BlockCertArtifact, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
