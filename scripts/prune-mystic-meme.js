const fs = require('fs');
const path = require('path');

const deckSlug = 'mystic-meme';
const deckDir = path.join('decks', deckSlug);
const manifestPath = path.join(deckDir, 'manifest.json');
const metadataDir = path.join(deckDir, 'metadata');

const man = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

function fileExists(rel) {
  return fs.existsSync(path.join(deckDir, rel));
}

function cleanTitle(s='') {
  // убираем ведущие ._- и пробелы, приводим к Title Case
  s = s.replace(/^[\.\s_-]+/, '');
  return s.replace(/\s+/g,' ')
          .trim()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
}

// 1) оставим только карточки с реально существующими файлами
let kept = (man.cards || []).filter(c => c.image && fileExists(c.image));

// 2) перенумеруем id от 1..N, подчистим title
kept = kept.map((c, i) => ({
  id: i+1,
  suit: c.suit,
  title: cleanTitle(c.title || ''),
  image: c.image.replace(/\\/g,'/'),
  metadata: `metadata/${i+1}.json`
}));

// 3) записываем новый manifest
man.cards = kept;
fs.writeFileSync(manifestPath, JSON.stringify(man, null, 2), 'utf-8');

// 4) перезаписываем metadata/* под новые id (имидж CID оставляем плейсхолдером)
if (!fs.existsSync(metadataDir)) fs.mkdirSync(metadataDir, { recursive: true });
for (const c of kept) {
  const meta = {
    name: `${c.title} (${c.suit})`,
    description: "Web3 Mystic Meme Tarot — multi-suit deck.",
    image: `ipfs://<IMAGES_CID>/${c.image}`,
    attributes: [
      { trait_type: "Suit", value: c.suit },
      { trait_type: "Card", value: c.title },
      { trait_type: "ID", value: c.id }
    ]
  };
  fs.writeFileSync(path.join(metadataDir, `${c.id}.json`), JSON.stringify(meta, null, 2), 'utf-8');
}

// 5) удалим лишние metadata файлы (если остались от старой нумерации)
for (const f of fs.readdirSync(metadataDir)) {
  if (!/^\d+\.json$/.test(f)) continue;
  const id = parseInt(f,10);
  if (!kept.find(c => c.id === id)) {
    fs.unlinkSync(path.join(metadataDir, f));
  }
}

console.log(`Kept ${kept.length} cards. Manifest & metadata regenerated.`);
