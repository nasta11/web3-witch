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
  btnDraw: document.getElementById('btnDraw'),
  btnList: document.getElementById('btnList'),
  simpleControls: document.getElementById('simpleControls'),
};

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
    }catch(_){/* try next */}
  }
  throw new Error('Cannot load cards.json');
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
  els.img.alt = `${card.name} card`;
  els.name.textContent = `✨ ${card.name} ✨`;
  els.name.classList.remove('muted');
  els.text.textContent = card.textEn; // EN-only
  els.text.classList.remove('muted');
  els.card.classList.remove('fade-in'); void els.card.offsetWidth; els.card.classList.add('fade-in');
  setActiveThumb(idx);
}

/* ===== Core actions ===== */
function drawRandom(){
  if(!CARDS.length){ warn('Cards are not loaded yet.'); return; }
  let i;
  if(CARDS.length===1) i=0;
  else { do { i=Math.floor(Math.random()*CARDS.length); } while(i===currentIndex); }
  renderCard(CARDS[i], i);
  println(`${color('Card:',141)} ${CARDS[i].name}`);
  println(` ${color('→',69)} ${CARDS[i].textEn}`);
  println('');
}
function showByIndex(idx){
  if(idx<0 || idx>=CARDS.length){ warn('Invalid card index'); return; }
  const c = CARDS[idx];
  renderCard(c, idx);
  println(`${color('Card:',141)} ${c.name}`);
  println(` ${color('→',69)} ${c.textEn}`);
  println('');
}
function listCards(){
  CARDS.forEach((c,i)=>{
    const marker = (i===currentIndex) ? color('→',69) : ' ';
    println(`${marker} ${String(i+1).padStart(2,' ')}. ${c.name}`);
  });
  buildThumbnails();
}

/* ===== Terminal mode ===== */
function initTerminal(){
  // если xterm не доступен — выходим в simpleMode
  if (typeof window.Terminal !== 'function') { enableSimpleMode(); return; }

  term = new Terminal({
    convertEol:true, fontSize:14,
    theme: { background:'#0b0014', foreground:'#e8d7ff', cursor:'#a020f0',
             selection:'#5f15a8', black:'#0b0014', brightBlack:'#2b1242' }
  });
  term.open(els.termEl);
  println('Web3 Witch Terminal ready.');
  println('Type "help" to see available commands.');
  prompt();

  let buffer = '';
  term.onData(ch=>{
    const code = ch.charCodeAt(0);
    if (code===13){ // Enter
      const line = buffer.trim(); buffer=''; write('\r\n'); handleCommand(line); prompt();
    } else if (code===127){ // Backspace
      if (buffer.length>0){ buffer=buffer.slice(0,-1); write('\b \b'); }
    } else if (code===3){ // Ctrl+C
      write('^C'); buffer=''; prompt();
    } else { buffer+=ch; write(ch); }
  });
}
function handleCommand(line){
  const [cmd,...rest]=line.split(/\s+/); const arg=rest.join(' ').trim();
  switch((cmd||'').toLowerCase()){
    case 'help':
      println(color('Available commands:',69));
      println(`  ${color('help',141)}         Show this help`);
      println(`  ${color('list',141)}         Show all cards (blurred thumbnails)`);
      println(`  ${color('draw',141)}         Draw a random card`);
      println(`  ${color('show',141)} [n|name] Show card by number or name (partial ok)`);
      println(`  ${color('clear',141)}        Clear terminal`); break;
    case 'list': listCards(); break;
    case 'draw': drawRandom(); break;
    case 'show': {
      if(!arg){ warn('Usage: show <n|name>'); break; }
      const n = Number(arg);
      if(Number.isInteger(n)) showByIndex(n-1);
      else {
        const needle = arg.toLowerCase();
        const idx = CARDS.findIndex(c => c.name.toLowerCase().includes(needle));
        if (idx>=0) showByIndex(idx); else warn(`Card not found: ${arg}`);
      }
      break;
    }
    case 'clear': term.clear(); break;
    case '': break;
    default: warn(`Unknown command: ${cmd}`); println(`Try ${color('help',141)}.`); }
}

/* ===== Simple (fallback) mode ===== */
function enableSimpleMode(){
  document.body.classList.add('simple-mode');
  // показать кнопки
  els.simpleControls?.classList.add('show');
  if (els.btnDraw) els.btnDraw.onclick = () => drawRandom();
  if (els.btnList) els.btnList.onclick = () => listCards();
  // подсказка
  const tip = document.createElement('div');
  tip.style.padding='8px'; tip.style.color='#ff8fab'; tip.style.marginTop='8px';
  tip.textContent = 'Terminal unavailable — using fallback controls.';
  els.termEl.appendChild(tip);
}

/* ===== Init ===== */
(async function init(){
  try {
    await loadCards();
  } catch (e) {
    // если не смогли загрузить JSON — покажем понятную ошибку
    warn('Failed to load cards.json. Open https://witchweb3.com/cards/cards.json to verify.');
  }

  if (typeof window.Terminal === 'function') {
    initTerminal();
  } else {
    // подождём xterm до 3с, иначе — fallback
    let tries=0;
    const t=setInterval(()=>{
      if (typeof window.Terminal === 'function'){ clearInterval(t); initTerminal(); }
      else if (++tries>60){ clearInterval(t); enableSimpleMode(); }
    },50);
  }
})();
