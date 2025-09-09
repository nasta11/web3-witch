/* Minimal mint helper for MultiDeck1155 — English */
(function(){
  const CONFIG = {
    // TODO: put your deployed contract address here:
    CONTRACT_ADDRESS: "0x0000000000000000000000000000000000000000",
    // Polygon Amoy testnet
    CHAIN_ID: 80002,
    RPC_URL: "https://rpc-amoy.polygon.technology",
    CHAIN_NAME: "Polygon Amoy",
    EXPLORER: "https://amoy.polygonscan.com"
  };

  const ABI = [
    "function mint(address to,uint256 deckId,uint256 cardId,uint256 amount) external",
    "function buildTokenId(uint256 deckId,uint256 cardId) view returns (uint256)"
  ];

  function ok(){ return !!(window.ethereum && window.ethers); }

  async function ensureNetwork(){
    const wanted = "0x" + CONFIG.CHAIN_ID.toString(16);
    const cur = await window.ethereum.request({ method: "eth_chainId" });
    if (cur !== wanted) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: wanted }]
        });
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: wanted,
              chainName: CONFIG.CHAIN_NAME,
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              rpcUrls: [CONFIG.RPC_URL],
              blockExplorerUrls: [CONFIG.EXPLORER]
            }]
          });
        } else { throw e; }
      }
    }
  }

  async function connectWallet(){
    if (!ok()) throw new Error("window.ethereum or ethers is missing");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await ensureNetwork();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    return { provider, signer, addr };
  }

  async function mintWithEthers(deckId, cardId, amount=1){
    if (!ok()) throw new Error("Connect MetaMask and reload the page");
    if (!CONFIG.CONTRACT_ADDRESS || CONFIG.CONTRACT_ADDRESS.startsWith("0x00"))
      throw new Error("CONTRACT_ADDRESS is not set. Update js/mint.js");
    const { signer, addr } = await connectWallet();
    const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, ABI, signer);
    const tx = await contract.mint(addr, Number(deckId), Number(cardId), Number(amount));
    const receipt = await tx.wait();
    return { hash: tx.hash, receipt };
  }

  window.mintConfig = CONFIG;
  window.connectWallet = connectWallet;
  window.mintWithEthers = mintWithEthers;
})();
