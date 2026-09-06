const paving = document.querySelector('#paving');
const zoom = document.querySelector('#zoom');
const patternButtons = document.querySelectorAll('[data-pattern]');
const tiles = new Map();
let activePattern = '1';
let basePattern = '1';
const tileStates = new Map();
let tileSize = Number(zoom.value);
let offsetX = 0;
let offsetY = 0;
let layoutFrame;
let applyingPattern = false;
const presets = {
  '1': { sequence: 'A', shift: 0 },
  '2': { sequence: 'B', shift: 0 },
  '3': { sequence: 'AB', shift: 0 },
  '4': { sequence: 'AB', shift: 1 },
};
const editor = document.querySelector('#editor');
const sequenceInput = document.querySelector('#sequence');
const shiftInput = document.querySelector('#shift');
const patternName = document.querySelector('#pattern-name');
const preview = document.querySelector('#preview');
const applyButton = document.querySelector('#apply-pattern');
const editorStatus = document.querySelector('#editor-status');
const exportButton = document.querySelector('#export-image');
const exportStatus = document.querySelector('#export-status');
let exportingImage = false;
let exportStatusTimer;
const controlsToggle = document.querySelector('#controls-toggle');
controlsToggle.addEventListener('click', () => {
  const content = document.querySelector('#controls-content');
  content.hidden = !content.hidden;
  document.querySelector('.controls').classList.toggle('is-collapsed', content.hidden);
  controlsToggle.setAttribute('aria-expanded', String(!content.hidden));
  controlsToggle.setAttribute('aria-label', content.hidden ? 'Afficher les contrôles' : 'Réduire les contrôles');
  controlsToggle.textContent = content.hidden ? '☰' : '−';
});

// Prevent browser zoom: gestures change only the paving.
document.addEventListener('wheel', event => {
  if (event.ctrlKey || event.metaKey) event.preventDefault();
}, { passive: false });

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) &&
      (['+', '-', '=', '0'].includes(event.key) ||
       ['NumpadAdd', 'NumpadSubtract', 'Numpad0'].includes(event.code))) {
    event.preventDefault();
  }
});

// Safari exposes pinch gestures separately from wheel events.
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, event => event.preventDefault(), { passive: false });
}

function orientation(pattern, column, row) {
  const definition = typeof pattern === 'object' ? pattern : presets[pattern];
  if (definition) {
    const length = definition.sequence.length;
    const index = ((column + row * definition.shift) % length + length) % length;
    return definition.sequence[index] === 'B' ? 1 : 0;
  }
  return Math.random() < 0.5 ? 0 : 1;
}

function paint(tile) {
  tileStates.set(`${tile.column},${tile.row}`, tile.turns);
  tile.image.style.transform = `rotate(${tile.turns * 90}deg)`;
  tile.button.setAttribute('aria-label', `Tuile ${tile.column + 1}, ${tile.row + 1} : position ${tile.turns % 2 ? 'b' : 'a'}. Tourner de 90 degrés.`);
}

function selectPattern(pattern) {
  activePattern = pattern;
  patternButtons.forEach(button => {
    if (button.dataset.pattern !== 'random') {
      button.setAttribute('aria-pressed', String(button.dataset.pattern === pattern));
    }
  });
}

function layout() {
  const size = tileSize;
  paving.style.setProperty('--tile-size', `${size}px`);
  const firstColumn = Math.floor(-offsetX / size);
  const firstRow = Math.floor(-offsetY / size);
  const columns = Math.ceil((paving.clientWidth - offsetX) / size);
  const rows = Math.ceil((paving.clientHeight - offsetY) / size);

  // Keep each remaining tile's orientation when zooming or resizing.
  for (const [key, tile] of tiles) {
    if (tile.column < firstColumn || tile.row < firstRow || tile.column >= columns || tile.row >= rows) {
      tile.button.remove();
      tiles.delete(key);
    }
  }

  const fragment = document.createDocumentFragment();
  for (let row = firstRow; row < rows; row++) {
    for (let column = firstColumn; column < columns; column++) {
      const key = `${column},${row}`;
      let tile = tiles.get(key);
      if (!tile) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tile';
        const image = document.createElement('span');
        image.className = 'tile-image';
        image.setAttribute('aria-hidden', 'true');
        button.append(image);
        tile = { button, image, column, row, turns: tileStates.get(key) ?? orientation(basePattern, column, row) };
        paint(tile);
        button.addEventListener('click', event => {
          // Pointer taps are handled on pointerup; keep keyboard activation.
          if (event.detail === 0 && !applyingPattern) rotateTile(tile);
        });
        tiles.set(key, tile);
        fragment.append(button);
      }
      tile.button.style.left = `${offsetX + column * size}px`;
      tile.button.style.top = `${offsetY + row * size}px`;
    }
  }
  paving.append(fragment);
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

