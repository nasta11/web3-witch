import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.2/+esm";

const gallery = document.getElementById("gallery");
const status = document.getElementById("status");

let provider;
let signer;
let userAddress = null;

// Список карт — можешь заменить на свои изображения
const cards = [
  { name: "The Initiate", img: "images/initiate.jpg" },
  { name: "The Guardian", img: "images/guardian.jpg" },
  { name: "The Fracture", img: "images/fracture.jpg" },
  { name: "The Gate", img: "images/gate.jpg" },
  { name: "The Merge", img: "images/merge.jpg" }
];

// Рисуем галерею
cards.forEach((card, index) => {
  const div = document.createElement("div");
  div.classList.add("card");
  div.innerHTML = `
    <img src="${card.img}" alt="${card.name}">
    <h3>${card.name}</h3>
    <button class="mint-btn" data-index="${index}">Mint</button>
  `;
  gallery.appendChild(div);
});

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    status.textContent = "🦊 Установите MetaMask!";
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    status.textContent = `✅ Подключено: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  } catch (err) {
    console.error(err);
    status.textContent = "Ошибка подключения MetaMask";
  }
}

async function mintCard(index) {
  if (!userAddress) {
    await connectWallet();
  }

  const card = cards[index];
  status.textContent = `🔮 Минтим карту "${card.name}"...`;

  // временная имитация — позже добавим вызов контракта
  setTimeout(() => {
    status.textContent = `✅ Карта "${card.name}" успешно заминчена!`;
  }, 2000);
}

gallery.addEventListener("click", async (event) => {
  if (event.target.classList.contains("mint-btn")) {
    const index = event.target.dataset.index;
    await mintCard(index);
  }
});

connectWallet();

