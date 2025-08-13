/* ===== Setup ===== */
let term;
let CARDS = [];
let currentIndex = -1;

const els = {
  termEl: document.getElementById('terminal'),
  card:   document.getElementById('cardContainer'),
  img:    document.getElementById('cardImage'),
  name:   document.getElementById('cardName'),
  text:   document.getElementById('cardText'),
  thumbs: document.getElementById('thumbs'),
};

/* ===== Terminal ===== */
function initTerminal() {
  // global Terminal from xterm.js
  term = new Terminal({
    convertEol: true,
    fontSize: 14,
    theme: {
      background: '#0b0014',
      foreground: '#e8d7ff',
      cursor: '#a020f0',
      selection: '#5f15a8',
      black: '#0b0014',
      brightBlack: '#2b1242'
    }
  });
  term.open(els.termEl);
  println('Web3 Witch Terminal ready.');
  println('Type "help" to see available commands.');
  prompt();

  let buffer = '';
  term.onData(ch => {
    const code = ch.charCodeAt(0);
    if (code === 13) { // Enter
      const line = buffer.trim();
      buffer = '';
      term.write('\r\n');
      handleCommand(line);
      prompt();
    } else if (code === 127) { // Backspace
      if (buffer.length > 0) {
        buffer = buffer.slice(0, -1);
        term.write('\b \b');
      }
    } else if (code === 3) { // Ctrl+C
      term.write('^C');
      buffer = '';
      prompt();
    } else {
      buffer += ch;
      term.write(ch);
    }
  });
}

function println(t=''){ term.writeln(t); }
function prompt(){ term.write('\x1b[38;5;141mwitch@web3\x1b[0m:\x1b[38;5;69m~\x1b[0m$ '); }
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
      if(Array.isArray(data) && data.length){
        CARDS = data;
        ok(`Loaded ${CARDS.length} cards.`);
        return;
      }
    }catch(_){ /* try next */ }
  }
  warn('Could not load cards.json. Try reloading the page.');
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
    t.addEventListener('click', ()=> cmd_show(String(i+1)));
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
  els.img.alt = `${card.name} card`;
  els.name.textContent = `✨ ${card.name} ✨`;
  els.name.classList.remove('muted');
  els.text.textContent = card.textEn; // EN-only text
  els.text.classList.remove('muted');
  els.card.classList.remove('fade-in'); void els.card.offsetWidth; els.card.classList.add('fade-in');
  setActiveThumb(idx);
}

/* ===== Commands ===== */
function handleCommand(line){
  const [cmd, ...rest] = line.split(/\s+/);
  const arg = rest.join(' ').trim();

  switch((cmd||'').toLowerCase()){
    case 'help':
      println(color('Available commands:',69));
      println(`  ${color('help',141)}         Show this help`);
      println(`  ${color('list',141)}         Show all cards (blurred thumbnails)`);
      println(`  ${color('draw',141)}         Draw a random card`);
      println(`  ${color('show',141)} [n|name] Show card by number or name (partial ok)`);
      println(`  ${color('clear',141)}        Clear terminal`);
      break;

    case 'list': cmd_list(); break;
    case 'draw': cmd_draw(); break;
    case 'show': cmd_show(arg); break;
    case 'clear': term.clear(); break;

    case '': break;
    default:
      warn(`Unknown command: ${cmd}`); println(`Try ${color('help',141)}.`);
  }
}

function printListWithArrow(){
  CARDS.forEach((c,i)=>{
    const marker = (i===currentIndex) ? color('→',69) : ' ';
    println(`${marker} ${String(i+1).padStart(2,' ')}. ${c.name}`);
  });
}

function cmd_list(){
  if(!CARDS.length){ warn('Cards are not loaded yet.'); return; }
  printListWithArrow();
  buildThumbnails();
}

function cmd_draw(){
  if(!CARDS.length){ warn('Cards are not loaded yet.'); return; }
  let i;
  if(CARDS.length===1) i=0;
  else { do { i=Math.floor(Math.random()*CARDS.length); } while(i===currentIndex); }
  renderCard(CARDS[i], i);
  println(`${color('Card:',141)} ${CARDS[i].name}`);
  println(` ${color('→',69)} ${CARDS[i].textEn}`);
  println('');
}

function findByArg(arg){
  if(!arg) return -1;
  const n = Number(arg);
  if(Number.isInteger(n) && n>=1 && n<=CARDS.length) return n-1;
  const needle = arg.toLowerCase();
  let idx = CARDS.findIndex(c=>c.name.toLowerCase()===needle);
  if(idx>=0) return idx;
  idx = CARDS.findIndex(c=>c.name.toLowerCase().includes(needle));
  return idx;
}

function cmd_show(arg){
  if(!CARDS.length){ warn('Cards are not loaded yet.'); return; }
  const idx = findByArg(arg);
  if(idx<0){ warn(`Card not found: ${arg}`); return; }
  renderCard(CARDS[idx], idx);
  println(`${color('Card:',141)} ${CARDS[idx].name}`);
  println(` ${color('→',69)} ${CARDS[idx].textEn}`);
  println('');
}

/* ===== Init ===== */
(async function init(){
  await loadCards();
  // на всякий случай ждём Terminal
  if (typeof window.Terminal === 'function') {
    initTerminal();
  } else {
    const w = setInterval(() => {
      if (typeof window.Terminal === 'function') { clearInterval(w); initTerminal(); }
    }, 50);
    setTimeout(() => clearInterval(w), 10000);
  }
})();