async function applyPattern(pattern, button) {
  if (applyingPattern) return;
  applyingPattern = true;
  button.classList.add('is-loading');
  button.setAttribute('aria-busy', 'true');
  const inputs = [...patternButtons, applyButton, zoom, sequenceInput, shiftInput, exportButton];
  const disabledStates = inputs.map(input => input.disabled);
  inputs.forEach(input => { input.disabled = true; });
  try {
    // Let the spinner paint before starting the tile updates.
    await nextFrame();
    await nextFrame();
    layout();
    basePattern = pattern;
    tileStates.clear();
    selectPattern(pattern);
    editorStatus.textContent = '';
    let processed = 0;
    let changed = false;
    for (const tile of tiles.values()) {
      const target = orientation(pattern, tile.column, tile.row);
      // Accumulate clockwise turns; leave already correct tiles untouched.
      if (tile.turns % 2 !== target) {
        tile.turns++;
        paint(tile);
        changed = true;
      }
      tileStates.set(`${tile.column},${tile.row}`, tile.turns);
      // Yield regularly so the loading indicator and controls remain responsive.
      if (++processed % 200 === 0) await nextFrame();
    }
    await nextFrame();
    if (changed && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } finally {
    button.classList.remove('is-loading');
    button.removeAttribute('aria-busy');
    inputs.forEach((input, index) => { input.disabled = disabledStates[index]; });
    exportButton.disabled = exportingImage;
    applyingPattern = false;
  }
}

patternButtons.forEach(button => {
  button.addEventListener('click', () => {
    editor.hidden = true;
    document.querySelector('#editor-toggle').setAttribute('aria-expanded', 'false');
    applyPattern(button.dataset.pattern, button);
  });
});

for (const name of ['editor', 'info']) {
  const toggle = document.querySelector(`#${name}-toggle`);
  const panel = document.querySelector(`#${name}`);
  toggle.addEventListener('click', () => {
    const opening = panel.hidden;
    for (const other of ['editor', 'info']) {
      document.querySelector(`#${other}`).hidden = true;
      document.querySelector(`#${other}-toggle`).setAttribute('aria-expanded', 'false');
    }
    panel.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
  });
}

function draftPattern() {
  return { sequence: sequenceInput.value, shift: Number(shiftInput.value) };
}

function updateEditor() {
  sequenceInput.value = sequenceInput.value.toUpperCase().replace(/[^AB]/g, '');
  const maxShift = Math.max(0, sequenceInput.value.length - 1);
  const shift = Math.min(Number(shiftInput.value), maxShift);
  shiftInput.max = String(maxShift);
  shiftInput.value = String(shift);
  shiftInput.disabled = maxShift === 0;
  document.querySelector('#shift-value').textContent = String(shift);
  const pattern = draftPattern();
  const valid = pattern.sequence.length > 0;
  applyButton.disabled = !valid;
  patternName.textContent = valid ? `${pattern.sequence}d${pattern.shift}` : 'Saisis une séquence de A et B';
  editorStatus.textContent = '';
  preview.replaceChildren();
  preview.hidden = !valid;
  if (!valid) return;
  preview.setAttribute('aria-label', `Aperçu de ${patternName.textContent}, 12 colonnes et 4 lignes`);
  const fragment = document.createDocumentFragment();
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 12; column++) {
      const cell = document.createElement('span');
      cell.className = 'preview-tile';
      const image = document.createElement('span');
      image.className = 'tile-image';
      image.style.transform = `rotate(${orientation(pattern, column, row) * 90}deg)`;
      cell.append(image);
      fragment.append(cell);
    }
  }
  preview.append(fragment);
}

sequenceInput.addEventListener('input', updateEditor);
shiftInput.addEventListener('input', updateEditor);
editor.addEventListener('submit', async event => {
  event.preventDefault();
  if (!sequenceInput.value || applyingPattern) return;
  // Copy the draft so further edits do not change the applied pattern.
  await applyPattern(draftPattern(), applyButton);
  editorStatus.textContent = `${patternName.textContent} appliqué`;
});

function scheduleLayout() {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(layout);
}

function rotateTile(tile) {
  tile.turns++;
  paint(tile);
  selectPattern(null);
}

function zoomAt(value, x, y) {
  const nextSize = Math.max(Number(zoom.min), Math.min(Number(zoom.max), Math.round(value)));
  const ratio = nextSize / tileSize;
  offsetX = x - (x - offsetX) * ratio;
  offsetY = y - (y - offsetY) * ratio;
  tileSize = nextSize;
  zoom.value = String(nextSize);
  scheduleLayout();
}

paving.addEventListener('wheel', event => {
  event.preventDefault();
  if (applyingPattern) return;
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? paving.clientHeight : 1);
  zoomAt(tileSize * Math.exp(-delta * 0.002), event.clientX, event.clientY);
}, { passive: false });

const pointers = new Map();
let gesture = null;
let dragged = false;

