const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying DailyCard...");

  const DailyCard = await hre.ethers.getContractFactory("DailyCard");
  const dc = await DailyCard.deploy();

  // ethers v6
  if (typeof dc.waitForDeployment === "function") {
    await dc.waitForDeployment();
    const addr = await dc.getAddress();
    console.log(`✅ Contract deployed to: ${addr}`);
    return;
  }

  // ethers v5
  if (typeof dc.deployed === "function") {
    await dc.deployed();
    console.log(`✅ Contract deployed to: ${dc.address}`);
    return;
  }

  console.log("ℹ️ Contract deployed, но метод ожидания не найден.");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});

