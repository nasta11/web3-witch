import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/dist/ethers.min.js";

// адрес твоего контракта
const CONTRACT_ADDRESS = "0x20Eb33D5c56161D7C7ebFF1FcDedd252A69670B4";
const ABI = [
  "function mintFromDeck(uint256 deckId, uint256 amount) payable"
];

const connectBtn = document.querySelector("#connectBtn");
const mintBtn    = document.querySelector("#mintBtn");
const statusEl   = document.querySelector("#status");

// ✅ Проверяем, есть ли MetaMask
if (!window.ethereum) {
  statusEl.textContent = "❌ MetaMask не найден. Открой страницу в Chrome с установленным MetaMask.";
  connectBtn.disabled = true;
  mintBtn.disabled = true;
  throw new Error("MetaMask not found");
}

let provider, signer, contract, account;

async function ensureSepolia() {
  const CHAIN_ID = "0xaa36a7"; // 11155111
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current !== CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CHAIN_ID,
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://sepolia.infura.io/v3/9a7ee3a37e884254881693906c1252ed"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"]
          }]
        });
      } else { throw err; }
    }
  }
}

async function connect() {
  try {
    await ensureSepolia();

    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    account = accounts[0];
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    connectBtn.textContent = `Подключено: ${account.slice(0,6)}…${account.slice(-4)}`;
    statusEl.textContent = "✅ MetaMask подключен.";
  } catch (e) {
    statusEl.textContent = "Ошибка подключения: " + (e.message || e);
    console.error(e);
  }
}

async function mint(deckId = 1) {
  try {
    if (!contract) await connect();
    const price = deckId === 1 ? "0.02" : "0.01"; // Arcana / Meme
    const tx = await contract.mintFromDeck(deckId, 1, { value: ethers.parseEther(price) });
    statusEl.textContent = "📤 Отправлена транзакция: " + tx.hash;
    await tx.wait();
    statusEl.textContent = "✅ Успешно! Tx: " + tx.hash;
  } catch (e) {
    console.error(e);
    statusEl.textContent = "❌ Ошибка: " + (e.shortMessage || e.message || e);
  }
}

connectBtn.addEventListener("click", connect);
mintBtn.addEventListener("click", () => mint(1));

