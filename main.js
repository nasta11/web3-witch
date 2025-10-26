import "./style.css";

const translations = {
  en: {
    title: "🌙 Welcome to WitchWeb3",
    subtitle: "Where magic meets Web3",
    button: "Draw a Card 🔮",
    cards: [
      "The Initiate 🌒",
      "The Guardian 🜂",
      "The Fracture 🜄",
      "The Gate 🜃",
      "The Oracle 🜁"
    ]
  },
  ru: {
    title: "🌙 Добро пожаловать в WitchWeb3",
    subtitle: "Место, где магия встречается с Web3",
    button: "Вытянуть карту 🔮",
    cards: [
      "Посвящённая 🌒",
      "Хранитель 🜂",
      "Разлом 🜄",
      "Врата 🜃",
      "Оракул 🜁"
    ]
  }
};

let currentLang = "en";

function updateLanguage(lang) {
  currentLang = lang;
  document.querySelector("#title").textContent = translations[lang].title;
  document.querySelector("#subtitle").textContent = translations[lang].subtitle;
  document.querySelector("#drawCard").textContent = translations[lang].button;
}

document.querySelector("#lang-en").addEventListener("click", () => updateLanguage("en"));
document.querySelector("#lang-ru").addEventListener("click", () => updateLanguage("ru"));

document.querySelector("#drawCard").addEventListener("click", () => {
  const cards = translations[currentLang].cards;
  const random = cards[Math.floor(Math.random() * cards.length)];
  const card = document.querySelector("#cardResult");
  card.classList.remove("show");
  card.textContent = `✨ ${random}`;
  setTimeout(() => card.classList.add("show"), 100);
});

