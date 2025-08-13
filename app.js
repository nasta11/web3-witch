// EN-only rendering (data still holds RU for future)
const LANG = 'en';

const els = {
  termEl: document.getElementById('terminal'),
  card:   document.getElementById('cardContainer'),
  img:    document.getElementById('cardImage'),
  name:   document.getElementById('cardName'),
  text:   document.getElementById('cardText'),
};

let CARDS = [];
let lastIndex = -1;

// ---------- Terminal ----------
/* global Terminal */
const term = new Terminal({
  convertEol: true,
  fontSize: 14,
  theme: {
    background: '#0b0014',
    foreground: '#e8d7ff',
    cursor: '#a020f0',
    selection: '#5f15a8',
    black:   '#0b0014',
    red:     '#ff8fab',
    green:   '#7CFC00',
    yellow:  '#FFD166',
    blue:    '#7aa2ff',
    magenta: '#a020f0',
    cyan:    '#4DD0E1',
    white:   '#e8d7ff',
    brightBlack: '#2b1242'
  }
});
term.open(els.termEl);

const PROMPT = '\x1b[38;5;141mwitch@web3\x1b[0m:\x1b[38;5;69m~\x1b[0m$ ';
let inputBuffer = '';

function println(s = '') { term.writeln(s); }
function prompt() { term.write(PROMPT); }

function color(txt, c = 141) { return `\x1b[38;5;${c}m${txt}\x1b[0m`; }
function ok(txt)    { println(`${color('✔', 83)} ${txt}`); }
function warn(txt)  { println(`${color('!', 214)} ${txt}`); }
function err(txt)   { println(`${color('✖', 203)} ${txt}`); }

// ---------- Data ----------
async function loadCards() {
  try {
    const res = await fetch('./cards.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('cards.json is empty or malformed');
    }
    CARDS = data;
    ok(`Loaded ${CARDS.length} cards.`);
  } catch (e) {
    err('Could not load cards.json. Run via a local server or GitHub Pages.');
    println(color(String(e), 203));
  }
}

function randIndex() {
  if (CARDS.length <= 1) return 0;
  let i;
  do { i = Math.floor(Math.random() * CARDS.length); } while (i === lastIndex);
  lastIndex = i;
  return i;
}

function applyFadeIn(el) {
  el.classList.remove('fade-in');
  void el.offsetWidth; // reflow
  el.classList.add('fade-in');
}

function renderCard(card) {
  els.img.src = `./cards/${card.filename}`;
  els.img.alt = `${card.name} card`;
  els.name.textContent = `✨ ${card.name} ✨`;
  els.name.classList.remove('muted');
  els.text.textContent = card.textEn; // EN only
  els.text.classList.remove('muted');
  applyFadeIn(els.card);
}

// ---------- Commands ----------
const history = [];

async function cmd_help() {
  println(color('Available commands:', 69));
  println(`  ${color('help',141)}         Show this help`);
  println(`  ${color('draw',141)} / ${color('d',141)}   Draw a random card`);
  println(`  ${color('next',141)}         Draw another random card`);
  println(`  ${color('show',141)} [n|name] Show card by index (1-based) or name`);
  println(`  ${color('list',141)}         List all cards`);
  println(`  ${color('history',141)}      Show last 5 drawn cards`);
  println(`  ${color('share',141)}        Share page URL (or copy to clipboard)`);
  println(`  ${color('clear',141)}        Clear terminal`);
}

function cmd_list() {
  CARDS.forEach((c, i) => println(`${String(i+1).padStart(2,' ')}. ${c.name}`));
}

function logDraw(card) {
  history.push({ name: card.name, ts: new Date() });
  if (history.length > 20) history.shift();
}

function cmd_history() {
  if (!history.length) { warn('No history yet. Use "draw".'); return; }
  const recent = history.slice(-5).reverse();
  recent.forEach(h => println(`- ${h.name}  ${color(h.ts.toLocaleString(), 69)}`));
}

function findByArg(arg) {
  if (!arg) return null;
  const n = Number(arg);
  if (Number.isInteger(n) && n >= 1 && n <= CARDS.length) return CARDS[n-1];
  const name = arg.toLowerCase();
  return CARDS.find(c => c.name.toLowerCase() === name) ||
         CARDS.find(c => c.name.toLowerCase().includes(name));
}

async function cmd_share() {
  const title = els.name.textContent || 'Web3 Witch';
  const text  = els.text.textContent || 'Draw your destiny';
  const url   = window.location.href;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); ok('Shared via system dialog.'); }
    catch(_) { warn('Share canceled.'); }
  } else {
    try { await navigator.clipboard.writeText(url); ok('Link copied to clipboard.'); }
    catch { warn('Copy failed. Use the address bar to copy URL.'); }
  }
}

function cmd_clear() { term.clear(); }

function drawRandom() {
  if (!CARDS.length) { err('Cards are not loaded yet. Try again.'); return; }
  const card = CARDS[randIndex()];
  renderCard(card);
  println(`${color('Card:', 141)} ${card.name}`);
  println(` ${color('→', 69)} ${card.textEn}`);
  println();
  logDraw(card);
}

function showCard(arg) {
  const card = findByArg(arg);
  if (!card) { err(`Card not found: ${arg}`); return; }
  renderCard(card);
  println(`${color('Card:', 141)} ${card.name}`);
  println(` ${color('→', 69)} ${card.textEn}`);
  println();
  logDraw(card);
}

async function handleCommand(line) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  const arg = rest.join(' ').trim();

  switch ((cmd || '').toLowerCase()) {
    case 'help':     return cmd_help();
    case 'draw':
    case 'd':        return drawRandom();
    case 'next':     return drawRandom();
    case 'show':     return showCard(arg);
    case 'list':     return cmd_list();
    case 'history':  return cmd_history();
    case 'share':    return cmd_share();
    case 'clear':    return cmd_clear();
    case '':         return;
    default:
      err(`Unknown command: ${cmd}`);
      println(`Try ${color('help',141)}.`);
  }
}

// ---------- Terminal input handling ----------
term.onKey(({ key, domEvent }) => {
  const { key: k, code } = domEvent;

  if (k === 'Enter') {
    term.write('\r\n');
    const line = inputBuffer;
    inputBuffer = '';
    handleCommand(line);
    prompt();
  } else if (k === 'Backspace') {
    if (inputBuffer.length > 0) {
      term.write('\b \b');
      inputBuffer = inputBuffer.slice(0, -1);
    }
  } else if (code === 'KeyC' && domEvent.ctrlKey) {
    term.write('^C\r\n');
    inputBuffer = '';
    prompt();
  } else if (k.length === 1) {
    inputBuffer += key;
    term.write(key);
  }
});

// ---------- Init ----------
(async function init() {
  println(color('Web3 Witch Terminal ready.', 141));
  println(`Type ${color('help',141)} to see available commands.`);
  println();
  await loadCards();
  prompt();
})();

