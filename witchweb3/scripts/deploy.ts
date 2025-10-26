import hre from "hardhat";

async function main() {
  const { ethers } = hre;                 // берём ethers из hre (HH v3 + ESM)
  const [signer] = await ethers.getSigners();
  console.log("🚀 Deploying from:", await signer.getAddress());

  const arcanaBase = "ipfs://YOUR_ARCANA_CID/";
  const memeBase   = "ipfs://YOUR_MEME_CID/";
  const arcanaPH   = "";
  const memePH     = "ipfs://YOUR_MEME_CID/placeholder.json";
  const arcanaPrice = ethers.parseEther("0.02");
  const memePrice   = ethers.parseEther("0.01");
  const royaltyReceiver = "0xdeaB9DcF9DA55801033695C95C2bb165f0895981";
  const royaltyBps = 500;

  const Factory = await ethers.getContractFactory("WitchWeb3");
  const nft = await Factory.deploy(
    arcanaBase,
    memeBase,
    arcanaPH,
    memePH,
    arcanaPrice,
    memePrice,
    royaltyReceiver,
    royaltyBps
  );
  await nft.waitForDeployment();

  const addr = await nft.getAddress();
  console.log("✅ WitchWeb3 deployed to:", addr);
  console.log("🔗 https://sepolia.etherscan.io/address/" + addr);
}

main().catch((e) => {
  console.error("❌ Deployment failed:", e);
  process.exit(1);
});
