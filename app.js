import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm";

const CONTRACT_ADDRESS = "0x20Eb33D5c56161D7C7ebFF1FcDedd252A69670B4";
const ABI = [
  // вставь сюда содержимое из witchweb3_ABI.txt (всё, что внутри [ ... ])
];

let provider, signer, contract;

// 🔗 Подключение MetaMask
async function connectWallet() {
  if (!window.ethereum) {
    alert("Установи MetaMask, чтобы подключиться!");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  const network = await provider.getNetwork();
  if (network.name !== "sepolia") {
    alert("Пожалуйста, переключись на сеть Sepolia в MetaMask.");
    return;
  }

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  const address = await signer.getAddress();
  alert(`✅ Кошелёк подключён: ${address}`);
}

// 🎴 Минт карты (из колоды 0)
async function mintCard(deckId = 0) {
  if (!contract) {
    alert("Сначала подключи MetaMask!");
    return;
  }

  try {
    const tx = await contract.mint(deckId, { value: ethers.parseEther("0.001") });
    alert(`Минт запущен!\nTx: ${tx.hash}`);
    await tx.wait();
    alert("🎉 Минт успешно завершён!");
  } catch (err) {
    console.error(err);
    alert("Ошибка при минте: " + (err.reason || err.message));
  }
}

// 🖱 Привязка кнопок
window.addEventListener("DOMContentLoaded", () => {
  const connectButton = document.getElementById("connectButton");
  const mintButton = document.getElementById("mintButton");

  if (connectButton) connectButton.addEventListener("click", connectWallet);
  if (mintButton) mintButton.addEventListener("click", () => mintCard(0));
});

