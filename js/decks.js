async function loadRegistry() {
  const res = await fetch('/decks/registry.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Не удалось загрузить registry.json');
  return await res.json();
}

async function loadManifest(slug) {
  const res = await fetch(`/decks/${slug}/manifest.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Не удалось загрузить manifest.json');
  return await res.json();
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

async function renderDeckPicker() {
  const picker = document.getElementById('deck-picker');
  const backWrap = document.querySelector('.back');
  const gallery = document.getElementById('deck-gallery');
  picker.innerHTML = '<p>Загружаю колоды…</p>';
  gallery.innerHTML = '';
  backWrap.style.display = 'none';

  const registry = await loadRegistry();
  if (!Array.isArray(registry) || registry.length === 0) {
    picker.innerHTML = '<p>Пока нет колод.</p>';
    return;
  }

  picker.innerHTML = '';
  picker.classList.add('grid');
  registry.forEach(d => {
    const card = el(`
      <div class="deck-card" data-slug="${d.slug}">
        <img src="${d.preview}" alt="${d.name}">
        <h3>${d.name}</h3>
        <button>Открыть</button>
      </div>
    `);
    card.querySelector('button').addEventListener('click', () => openDeck(d.slug));
    picker.appendChild(card);
  });
}

async function openDeck(slug) {
  const picker = document.getElementById('deck-picker');
  const backWrap = document.querySelector('.back');
  const backBtn = document.getElementById('backBtn');
  const gallery = document.getElementById('deck-gallery');

  picker.innerHTML = '';
  const manifest = await loadManifest(slug);

  backWrap.style.display = 'block';
  backBtn.onclick = () => { renderDeckPicker(); };

  gallery.innerHTML = `
    <h2>${manifest.name}</h2>
    <p>${manifest.description || ''}</p>
    <div class="grid" id="cards"></div>
  `;

  const cardsWrap = document.getElementById('cards');
  (manifest.cards || []).forEach(c => {
    const card = el(`
      <div class="card">
        <img src="/decks/${slug}/${c.image}" alt="${c.title}">
        <div class="meta">
          <b>${c.title}</b><br/>
          <small>${c.suit}</small>
        </div>
      </div>
    `);
    cardsWrap.appendChild(card);
  });
}

window.addEventListener('DOMContentLoaded', () => renderDeckPicker());
