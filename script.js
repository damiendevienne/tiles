const paving = document.querySelector('#paving');
const zoom = document.querySelector('#zoom');
const patternButtons = document.querySelectorAll('[data-pattern]');
const tiles = new Map();
let activePattern = '1';
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
const controlsToggle = document.querySelector('#controls-toggle');
controlsToggle.addEventListener('click', () => {
  const content = document.querySelector('#controls-content');
  content.hidden = !content.hidden;
  document.querySelector('.controls').classList.toggle('is-collapsed', content.hidden);
  controlsToggle.setAttribute('aria-expanded', String(!content.hidden));
  controlsToggle.setAttribute('aria-label', content.hidden ? 'Afficher les contrôles' : 'Réduire les contrôles');
  controlsToggle.textContent = content.hidden ? '☰' : '−';
});

// Reserve zoom for the slider, including trackpad pinch and browser shortcuts.
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
    const index = (column + row * definition.shift) % definition.sequence.length;
    return definition.sequence[index] === 'B' ? 1 : 0;
  }
  return Math.random() < 0.5 ? 0 : 1;
}

function paint(tile) {
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
  const size = Number(zoom.value);
  paving.style.setProperty('--tile-size', `${size}px`);
  const columns = Math.ceil(paving.clientWidth / size);
  const rows = Math.ceil(paving.clientHeight / size);

  // Keep each remaining tile's orientation when zooming or resizing.
  for (const [key, tile] of tiles) {
    if (tile.column >= columns || tile.row >= rows) {
      tile.button.remove();
      tiles.delete(key);
    }
  }

  const fragment = document.createDocumentFragment();
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
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
        tile = { button, image, column, row, turns: orientation(activePattern, column, row) };
        paint(tile);
        button.addEventListener('click', () => {
          if (applyingPattern) return;
          tile.turns++;
          paint(tile);
          selectPattern(null);
        });
        tiles.set(key, tile);
        fragment.append(button);
      }
      tile.button.style.left = `${column * size}px`;
      tile.button.style.top = `${row * size}px`;
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
  const inputs = [...patternButtons, applyButton, zoom, sequenceInput, shiftInput];
  const disabledStates = inputs.map(input => input.disabled);
  inputs.forEach(input => { input.disabled = true; });
  try {
    // Let the spinner paint before starting the tile updates.
    await nextFrame();
    await nextFrame();
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

zoom.addEventListener('input', scheduleLayout);
window.addEventListener('resize', scheduleLayout);
updateEditor();
layout();
