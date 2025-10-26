const fs = require('fs');
const path = require('path');

const root = process.cwd();
const deckSlug = 'mystic-meme';
const deckDir = path.join(root, 'decks', deckSlug);
const imagesDir = path.join(deckDir, 'images');
const metadataDir = path.join(deckDir, 'metadata');
const manifestPath = path.join(deckDir, 'manifest.json');

const SUIT_LABELS = {
  meme: 'Meme',
  mystic: 'Mystic',
  coder: 'Coder'
};

function toTitleCase(s) {
  return s
    .replace(/\.[^.]+$/, '')
    .split(/[-_ ]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function walkImages() {
  const entries = [];
  if (!fs.existsSync(imagesDir)) return entries;
  for (const suitFolder of Object.keys(SUIT_LABELS)) {
    const suitPath = path.join(imagesDir, suitFolder);
    if (!fs.existsSync(suitPath)) continue;
    const files = fs.readdirSync(suitPath)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort();
    for (const file of files) {
      const rel = path.join('images', suitFolder, file).replace(/\\/g, '/');
      const title = toTitleCase(file);
      const suit = SUIT_LABELS[suitFolder];
      entries.push({ suitOrder: Object.keys(SUIT_LABELS).indexOf(suitFolder), suit, title, rel });
    }
  }
  entries.sort((a,b) => a.suitOrder - b.suitOrder || a.title.localeCompare(b.title));
  return entries.map((e, i) => ({ id: i+1, suit: e.suit, title: e.title, rel: e.rel }));
}

function ensureDirs() {
  if (!fs.existsSync(metadataDir)) fs.mkdirSync(metadataDir, { recursive: true });
}

function loadManifest() {
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw);
}

function saveManifest(m) {
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2), 'utf-8');
}

function main() {
  const images = walkImages();
  if (images.length === 0) {
    console.error('No images found in decks/mystic-meme/images/**');
    process.exit(1);
  }

  ensureDirs();

  const manifest = loadManifest();
  manifest.cards = images.map(({id, suit, title, rel}) => ({
    id, suit, title, image: rel, metadata: `metadata/${id}.json`
  }));

  for (const {id, suit, title, rel} of images) {
    const meta = {
      name: `${title} (${suit})`,
      description: "Web3 Mystic Meme Tarot — 21-card deck across Meme, Mystic, Coder.",
      image: `ipfs://<IMAGES_CID>/${rel}`,
      attributes: [
        { trait_type: "Suit", value: suit },
        { trait_type: "Card", value: title },
        { trait_type: "ID", value: id }
      ]
    };
    fs.writeFileSync(path.join(metadataDir, `${id}.json`), JSON.stringify(meta, null, 2), 'utf-8');
  }

  saveManifest(manifest);
  console.log(`Wrote ${images.length} metadata files and updated manifest.cards`);
}

main();
