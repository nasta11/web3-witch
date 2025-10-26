import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.2/+esm";

const connectButton = document.getElementById("connectButton");
const drawCardButton = document.getElementById("drawCardButton");
const status = document.getElementById("status");

let provider;
let signer;
let userAddress = null;

async function connectMetaMask() {
  if (typeof window.ethereum === "undefined") {
    status.textContent = "🦊 Установите MetaMask!";
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    const network = await provider.getNetwork();

    // Проверяем, что пользователь в сети Polygon
    if (network.chainId !== 137 && network.chainId !== 80001) {
      await switchToPolygon();
    }

    status.textContent = `✅ Подключено: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  } catch (err) {
    console.error(err);
    status.textContent = "Ошибка подключения MetaMask";
  }
}

async function switchToPolygon() {
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x89", // 137 в hex — Polygon Mainnet
          chainName: "Polygon Mainnet",
          nativeCurrency: {
            name: "MATIC",
            symbol: "MATIC",
            decimals: 18
          },
          rpcUrls: ["https://polygon-rpc.com/"],
          blockExplorerUrls: ["https://polygonscan.com/"]
        }
      ]
    });
  } catch (switchError) {
    console.error("Ошибка при переключении сети:", switchError);
  }
}

async function drawCard() {
  if (!userAddress) {
    status.textContent = "Сначала подключи MetaMask!";
    return;
  }

  status.textContent = "🔮 Подключено. Вытягиваем карту...";
  
  // здесь будет логика взаимодействия с контрактом
  // временно просто имитируем эффект
  setTimeout(() => {
    const cards = ["🌕 The Moon", "🜏 The Witch", "🪞 The Reflection", "🔥 The Spark", "💀 The Cycle"];
    const card = cards[Math.floor(Math.random() * cards.length)];
    status.textContent = `✨ Ты вытянул(а): ${card}`;
  }, 2000);
}

connectButton.addEventListener("click", connectMetaMask);
drawCardButton.addEventListener("click", drawCard);

