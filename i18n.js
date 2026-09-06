const translatedLabels = {
  ".menu-heading h1": [
    "Pavage de Truchet",
    "Truchet tiling"
  ],
  ".learn-more": [
    "En savoir plus",
    "Learn more"
  ],
  "[data-pattern=\"random\"]": [
    "Aléatoire",
    "Random"
  ],
  "#editor-toggle": [
    "Motif perso",
    "Custom pattern"
  ],
  "#info-toggle": [
    "info",
    "info"
  ],
  "label[for=\"sequence\"]": [
    "Séquence A / B",
    "A / B sequence"
  ],
  "#sequence-help": [
    "A et B uniquement ; les espaces sont ignorés.",
    "A and B only; spaces are ignored."
  ],
  ".shift-label > span": [
    "Décalage par ligne",
    "Shift per row"
  ],
  "#apply-pattern": [
    "Appliquer",
    "Apply"
  ],
  "#export-image": [
    "Exporter PNG",
    "Export PNG"
  ],
  "#source-link": [
    "Code source",
    "Source code"
  ],
  "#license-link": [
    "Licence MIT",
    "MIT license"
  ],
  "#info p:nth-child(1)": [
    "Nomenclature : A est l’image de base ; B est la tuile tournée de 90°.",
    "Notation: A is the original image; B is the tile rotated by 90°."
  ],
  "#info p:nth-child(2)": [
    "La séquence se répète horizontalement. Le nombre après d indique le décalage vers la gauche à chaque nouvelle ligne.",
    "The sequence repeats horizontally. The number after d gives the shift to the left for each new row."
  ],
  "#info p:nth-child(3)": [
    "ABd0 : toutes les lignes font ABAB… ABd1 : une ligne ABAB…, puis BABA…",
    "ABd0: every row is ABAB… ABd1: one row is ABAB…, then BABA…"
  ],
  "#info p:nth-child(4)": [
    "ABBABAd1 : ABBABA…, puis BBABAA…, puis BABAAB… Le décalage va de 0 à la longueur de la séquence moins 1.",
    "ABBABAd1: ABBABA…, then BBABAA…, then BABAAB… The shift ranges from 0 to the sequence length minus 1."
  ],
  "[data-pattern=\"1\"]": [
    "Motif 1 (Ad0)",
    "Pattern 1 (Ad0)"
  ],
  "[data-pattern=\"2\"]": [
    "Motif 2 (Bd0)",
    "Pattern 2 (Bd0)"
  ],
  "[data-pattern=\"3\"]": [
    "Motif 3 (ABd0)",
    "Pattern 3 (ABd0)"
  ],
  "[data-pattern=\"4\"]": [
    "Motif 4 (ABd1)",
    "Pattern 4 (ABd1)"
  ]
};
const translatedMessages = {
  "empty": [
    "Saisis une séquence de A et B",
    "Enter a sequence of A and B"
  ],
  "applied": [
    "{name} appliqué",
    "{name} applied"
  ],
  "preview": [
    "Aperçu de {name}, 12 colonnes et 4 lignes",
    "Preview of {name}, 12 columns and 4 rows"
  ],
  "tile": [
    "Tuile {column}, {row} : position {position}. Tourner de 90 degrés.",
    "Tile {column}, {row}: orientation {position}. Rotate by 90 degrees."
  ],
  "collapse": [
    "Réduire les contrôles",
    "Collapse controls"
  ],
  "expand": [
    "Afficher les contrôles",
    "Show controls"
  ],
  "paving": [
    "Pavage interactif",
    "Interactive tiling"
  ],
  "controls": [
    "Contrôles du pavage",
    "Tiling controls"
  ],
  "language": [
    "Langue",
    "Language"
  ],
  "notation": [
    "Nomenclature des motifs",
    "Pattern notation"
  ],
  "exported": [
    "PNG {width} × {height} prêt : téléchargement lancé.",
    "PNG {width} × {height} ready: download started."
  ],
  "exportBlocked": [
    "Export bloqué par le navigateur : ouvre le site via un serveur local ou GitHub Pages.",
    "Export blocked by the browser: open the site on a local server or GitHub Pages."
  ],
  "exportError": [
    "Export impossible. Vérifie le chargement de l’image et réessaie.",
    "Export failed. Check that the image has loaded and try again."
  ]
};
let language = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
try {
  const saved = localStorage.getItem('truchet-language');
  if (saved === 'fr' || saved === 'en') language = saved;
} catch { /* Storage may be unavailable in private or local-file browsing. */ }

function t(key, values = {}) {
  return translatedMessages[key][language === 'fr' ? 0 : 1].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function setStatus(element, key, values = {}) {
  element.dataset.message = key;
  element.dataset.values = JSON.stringify(values);
  element.textContent = key ? t(key, values) : '';
}

function setLanguage(next) {
  language = next;
  document.documentElement.lang = language;
  const index = language === 'fr' ? 0 : 1;
  document.title = translatedLabels['.menu-heading h1'][index];
  for (const [selector, labels] of Object.entries(translatedLabels)) {
    document.querySelector(selector).textContent = labels[index];
  }
  for (const [selector, key] of [['#paving', 'paving'], ['.controls', 'controls'], ['.languages', 'language'], ['#info', 'notation']]) {
    document.querySelector(selector).setAttribute('aria-label', t(key));
  }
  document.querySelector('#controls-toggle').setAttribute('aria-label', t(document.querySelector('#controls-content').hidden ? 'expand' : 'collapse'));
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  document.querySelectorAll('[data-message]').forEach(element => setStatus(element, element.dataset.message, JSON.parse(element.dataset.values || '{}')));
  document.dispatchEvent(new Event('languagechange'));
}

document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
  try { localStorage.setItem('truchet-language', button.dataset.language); } catch { /* Optional preference storage. */ }
  setLanguage(button.dataset.language);
}));
setLanguage(language);
