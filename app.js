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

/* ---------- INLINE FALLBACK (works with file:// or offline) ---------- */
const CARDS_INLINE = [
  { name: "The Moonlight",  textEn: "Insight is clarity.",               filename: "the_moonlight.jpg"  },
  { name: "The Connection", textEn: "You’re never alone.",               filename: "the_connection.jpg" },
  { name: "The Gate",       textEn: "Beyond lies truth.",                filename: "the_gate.jpg"       },
  { name: "The Crown",      textEn: "Lead with intention.",              filename: "the_crown.jpg"      },
  { name: "The Mirror",     textEn: "Reflect and rise.",                 filename: "the_mirror.jpg"     },
  { name: "The Hacker",     textEn: "Rules were meant to bend.",         filename: "the_hacker.jpg"     },
  { name: "The Flame",      textEn: "Act. The flame asks no permission.",filename: "the_flame.jpg"      },
  { name: "Pure Code",      textEn: "Pure code. No bugs, just purpose.", filename: "pure_code.jpg"      },
  { name: "The Pulse",      textEn: "Sync with the signal.",             filename: "the_pulse.jpg"      },
  { name: "The Weaver",     textEn: "Everything is connected.",          filename: "the_weaver.jpg"     },
  { name: "The Virus",      textEn: "Not all updates are good.",         filename: "the_virus.jpg"      },
  { name: "The Initiate",   textEn: "Every journey starts small.",       filename: "the_initiate.jpg"   },
  { name: "The Machine",    textEn: "The machine learns. So should you.",filename: "the_machine.jpg"    },
  { name: "The Fracture",   textEn: "Cracks let the light in.",          filename: "the_fracture.jpg"   },
  { name: "The Child",      textEn: "Wonder is power.",                  filename: "the_child.jpg"      },
  { name: "The Empress",    textEn: "Create with grace and chaos.",      filename: "the_empress.jpg"    },
  { name: "The Guardian",   textEn: "Protect and evolve.",               filename: "the_guardian.jpg"   },
  { name: "The Void",       textEn: "Stare into the void; it stares back.", filename: "the_void.jpg"   },
  { name: "The Shadow",     textEn: "Darkness walks with you.",          filename: "the_shadow.jpg"     },
  { name: "The Oracle",     textEn: "Trust your pattern recognition.",   filename: "the_oracle.jpg"     },
  { name: "The Dreamer",    textEn: "Code the impossible.",              filename: "the_dreamer.jpg"    }
];

/* ---------- Terminal ---------- */
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
function ok(txt)   { println(`${color('✔', 83)} ${txt}`); }
function warn(txt) { println(`${color('!', 214)} ${txt}`); }
function err(txt)  { println(`${color('✖', 203)} ${txt}`); }

/* ---------- Data loading (absolute URL + fallbacks) ---------- */
async function tryFetch(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function loadCards() {
  // 1) абсолютная ссылка на прод-домен
  const ts = Date.now(); // сбиваем кэш
  const absolute = `https://witchweb3.com/cards/cards.json?ts=${ts}`;

  // 2) относительные пути на случай запуска с домена/локального сервера
  const relatives = [
    `/cards/cards.json?ts=${ts}`,
    `./cards/cards.json?ts=${ts}`
  ];

  // если file:// — сразу inline
  if (location.protocol === 'file:') {
    CARDS = CARDS_INLINE;
    ok(`Loaded ${CARDS.length} inline cards (file:// mode).`);
    return;
  }

  // пробуем абсолютный
  try {
    const data = await tryFetch(absolute);
    if (Array.isArray(data) && data.length) {
      CARDS = data;
      ok(`Loaded ${CARDS.length} cards from witchweb3.com.`);
      return;
    }
  } catch (_) {
    warn('Absolute fetch failed, trying relative paths…');
  }

  // пробуем относительные
  for (const url of relatives) {
    try {
      const data = await tryFetch(url);
      if (Array.isArray(data) && data.length) {
        CARDS = data;
        ok(`Loaded ${CARDS.length} cards from ${url.replace(/\?.*$/,'')}.`);
        return;
      }
    } catch (_) { /* next */ }
  }

  // последний шанс — inline
  CARDS = CARDS_INLINE;
  ok(`Loaded ${CARDS.length} inline cards (fallback).`);
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
  void el.offsetWidth;
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

/* ---------- Commands ---------- */
const history = [];

function cmd_help() {
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

/* ---------- Terminal input handling ---------- */
const CMDS = { help: cmd_help, draw: drawRandom, d: drawRandom, next: drawRandom, show: showCard, list: cmd_list, history: cmd_history, share: cmd_share, clear: cmd_clear };

term.onKey(({ key, domEvent }) => {
  const { key: k, code } = domEvent;
  if (k === 'Enter') {
    term.write('\r\n');
    const [cmd, ...rest] = inputBuffer.trim().split(/\s+/);
    const arg = rest.join(' ').trim();
    inputBuffer = '';
    const fn = CMDS[(cmd || '').toLowerCase()];
    if (fn) fn(arg); else if (cmd) { err(`Unknown command: ${cmd}`); println(`Try ${color('help',141)}.`); }
    prompt();
  } else if (k === 'Backspace') {
    if (inputBuffer.length > 0) { term.write('\b \b'); inputBuffer = inputBuffer.slice(0, -1); }
  } else if (code === 'KeyC' && domEvent.ctrlKey) {
    term.write('^C\r\n'); inputBuffer = ''; prompt();
  } else if (k.length === 1) {
    inputBuffer += key; term.write(key);
  }
});

/* ---------- Init ---------- */
(async function init() {
  println(color('Web3 Witch Terminal ready.', 141));
  println(`Type ${color('help',141)} to see available commands.`);
  println();
  await loadCards();
  prompt();
})();
