import { readFile } from "fs/promises";
import { ethers } from "ethers";
import "dotenv/config";

async function main() {
  // Провайдер и кошелёк из .env
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("🚀 Deploying from:", wallet.address);

  // Загружаем артефакт контракта (ABI + bytecode), созданный hardhat compile
  const artifact = JSON.parse(
    await readFile("./artifacts/contracts/WitchWeb3.sol/WitchWeb3.json", "utf8")
  );

  // ⚙️ Параметры конструктора — замени на свои значения при необходимости
  const arcanaBase = "ipfs://YOUR_ARCANA_CID/";              // 1.json..21.json
  const memeBase   = "ipfs://YOUR_MEME_CID/";                // 1.json..21.json
  const arcanaPH   = "";                                     // "" => сразу revealed
  const memePH     = "ipfs://YOUR_MEME_CID/placeholder.json";
  const arcanaPrice = 20_000_000_000_000_000n;               // 0.02 ETH (wei)
  const memePrice   = 10_000_000_000_000_000n;               // 0.01 ETH (wei)
  const royaltyReceiver = "0xdeaB9DcF9DA55801033695C95C2bb165f0895981";
  const royaltyBps = 500; // 5%

  // Создаём фабрику и деплоим
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(
    arcanaBase,
    memeBase,
    arcanaPH,
    memePH,
    arcanaPrice,
    memePrice,
    royaltyReceiver,
    royaltyBps
  );

  console.log("⛽ Deployment tx:", contract.deploymentTransaction().hash);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("✅ WitchWeb3 deployed to:", addr);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${addr}`);
}

main().catch((e) => (console.error("❌ Deployment failed:", e), process.exit(1)));
