const paving = document.querySelector('#paving');
const zoom = document.querySelector('#zoom');
const patternButtons = document.querySelectorAll('[data-pattern]');
const tiles = new Map();
let activePattern = '1';
let layoutFrame;

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
  if (pattern === '1') return 0;
  if (pattern === '2') return 1;
  if (pattern === '3') return column % 2;
  if (pattern === '4') return (column + row) % 2;
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

patternButtons.forEach(button => {
  button.addEventListener('click', () => {
    const pattern = button.dataset.pattern;
    selectPattern(pattern);
    for (const tile of tiles.values()) {
      const target = orientation(pattern, tile.column, tile.row);
      // Accumulate clockwise turns; leave already correct tiles untouched.
      if (tile.turns % 2 !== target) {
        tile.turns++;
        paint(tile);
      }
    }
  });
});

function scheduleLayout() {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(layout);
}

zoom.addEventListener('input', scheduleLayout);
window.addEventListener('resize', scheduleLayout);
layout();
