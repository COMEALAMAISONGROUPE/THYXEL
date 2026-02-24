import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ThyxelToken ($THYX) - The Living Token...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const ThyxelToken = await ethers.getContractFactory("ThyxelToken");
  const thyxel = await ThyxelToken.deploy();
  await thyxel.waitForDeployment();

  const address = await thyxel.getAddress();
  console.log("ThyxelToken deployed to:", address);
  console.log("\n--- Initial Genome State ---");

  const genome = await thyxel.getCurrentGenome();
  console.log("Burn Rate:", Number(genome[0]) / 100, "%");
  console.log("Redist Rate:", Number(genome[1]) / 100, "%");
  console.log("Max Wallet:", Number(genome[2]) / 100, "%");
  console.log("Next Mutation:", new Date(Number(genome[6]) * 1000).toISOString());

  console.log("\nThe organism is alive. You are the cell.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
