/* decks router + wallet + mint */
(async function () {
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  /* -------- helpers -------- */
  async function fetchJSON(url) {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(url + sep + "v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }
  async function loadRegistry() { return fetchJSON("/decks/registry.json"); }
  async function loadManifest(slug){ return fetchJSON(`/decks/${slug}/manifest.json`); }
  function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }
  function toast(msg){ const x=el(`<div class="toast">${msg}</div>`); document.body.appendChild(x); setTimeout(()=>x.classList.add('show')); setTimeout(()=>x.classList.remove('show'),3500); setTimeout(()=>x.remove(),4000); }

  /* -------- tiny router based on ?deck=slug -------- */
  function getDeckFromURL(){
    const u = new URL(location.href);
    return u.searchParams.get('deck') || '';
  }
  function pushURLDeck(slug){ const u=new URL(location.href); if(slug){u.searchParams.set('deck',slug);} else {u.searchParams.delete('deck');} history.pushState({deck:slug}, '', u); }
  function replaceURLDeck(slug){ const u=new URL(location.href); if(slug){u.searchParams.set('deck',slug);} else {u.searchParams.delete('deck');} history.replaceState({deck:slug}, '', u); }

  /* -------- screens -------- */
  async function renderDeckPicker({replace=false}={}){
    const picker = $('#deck-picker'), gallery = $('#deck-gallery'), toolbar = $('#toolbar'), backWrap = $('.back');
    if (!replace) pushURLDeck('');
    picker.innerHTML = `<div class="skeleton-grid"></div>`;
    gallery.innerHTML = '';
    toolbar.innerHTML = '';
    backWrap.style.display = 'none';

    let registry;
    try { registry = await loadRegistry(); }
    catch(e){ picker.innerHTML=''; toast('Не удалось загрузить список колод'); return; }

    if (!Array.isArray(registry) || registry.length===0){
      picker.innerHTML = '<p class="muted">Пока нет колод.</p>';
      return;
    }

    picker.classList.add('grid');
    picker.innerHTML = '';
    for (const d of registry) {
      const card = el(`
        <article class="deck-card" data-slug="${d.slug}">
          <div class="imgwrap"><img loading="lazy" src="${d.preview}" alt="${d.name}"></div>
          <header><h3>${d.name}</h3><a class="btn" href="javascript:void(0)">Открыть</a></header>
        </article>
      `);
      card.querySelector('.btn').addEventListener('click', () => openDeck(d.slug));
      picker.appendChild(card);
    }
  }

  async function openDeck(slug, {replace=false}={}){
    if (!slug) return renderDeckPicker({replace});
    if (!replace) pushURLDeck(slug);

    const picker = $('#deck-picker'), gallery = $('#deck-gallery'), toolbar = $('#toolbar'), backWrap = $('.back'), backBtn = $('#backBtn');
    picker.innerHTML = '';
    gallery.innerHTML = '<div class="skeleton-grid"></div>';
    toolbar.innerHTML = '';
    backWrap.style.display = 'block';
    backBtn.onclick = () => renderDeckPicker();

    let manifest;
    try { manifest = await loadManifest(slug); }
    catch(e){ gallery.innerHTML=''; toast('Не удалось загрузить манифест'); return; }

    const suits = Array.from(new Set((manifest.cards||[]).map(c => c.suit))).filter(Boolean).sort();

    toolbar.innerHTML = `
      <div class="toolbar-inner">
        <div class="left">
          <h2 class="deck-title">${manifest.name}</h2>
          <p class="deck-desc">${manifest.description || ''}</p>
        </div>
        <div class="right">
          <div class="searchbox">
            <input id="q" type="search" placeholder="Поиск по названию…">
            <span class="count" id="count">${(manifest.cards||[]).length}</span>
          </div>
          <div class="filters" id="filters">
            <button class="chip active" data-suit="all">Все</button>
            ${suits.map(s => `<button class="chip" data-suit="${s}">${s}</button>`).join('')}
          </div>
          <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
            <button class="btn" id="connectBtn">Connect Wallet</button>
          </div>
        </div>
      </div>
    `;

    const state = { slug, deckId: manifest.deckId, cards: manifest.cards||[], suit:'all', q:'' };
    const grid = el(`<div class="grid" id="cards"></div>`);
    gallery.innerHTML = '';
    gallery.appendChild(grid);

    function renderCards(list){
      grid.innerHTML='';
      if (list.length===0){ grid.innerHTML = '<p class="muted span-all">Ничего не найдено.</p>'; return; }
      for (const c of list) {
        const title = (c.title||'').replace(/^[\.\s_-]+/,'');
        const card = el(`
          <article class="card">
            <div class="imgwrap"><img loading="lazy" src="/decks/${state.slug}/${c.image}" alt="${title}"></div>
            <div class="meta">
              <div class="title">${title}</div>
              <div class="suit">${c.suit}</div>
            </div>
            <div class="actions">
              <button class="btn mint" data-id="${c.id}">Mint</button>
            </div>
          </article>
        `);
        grid.appendChild(card);
      }
    }

    function applyFilters(){
      const q = state.q.trim().toLowerCase();
      let filtered = state.cards;
      if (state.suit!=='all') filtered = filtered.filter(c => (c.suit||'').toLowerCase() === state.suit.toLowerCase());
      if (q) filtered = filtered.filter(c => (c.title||'').toLowerCase().includes(q) || (c.suit||'').toLowerCase().includes(q));
      $('#count').textContent = String(filtered.length);
      renderCards(filtered);
    }

    // events
    $('#filters').addEventListener('click', (e) => {
      const btn = e.target.closest('button.chip'); if (!btn) return;
      $$('#filters .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.suit = btn.dataset.suit || 'all';
      applyFilters();
    });
    $('#q').addEventListener('input', (e) => { state.q = e.target.value || ''; applyFilters(); });
    $('#connectBtn').addEventListener('click', async () => {
      try { await (window.connectWallet?.()); toast('Wallet connected'); }
      catch(e){ toast(e.message || 'Wallet error'); }
    });

    grid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.mint'); if (!btn) return;
      if (!window.mintWithEthers){ toast('Mint модуль не загружен'); return; }
      try {
        const id = Number(btn.dataset.id);
        btn.disabled = true; btn.textContent = 'Minting…';
        const r = await window.mintWithEthers(state.deckId, id, 1);
        btn.textContent = 'Minted';
        toast('Mint sent: ' + (r?.hash || ''));
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Mint';
        toast(err.message || 'Mint error');
      }
    });

    renderCards(state.cards);
  }

  /* -------- init & history -------- */
  async function routeFromURL({replace=false}={}){
    const slug = getDeckFromURL();
    if (slug) { await openDeck(slug, {replace}); }
    else      { await renderDeckPicker({replace}); }
  }
  window.addEventListener('popstate', () => routeFromURL({replace:true}));
  window.addEventListener('DOMContentLoaded', () => routeFromURL({replace:true}));
})();
