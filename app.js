/* ===== Setup ===== */
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm";

let term;
let CARDS = [];
let currentIndex = -1;
let provider, signer, contract;

const els = {
  termEl: document.getElementById('terminal'),
  card: document.getElementById('cardContainer'),
  img: document.getElementById('cardImage'),
  name: document.getElementById('cardName'),
  text: document.getElementById('cardText'),
  thumbs: document.getElementById('thumbs'),
  btnDraw: document.getElementById('btnDraw'),
  btnList: document.getElementById('btnList'),
  simpleControls: document.getElementById('simpleControls'),
};

const CONTRACT_ADDRESS = "0x20Eb33D5c56161D7C7ebFF1FcDedd252A69670B4";
const ABI = []; // сюда вставь ABI позже

/* ===== Utils ===== */
function println(t=''){ if (term) term.writeln(t); }
function write(t=''){ if (term) term.write(t); }
function prompt(){ write('\x1b[38;5;141mwitch@web3\x1b[0m:\x1b[38;5;69m~\x1b[0m$ '); }
function color(txt,c=141){ return `\x1b[38;5;${c}m${txt}\x1b[0m`; }
function warn(txt){ println(`${color('✖',203)} ${txt}`); }
function ok(txt){ println(`${color('✔',83)} ${txt}`); }

/* ===== Data loading ===== */
async function tryFetch(url){
  const res = await fetch(url,{ cache:'no-store' });
  if(!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function loadCards(){
  const ts = Date.now();
  const candidates = [
    `https://witchweb3.com/cards/cards.json?ts=${ts}`,
    `/cards/cards.json?ts=${ts}`,
    `./cards/cards.json?ts=${ts}`
  ];
  for(const url of candidates){
    try{
      const data = await tryFetch(url);
      if(Array.isArray(data) && data.length){ CARDS = data; return; }
    }catch(_){}
  }
  throw new Error('Cannot load cards.json');
}

/* ===== MetaMask ===== */
async function connectWallet(){
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
  ok("Wallet connected.");
}

/* ===== Thumbnails ===== */
function buildThumbnails(){
  if(!els.thumbs) return;
  els.thumbs.innerHTML = '';
  CARDS.forEach((c,i)=>{
    const t = document.createElement('img');
    t.src = `./cards/${c.filename}`;
    t.alt = c.name;
    t.className = 'blurred';
    t.dataset.index = String(i);
    t.addEventListener('click', ()=> showByIndex(i));
    els.thumbs.appendChild(t);
  });
  if(currentIndex >= 0) setActiveThumb(currentIndex);
}

function setActiveThumb(idx){
  if(!els.thumbs) return;
  els.thumbs.querySelectorAll('img').forEach(img => img.classList.add('blurred'));
  const active = els.thumbs.querySelector(`img[data-index="${idx}"]`);
  if(active) active.classList.remove('blurred');
}

/* ===== Render ===== */
function renderCard(card, idx){
  currentIndex = idx;
  els.img.src = `./cards/${card.filename}`;
  els.name.textContent = `✨ ${card.name} ✨`;
  els.text.textContent = card.textEn;
  els.card.classList.add('fade-in');
  setActiveThumb(idx);
}

/* ===== Core ===== */
function drawRandom(){
  if(!CARDS.length){ warn('Cards are not loaded yet.'); return; }
  let i;
  if(CARDS.length===1) i=0;
  else { do { i=Math.floor(Math.random()*CARDS.length); } while(i===currentIndex); }
  renderCard(CARDS[i], i);
  println(`${color('Card:',141)} ${CARDS[i].name}`);
  println(` ${color('→',69)} ${CARDS[i].textEn}`);
}

function listCards(){
  CARDS.forEach((c,i)=>{
    const marker = (i===currentIndex) ? color('→',69) : ' ';
    println(`${marker} ${String(i+1).padStart(2,' ')}. ${c.name}`);
  });
  buildThumbnails();
}

/* ===== Terminal ===== */
function initTerminal(){
  if (typeof window.Terminal !== 'function') { enableSimpleMode(); return; }
  term = new Terminal({
    convertEol:true,
    fontSize:14,
    theme: { background:'#0b0014', foreground:'#e8d7ff', cursor:'#a020f0' }
  });
  term.open(els.termEl);
  println('Web3 Witch Terminal ready.');
  println('Type "help" to see available commands.');
  prompt();
}

/* ===== Simple mode ===== */
function enableSimpleMode(){
  document.body.classList.add('simple-mode');
  els.simpleControls?.classList.add('show');
  if (els.btnDraw) els.btnDraw.onclick = () => drawRandom();
  if (els.btnList) els.btnList.onclick = () => listCards();
}

/* ===== Init ===== */
window.addEventListener("DOMContentLoaded", async ()=>{
  try { await loadCards(); } 
  catch(e){ warn('Failed to load cards.json'); }
  await connectWallet();
  if (typeof window.Terminal === 'function') initTerminal();
  else enableSimpleMode();
});

