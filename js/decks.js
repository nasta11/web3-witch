(async function () {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }

  async function loadRegistry() {
    return fetchJSON('/decks/registry.json');
  }

  async function loadManifest(slug) {
    return fetchJSON(`/decks/${slug}/manifest.json`);
  }

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function showError(msg) {
    const toast = el(`<div class="toast">${msg}</div>`);
    document.body.appendChild(toast);
    setTimeout(()=>toast.classList.add('show'));
    setTimeout(()=>toast.classList.remove('show'), 3500);
    setTimeout(()=>toast.remove(), 4000);
  }

  // ---------- Главная: список колод ----------
  async function renderDeckPicker() {
    const picker = $('#deck-picker');
    const gallery = $('#deck-gallery');
    const toolbar = $('#toolbar');
    const backWrap = $('.back');

    picker.innerHTML = `<div class="skeleton-grid"></div>`;
    gallery.innerHTML = '';
    toolbar.innerHTML = '';
    backWrap.style.display = 'none';

    let registry;
    try { registry = await loadRegistry(); }
    catch (e) { picker.innerHTML = ''; showError('Не удалось загрузить список колод'); return; }

    if (!Array.isArray(registry) || registry.length === 0) {
      picker.innerHTML = '<p class="muted">Пока нет колод.</p>';
      return;
    }

    picker.classList.add('grid');
    picker.innerHTML = '';
    for (const d of registry) {
      const card = el(`
        <article class="deck-card" data-slug="${d.slug}">
          <div class="imgwrap">
            <img loading="lazy" src="${d.preview}" alt="${d.name}">
          </div>
          <header>
            <h3>${d.name}</h3>
            <a class="btn" href="javascript:void(0)">Открыть</a>
          </header>
        </article>
      `);
      card.querySelector('.btn').addEventListener('click', () => openDeck(d.slug));
      picker.appendChild(card);
    }
  }

  // ---------- Внутренняя страница колоды ----------
  async function openDeck(slug) {
    const picker = $('#deck-picker');
    const gallery = $('#deck-gallery');
    const toolbar = $('#toolbar');
    const backWrap = $('.back');
    const backBtn = $('#backBtn');

    picker.innerHTML = '';
    gallery.innerHTML = '<div class="skeleton-grid"></div>';
    toolbar.innerHTML = '';
    backWrap.style.display = 'block';
    backBtn.onclick = () => renderDeckPicker();

    let manifest;
    try { manifest = await loadManifest(slug); }
    catch (e) { gallery.innerHTML = ''; showError('Не удалось загрузить манифест колоды'); return; }

    const suits = Array.from(new Set((manifest.cards||[]).map(c => c.suit))).filter(Boolean).sort();
    const counts = { total: (manifest.cards||[]).length };

    // Панель: поиск + фильтры по мастям/сетам
    toolbar.innerHTML = `
      <div class="toolbar-inner">
        <div class="left">
          <h2 class="deck-title">${manifest.name}</h2>
          <p class="deck-desc">${manifest.description || ''}</p>
        </div>
        <div class="right">
          <div class="searchbox">
            <input id="q" type="search" placeholder="Поиск по названию…">
            <span class="count" id="count">0</span>
          </div>
          <div class="filters" id="filters">
            <button class="chip active" data-suit="all">Все</button>
            ${suits.map(s => `<button class="chip" data-suit="${s}">${s}</button>`).join('')}
          </div>
        </div>
      </div>
    `;

    const state = {
      slug,
      cards: manifest.cards || [],
      suit: 'all',
      q: ''
    };

    const grid = el(`<div class="grid" id="cards"></div>`);
    gallery.innerHTML = '';
    gallery.appendChild(grid);

    function applyFilters() {
      const q = state.q.trim().toLowerCase();
      let filtered = state.cards;
      if (state.suit !== 'all') {
        filtered = filtered.filter(c => (c.suit||'').toLowerCase() === state.suit.toLowerCase());
      }
      if (q) {
        filtered = filtered.filter(c =>
          (c.title||'').toLowerCase().includes(q) ||
          (c.suit||'').toLowerCase().includes(q)
        );
      }
      $('#count').textContent = String(filtered.length);
      renderCards(filtered);
    }

    function renderCards(list) {
      grid.innerHTML = '';
      if (list.length === 0) {
        grid.innerHTML = '<p class="muted span-all">Ничего не найдено.</p>';
        return;
      }
      for (const c of list) {
        const card = el(`
          <article class="card">
            <div class="imgwrap">
              <img loading="lazy" src="/decks/${state.slug}/${c.image}" alt="${c.title}">
            </div>
            <div class="meta">
              <div class="title">${c.title}</div>
              <div class="suit">${c.suit}</div>
            </div>
          </article>
        `);
        grid.appendChild(card);
      }
    }

    // события фильтров
    $('#filters').addEventListener('click', (e) => {
      const btn = e.target.closest('button.chip');
      if (!btn) return;
      $$('#filters .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.suit = btn.dataset.suit || 'all';
      applyFilters();
    });

    $('#q').addEventListener('input', (e) => {
      state.q = e.target.value || '';
      applyFilters();
    });

    // первичный рендер
    $('#count').textContent = String(counts.total);
    renderCards(state.cards);
  }

  // Go!
  window.addEventListener('DOMContentLoaded', renderDeckPicker);
})();