function gestureMetrics() {
  const points = [...pointers.values()];
  const a = points[0];
  const b = points[1] || a;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
    distance: Math.hypot(a.x - b.x, a.y - b.y) };
}

function resetGesture() {
  gesture = pointers.size ? { ...gestureMetrics(), size: tileSize, offsetX, offsetY } : null;
}

paving.addEventListener('pointerdown', event => {
  if (applyingPattern || event.button !== 0) return;
  if (!pointers.size) dragged = false;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size > 1) dragged = true;
  paving.setPointerCapture(event.pointerId);
  resetGesture();
});

paving.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId) || !gesture) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (applyingPattern) { dragged = true; resetGesture(); return; }
  const current = gestureMetrics();
  if (!dragged && Math.hypot(current.x - gesture.x, current.y - gesture.y) < 6) return;
  dragged = true;
  paving.classList.add('is-dragging');
  const scale = gesture.distance > 0 && pointers.size > 1 ? current.distance / gesture.distance : 1;
  tileSize = Math.max(Number(zoom.min), Math.min(Number(zoom.max), Math.round(gesture.size * scale)));
  const ratio = tileSize / gesture.size;
  offsetX = current.x - (gesture.x - gesture.offsetX) * ratio;
  offsetY = current.y - (gesture.y - gesture.offsetY) * ratio;
  zoom.value = String(tileSize);
  scheduleLayout();
});

function finishPointer(event) {
  if (!pointers.has(event.pointerId)) return;
  if (event.type === 'pointerup' && !dragged && !applyingPattern) {
    const column = Math.floor((event.clientX - offsetX) / tileSize);
    const row = Math.floor((event.clientY - offsetY) / tileSize);
    const tile = tiles.get(`${column},${row}`);
    if (tile) rotateTile(tile);
  }
  pointers.delete(event.pointerId);
  if (paving.hasPointerCapture(event.pointerId)) paving.releasePointerCapture(event.pointerId);
  resetGesture();
  if (!pointers.size) paving.classList.remove('is-dragging');
}

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  paving.addEventListener(type, finishPointer);
}

exportButton.addEventListener('click', async () => {
  if (exportingImage || applyingPattern) return;
  exportingImage = true;
  exportButton.disabled = true;
  exportButton.classList.add('is-loading');
  exportButton.setAttribute('aria-busy', 'true');
  clearTimeout(exportStatusTimer);
  exportStatus.textContent = '';
  editor.hidden = true;
  document.querySelector('#editor-toggle').setAttribute('aria-expanded', 'false');

  try {
    // Flush a pending zoom, then snapshot the settled orientations at click time.
    cancelAnimationFrame(layoutFrame);
    layout();
    const size = tileSize;
    const exportX = offsetX;
    const exportY = offsetY;
    const width = paving.clientWidth;
    const height = paving.clientHeight;
    const snapshot = [...tiles.values()].map(({ column, row, turns }) => ({ column, row, turns }));
    await nextFrame();
    await nextFrame();

    const source = new Image();
    // A file:// image taints the canvas. An embedded data URL stays exportable.
    source.src = window.location.protocol === 'file:'
      ? window.localExportTile
      : 'img/tile.png';
    await source.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponible');

    // Match the centered 100.54% CSS background crop exactly.
    const sourceWidth = source.naturalWidth / 1.0054;
    const sourceHeight = source.naturalHeight / 1.0054;
    const sourceX = (source.naturalWidth - sourceWidth) / 2;
    const sourceY = (source.naturalHeight - sourceHeight) / 2;
    let processed = 0;
    for (const { column, row, turns } of snapshot) {
      context.save();
      context.translate(exportX + (column + 0.5) * size, exportY + (row + 0.5) * size);
      context.rotate((turns % 4) * Math.PI / 2);
      context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, -size / 2, -size / 2, size, size);
      context.restore();
      if (++processed % 200 === 0) await nextFrame();
    }

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Encodage PNG impossible');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pavage-${width}x${height}-${Date.now()}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    exportStatus.textContent = `PNG ${width} × ${height} prêt : téléchargement lancé.`;
    exportStatusTimer = setTimeout(() => {
      exportStatus.textContent = '';
    }, 5000);
  } catch (error) {
    console.error('Export PNG impossible', error);
    exportStatus.textContent = error.name === 'SecurityError'
      ? 'Export bloqué par le navigateur : ouvre le site via un serveur local ou GitHub Pages.'
      : 'Export impossible. Vérifie le chargement de l’image et réessaie.';
  } finally {
    exportingImage = false;
    exportButton.disabled = applyingPattern;
    exportButton.classList.remove('is-loading');
    exportButton.removeAttribute('aria-busy');
  }
});

zoom.addEventListener('input', () => zoomAt(Number(zoom.value), paving.clientWidth / 2, paving.clientHeight / 2));
window.addEventListener('resize', scheduleLayout);
updateEditor();
layout();
