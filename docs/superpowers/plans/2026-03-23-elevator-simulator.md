# Elevator Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based elevator simulator with pixel-art animals, configurable floors/elevators, Perlin noise spawning, and selectable scheduling algorithms — hosted as a static single page on GitHub Pages.

**Architecture:** Canvas-rendered 2D cross-section building with tick-based simulation engine. Pure JS modules for sim logic (testable in Node), Canvas API for rendering. ES modules, no build step, no dependencies.

**Tech Stack:** Vanilla JavaScript (ES modules), HTML Canvas, CSS. Node `--test` for unit tests on pure logic modules.

**Spec:** `docs/superpowers/specs/2026-03-23-elevator-simulator-design.md`

---

## File Structure

```
elevation/
├── index.html                  # Entry point, control strip HTML, canvas
├── css/
│   └── style.css               # Control strip styling, layout, dark theme
├── js/
│   ├── main.js                 # Bootstrap, game loop (rAF), glue
│   ├── sim.js                  # Simulation state, tick, spawn, lifecycles
│   ├── renderer.js             # Canvas rendering (building, elevators, animals)
│   ├── sprites.js              # Sprite loader, manifest, frame animation
│   ├── perlin.js               # 1D Perlin noise (pure, no dependencies)
│   ├── algorithms/
│   │   ├── index.js            # Algorithm registry (name → function map)
│   │   ├── scan.js             # SCAN algorithm
│   │   ├── nearest.js          # Nearest Car algorithm
│   │   └── roundrobin.js       # Round Robin algorithm
│   └── controls.js             # Control strip ↔ sim state wiring
├── assets/
│   └── sprites/                # Organized sprite sheets
│       ├── cats/               # 5 cat variants (walk + idle sheets)
│       ├── dogs/               # 5 dog variants (walk + idle sheets)
│       └── foxes/              # 3 fox variants (walk + idle sheets)
└── tests/
    ├── perlin.test.js          # Perlin noise unit tests
    ├── sim.test.js             # Simulation engine unit tests
    └── algorithms.test.js      # Algorithm unit tests
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `index.html`
- Create: `css/style.css`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elevation — Elevator Simulator</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header id="controls">
    <div class="control-group control-group--left">
      <button id="btn-play" title="Play/Pause">&#9654;</button>
      <button id="btn-step" title="Step">&#9197;</button>
      <label>Speed <input type="range" id="speed" min="0.5" max="5" step="0.5" value="1"><span id="speed-val">1x</span></label>
      <button id="btn-reset" title="Reset">Reset</button>
    </div>
    <div class="control-group control-group--center">
      <label>Floors <input type="number" id="floors" min="2" max="50" value="5"></label>
      <label>Elevators <input type="number" id="elevators" min="1" max="8" value="2"></label>
      <label>Capacity <input type="number" id="capacity" min="1" max="20" value="6"></label>
    </div>
    <div class="control-group control-group--right">
      <label>Spawn Rate <input type="range" id="spawn-rate" min="0" max="100" value="50"></label>
      <label>Algorithm
        <select id="algorithm">
          <option value="scan" selected>SCAN</option>
          <option value="nearest">Nearest Car</option>
          <option value="roundrobin">Round Robin</option>
        </select>
      </label>
      <button id="btn-spawn">Spawn Animal</button>
    </div>
  </header>
  <canvas id="sim-canvas"></canvas>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `css/style.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #1a1a2e;
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  overflow: hidden;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

#controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #16213e;
  border-bottom: 2px solid #0f3460;
  height: 60px;
  flex-shrink: 0;
  gap: 12px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

label {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

input[type="number"] {
  width: 52px;
  padding: 2px 4px;
  background: #0f3460;
  color: #e0e0e0;
  border: 1px solid #533483;
  border-radius: 3px;
  text-align: center;
}

input[type="range"] { width: 80px; }

select {
  padding: 2px 4px;
  background: #0f3460;
  color: #e0e0e0;
  border: 1px solid #533483;
  border-radius: 3px;
}

button {
  padding: 4px 10px;
  background: #533483;
  color: #e0e0e0;
  border: 1px solid #6a0572;
  border-radius: 3px;
  cursor: pointer;
  font-size: 13px;
}

button:hover { background: #6a0572; }

#sim-canvas {
  flex: 1;
  display: block;
  width: 100%;
}
```

- [ ] **Step 3: Create placeholder `js/main.js`**

```js
// Bootstrap — will be filled in Task 9
const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

window.addEventListener('resize', resize);
resize();

// Placeholder: draw background to verify canvas works
ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
ctx.fillStyle = '#e0e0e0';
ctx.font = '24px system-ui';
ctx.textAlign = 'center';
ctx.fillText('Elevation — Loading...', canvas.clientWidth / 2, canvas.clientHeight / 2);
```

- [ ] **Step 4: Verify in browser**

Open `index.html` in a browser. Confirm:
- Dark background fills viewport
- Control strip visible at top with all inputs
- Canvas shows "Elevation — Loading..." centered
- No console errors

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css js/main.js
git commit -m "feat: project scaffolding with control strip and canvas"
```

---

### Task 2: Organize Sprite Assets

**Files:**
- Create: `assets/sprites/cats/` (copy 10 sheets: walk + idle per variant)
- Create: `assets/sprites/dogs/` (copy 10 sheets: walk + idle per variant)
- Create: `assets/sprites/foxes/` (copy 6 sheets: walk + idle per variant)

**Prerequisite:** The raw sprite packs (`8 BIT-PIXEL CATS V3.2.rar`, `8-Bit Dogs.rar`, `Foxes 🦊.rar`) have been extracted into `cats/`, `dogs/`, `foxes/` in the project root using `unar`. This task copies the needed sheets into a clean, normalized structure with predictable filenames.

- [ ] **Step 1: Create asset directories**

```bash
mkdir -p assets/sprites/cats assets/sprites/dogs assets/sprites/foxes
```

- [ ] **Step 2: Copy and rename cat sprite sheets**

Source: `cats/Cats/Finished Product/<Color> Cat Animations/V.1/`
Target: `assets/sprites/cats/<color>-<anim>.png`

```bash
# Black Cat
cp "cats/Cats/Finished Product/Black Cat Animations/V.1/Walking Black Cat.png" assets/sprites/cats/black-walk.png
cp "cats/Cats/Finished Product/Black Cat Animations/V.1/Sitting Black Cat-updated.png" assets/sprites/cats/black-idle.png

# Grey Cat
cp "cats/Cats/Finished Product/Grey Cat Animations/V.1/walking grey cat.png" assets/sprites/cats/grey-walk.png
cp "cats/Cats/Finished Product/Grey Cat Animations/V.1/Sitting Grey Cat-updated.png" assets/sprites/cats/grey-idle.png

# Pinkie Cat
cp "cats/Cats/Finished Product/Pinkie Cat Animations/V.1/Walking Pinkie.png" assets/sprites/cats/pinkie-walk.png
cp "cats/Cats/Finished Product/Pinkie Cat Animations/V.1/Sitting Pinkie-updated.png" assets/sprites/cats/pinkie-idle.png

# Siamese Cat
cp "cats/Cats/Finished Product/Siamese Cat Animations/V.1/Walking Siamese.png" assets/sprites/cats/siamese-walk.png
cp "cats/Cats/Finished Product/Siamese Cat Animations/V.1/Sitting Siamese-Sheet.png" assets/sprites/cats/siamese-idle.png

# Yellow Cat
cp "cats/Cats/Finished Product/Yellow Cat Animations/V.1/Walking Yellow Cat-UPDATED.png" assets/sprites/cats/yellow-walk.png
cp "cats/Cats/Finished Product/Yellow Cat Animations/V.1/Sitting Yellow Cat-UPDATED.png" assets/sprites/cats/yellow-idle.png
```

- [ ] **Step 3: Copy and rename dog sprite sheets**

Source: `dogs/8-Bit Dogs/<Breed>/`
Target: `assets/sprites/dogs/<breed>-<anim>.png`

```bash
# Base Dog
cp "dogs/8-Bit Dogs/Base Dog/Walking.png" assets/sprites/dogs/base-walk.png
cp "dogs/8-Bit Dogs/Base Dog/Sitting.png" assets/sprites/dogs/base-idle.png

# Black & White Dog
cp "dogs/8-Bit Dogs/Black & White Dog/Walking.png" assets/sprites/dogs/blackwhite-walk.png
cp "dogs/8-Bit Dogs/Black & White Dog/Sitting.png" assets/sprites/dogs/blackwhite-idle.png

# Black Dog
cp "dogs/8-Bit Dogs/Black Dog/Walking.png" assets/sprites/dogs/black-walk.png
cp "dogs/8-Bit Dogs/Black Dog/Sitting.png" assets/sprites/dogs/black-idle.png

# Brown Dog
cp "dogs/8-Bit Dogs/Brown Dog/Walking.png" assets/sprites/dogs/brown-walk.png
cp "dogs/8-Bit Dogs/Brown Dog/Sitting-Idle.png" assets/sprites/dogs/brown-idle.png

# Exotic Dog
cp "dogs/8-Bit Dogs/Exotic Dog/Walking.png" assets/sprites/dogs/exotic-walk.png
cp "dogs/8-Bit Dogs/Exotic Dog/Sitting.png" assets/sprites/dogs/exotic-idle.png
```

- [ ] **Step 4: Copy and rename fox sprite sheets**

Source: `foxes/Foxes 🦊/<Type> Fox/`
Target: `assets/sprites/foxes/<type>-<anim>.png`

```bash
# Arctic Fox
cp "foxes/Foxes 🦊/Arctic Fox/Artic fox caminhando-Sheet.png" assets/sprites/foxes/arctic-walk.png
cp "foxes/Foxes 🦊/Arctic Fox/Artic fox agachando-Sheet.png" assets/sprites/foxes/arctic-idle.png

# Red Fox
cp "foxes/Foxes 🦊/Red Fox/Red fox caminhando-Sheet.png" assets/sprites/foxes/red-walk.png
cp "foxes/Foxes 🦊/Red Fox/Red fox agachando-Sheet.png" assets/sprites/foxes/red-idle.png

# Silver Fox
cp "foxes/Foxes 🦊/Silver Fox/Silver fox caminhando-Sheet.png" assets/sprites/foxes/silver-walk.png
cp "foxes/Foxes 🦊/Silver Fox/Silver fox agachando-Sheet.png" assets/sprites/foxes/silver-idle.png
```

- [ ] **Step 5: Verify all 26 files exist**

```bash
ls -la assets/sprites/cats/ assets/sprites/dogs/ assets/sprites/foxes/
```

Expected: 10 cat files, 10 dog files, 6 fox files.

- [ ] **Step 6: Commit**

```bash
git add assets/sprites/
git commit -m "feat: organize sprite assets into normalized directory structure"
```

---

### Task 3: Perlin Noise Module

**Files:**
- Create: `js/perlin.js`
- Create: `tests/perlin.test.js`

A classic 1D Perlin noise implementation. Pure function, no side effects, testable in Node.

- [ ] **Step 1: Write failing tests**

```js
// tests/perlin.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { perlin1d, seedPerlin } from '../js/perlin.js';

describe('perlin1d', () => {
  it('returns values in [0, 1]', () => {
    seedPerlin(42);
    for (let i = 0; i < 1000; i++) {
      const v = perlin1d(i * 0.05);
      assert.ok(v >= 0 && v <= 1, `Value ${v} out of range at t=${i * 0.05}`);
    }
  });

  it('is deterministic for the same seed', () => {
    seedPerlin(123);
    const a = perlin1d(0.5);
    seedPerlin(123);
    const b = perlin1d(0.5);
    assert.strictEqual(a, b);
  });

  it('varies over time (not constant)', () => {
    seedPerlin(99);
    const values = new Set();
    for (let i = 0; i < 100; i++) {
      values.add(perlin1d(i * 0.1).toFixed(4));
    }
    assert.ok(values.size > 10, `Expected variation, got only ${values.size} unique values`);
  });

  it('is smooth (adjacent samples are close)', () => {
    seedPerlin(7);
    const step = 0.01;
    for (let t = 0; t < 10; t += step) {
      const a = perlin1d(t);
      const b = perlin1d(t + step);
      const diff = Math.abs(a - b);
      assert.ok(diff < 0.2, `Jump of ${diff} at t=${t}`);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/perlin.test.js
```

Expected: FAIL — module `../js/perlin.js` not found.

- [ ] **Step 3: Implement `js/perlin.js`**

```js
// js/perlin.js — Classic 1D Perlin noise, normalized to [0, 1]

let perm = new Uint8Array(512);

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function grad1d(hash, x) {
  return (hash & 1) === 0 ? x : -x;
}

export function seedPerlin(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // Fisher-Yates shuffle with seed
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  perm.set(p);
  perm.copyWithin(256, 0, 256);
}

export function perlin1d(x) {
  const xi = Math.floor(x) & 255;
  const xf = x - Math.floor(x);
  const u = fade(xf);
  const a = grad1d(perm[xi], xf);
  const b = grad1d(perm[xi + 1], xf - 1);
  // Raw Perlin is in [-1, 1], normalize to [0, 1]
  return (lerp(a, b, u) + 1) / 2;
}

// Default seed
seedPerlin(Date.now());
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tests/perlin.test.js
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add js/perlin.js tests/perlin.test.js
git commit -m "feat: add 1D Perlin noise module with tests"
```

---

### Task 4: Sprite Loader & Manifest

**Files:**
- Create: `js/sprites.js`

This module loads sprite sheets and provides frame-based animation lookup. No tests needed — it depends on browser Image/Canvas APIs.

- [ ] **Step 1: Create `js/sprites.js`**

```js
// js/sprites.js — Sprite manifest, loader, and frame animator

// Frame dimensions measured from actual sprite sheets:
// Cats walk: grid layout (3 cols), ~64x55 per frame, 8 frames
// Cats idle: horizontal strip, 64x64 per frame, 5 frames
// Dogs walk: horizontal strip, 64x55 per frame, 7 frames
// Dogs idle: horizontal strip, 64x64 per frame, 5 frames
// Foxes walk: horizontal strip, 64x64 per frame, 8 frames
// Foxes idle: horizontal strip, 64x64 per frame, 4 frames

const MANIFEST = {
  // Cats
  'cat-black':    { walk: { src: 'assets/sprites/cats/black-walk.png',    fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/black-idle.png',    fw: 64, fh: 64, cols: 5, count: 5 } },
  'cat-grey':     { walk: { src: 'assets/sprites/cats/grey-walk.png',     fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/grey-idle.png',     fw: 64, fh: 64, cols: 5, count: 5 } },
  'cat-pinkie':   { walk: { src: 'assets/sprites/cats/pinkie-walk.png',   fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/pinkie-idle.png',   fw: 64, fh: 64, cols: 5, count: 5 } },
  'cat-siamese':  { walk: { src: 'assets/sprites/cats/siamese-walk.png',  fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/siamese-idle.png',  fw: 64, fh: 64, cols: 5, count: 5 } },
  'cat-yellow':   { walk: { src: 'assets/sprites/cats/yellow-walk.png',   fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/yellow-idle.png',   fw: 64, fh: 64, cols: 5, count: 5 } },
  // Dogs
  'dog-base':       { walk: { src: 'assets/sprites/dogs/base-walk.png',       fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/base-idle.png',       fw: 64, fh: 64, cols: 5, count: 5 } },
  'dog-blackwhite': { walk: { src: 'assets/sprites/dogs/blackwhite-walk.png', fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/blackwhite-idle.png', fw: 64, fh: 64, cols: 5, count: 5 } },
  'dog-black':      { walk: { src: 'assets/sprites/dogs/black-walk.png',      fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/black-idle.png',      fw: 64, fh: 64, cols: 5, count: 5 } },
  'dog-brown':      { walk: { src: 'assets/sprites/dogs/brown-walk.png',      fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/brown-idle.png',      fw: 64, fh: 64, cols: 5, count: 5 } },
  'dog-exotic':     { walk: { src: 'assets/sprites/dogs/exotic-walk.png',     fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/exotic-idle.png',     fw: 64, fh: 64, cols: 5, count: 5 } },
  // Foxes
  'fox-arctic':  { walk: { src: 'assets/sprites/foxes/arctic-walk.png',  fw: 64, fh: 64, cols: 8, count: 8 },
                   idle: { src: 'assets/sprites/foxes/arctic-idle.png',  fw: 64, fh: 64, cols: 4, count: 4 } },
  'fox-red':     { walk: { src: 'assets/sprites/foxes/red-walk.png',     fw: 64, fh: 64, cols: 8, count: 8 },
                   idle: { src: 'assets/sprites/foxes/red-idle.png',     fw: 64, fh: 64, cols: 4, count: 4 } },
  'fox-silver':  { walk: { src: 'assets/sprites/foxes/silver-walk.png',  fw: 64, fh: 64, cols: 8, count: 8 },
                   idle: { src: 'assets/sprites/foxes/silver-idle.png',  fw: 64, fh: 64, cols: 4, count: 4 } },
};

export const ANIMAL_TYPES = Object.keys(MANIFEST);

const images = new Map();

export async function loadSprites() {
  const promises = [];
  for (const [type, anims] of Object.entries(MANIFEST)) {
    for (const [anim, info] of Object.entries(anims)) {
      const key = `${type}:${anim}`;
      const img = new Image();
      const p = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(`Failed to load ${info.src}`));
      });
      img.src = info.src;
      images.set(key, { img, ...info });
      promises.push(p);
    }
  }
  await Promise.all(promises);
}

/**
 * Get the source rect for a specific animation frame.
 * @param {string} type - e.g. 'cat-black'
 * @param {string} anim - 'walk' or 'idle'
 * @param {number} frame - frame index (will be wrapped)
 * @returns {{ img, sx, sy, sw, sh, fw, fh }}
 */
export function getFrame(type, anim, frame) {
  const key = `${type}:${anim}`;
  const data = images.get(key);
  if (!data) return null;
  const f = frame % data.count;
  const col = f % data.cols;
  const row = Math.floor(f / data.cols);
  return {
    img: data.img,
    sx: col * data.fw,
    sy: row * data.fh,
    sw: data.fw,
    sh: data.fh,
    fw: data.fw,
    fh: data.fh,
  };
}

/** Get total frame count for an animation */
export function getFrameCount(type, anim) {
  const key = `${type}:${anim}`;
  const data = images.get(key);
  return data ? data.count : 0;
}
```

- [ ] **Step 2: Verify sprites load in browser**

Temporarily add to `js/main.js`:

```js
import { loadSprites, getFrame, ANIMAL_TYPES } from './sprites.js';

loadSprites().then(() => {
  console.log('All sprites loaded:', ANIMAL_TYPES.length, 'types');
  // Draw one frame of each to verify
  const ctx2 = canvas.getContext('2d');
  ctx2.imageSmoothingEnabled = false;
  ANIMAL_TYPES.forEach((type, i) => {
    const f = getFrame(type, 'idle', 0);
    if (f) ctx2.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, i * 80 + 10, 100, f.fw * 2, f.fh * 2);
  });
}).catch(err => console.error(err));
```

Open browser, confirm 13 animal idle frames are drawn. Then remove the test code from main.js.

- [ ] **Step 3: Commit**

```bash
git add js/sprites.js
git commit -m "feat: add sprite loader with manifest for 13 animal types"
```

---

### Task 5: Simulation Data Model

**Files:**
- Create: `js/sim.js`
- Create: `tests/sim.test.js`

Core simulation state: animals, elevators, config, tick logic. Pure data + logic, no rendering.

- [ ] **Step 1: Write failing tests for simulation state**

```js
// tests/sim.test.js
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createSim, spawnAnimal, tickSim, SIM_CONSTANTS } from '../js/sim.js';

describe('createSim', () => {
  it('creates simulation with correct defaults', () => {
    const sim = createSim({ floors: 5, elevators: 2, capacity: 6 });
    assert.strictEqual(sim.floors, 5);
    assert.strictEqual(sim.elevators.length, 2);
    assert.strictEqual(sim.capacity, 6);
    assert.deepStrictEqual(sim.animals, []);
    // Elevators start at floor 0 (ground)
    assert.strictEqual(sim.elevators[0].floor, 0);
    assert.strictEqual(sim.elevators[0].direction, 0);
    assert.deepStrictEqual(sim.elevators[0].passengers, []);
    assert.strictEqual(sim.elevators[0].state, 'idle');
  });
});

describe('spawnAnimal', () => {
  it('creates an animal with valid origin and destination', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = spawnAnimal(sim);
    assert.ok(animal.origin >= 0 && animal.origin < 5);
    assert.ok(animal.dest >= 0 && animal.dest < 5);
    assert.notStrictEqual(animal.origin, animal.dest);
    assert.strictEqual(animal.state, 'waiting');
    assert.ok(animal.type); // has an animal type string
  });

  it('respects max waiting cap of 30', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    for (let i = 0; i < 30; i++) spawnAnimal(sim);
    assert.strictEqual(sim.animals.length, 30);
    const result = spawnAnimal(sim);
    assert.strictEqual(result, null);
    assert.strictEqual(sim.animals.length, 30);
  });
});

describe('tickSim', () => {
  it('does not crash with empty sim', () => {
    const sim = createSim({ floors: 5, elevators: 2, capacity: 6 });
    assert.doesNotThrow(() => tickSim(sim, 0.016));
  });

  it('moves elevator toward target floor', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.targets = [3];
    // Tick enough for elevator to start moving
    tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'moving');
    assert.strictEqual(el.direction, 1);
    // Tick until arrival (3 floors at 1.5 floors/sec = 2 seconds)
    for (let i = 0; i < 200; i++) tickSim(sim, 0.016);
    assert.strictEqual(Math.round(el.floor), 3);
  });

  it('transitions through door states at a floor', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.targets = [0]; // already at floor 0
    el.floor = 0;
    tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'doors-opening');
    // Tick through door opening (0.4s)
    for (let i = 0; i < 30; i++) tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'doors-closing');
  });

  it('boards waiting animal with boarding state', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = spawnAnimal(sim);
    animal.origin = 0;
    animal.dest = 3;
    animal.floor = 0;
    animal.direction = 1;
    const el = sim.elevators[0];
    el.floor = 0;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1;
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'boarding');
    // Tick through boarding time
    for (let i = 0; i < 25; i++) tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'riding');
    assert.strictEqual(el.passengers.length, 1);
  });

  it('does not board animal going opposite direction', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = spawnAnimal(sim);
    animal.origin = 2;
    animal.dest = 0;
    animal.floor = 2;
    animal.direction = -1; // wants to go down
    const el = sim.elevators[0];
    el.floor = 2;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1; // elevator going up
    tickSim(sim, 0.016);
    // Animal should NOT board — elevator going wrong direction
    assert.strictEqual(animal.state, 'waiting');
  });

  it('enforces capacity limit', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 2 });
    const el = sim.elevators[0];
    el.floor = 0;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1;
    // Add 2 passengers already (at capacity)
    el.passengers = [{ id: 99, dest: 4 }, { id: 98, dest: 4 }];
    // Spawn a waiting animal at floor 0
    const animal = spawnAnimal(sim);
    animal.origin = 0;
    animal.dest = 3;
    animal.floor = 0;
    animal.direction = 1;
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'waiting'); // should not board
  });

  it('uses sim-time for exit animation (not wall time)', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = spawnAnimal(sim);
    animal.state = 'exiting';
    animal.stateTimer = 0.5; // 0.5s exit timer
    // Tick with sim time — should count down
    tickSim(sim, 0.3);
    assert.strictEqual(animal.state, 'exiting');
    assert.ok(animal.stateTimer < 0.3);
    tickSim(sim, 0.3);
    assert.strictEqual(animal.state, 'done');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/sim.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/sim.js`**

```js
// js/sim.js — Simulation state and tick logic

// Animal type list — no browser dependency. Matches sprites.js MANIFEST keys.
const ANIMAL_TYPES = [
  'cat-black','cat-grey','cat-pinkie','cat-siamese','cat-yellow',
  'dog-base','dog-blackwhite','dog-black','dog-brown','dog-exotic',
  'fox-arctic','fox-red','fox-silver'
];

const MAX_WAITING = 30;

// Simulation constants
export const SIM_CONSTANTS = {
  elevatorSpeed: 1.5,     // floors per second
  doorDuration: 0.4,      // seconds to open or close
  boardingTime: 0.3,      // seconds per animal boarding
  unloadingTime: 0.3,     // seconds per animal unloading
  exitDuration: 0.5,      // seconds for walk-off animation (sim time)
};

export function createSim({ floors, elevators, capacity }) {
  const els = [];
  for (let i = 0; i < elevators; i++) {
    els.push({
      id: i,
      floor: 0,            // continuous float, 0 = ground
      targetFloor: null,    // where it's heading
      direction: 0,         // -1 down, 0 idle, 1 up
      passengers: [],
      state: 'idle',        // idle | moving | doors-opening | loading | doors-closing
      stateTimer: 0,        // countdown for current state
      targets: [],          // floors to visit (set by algorithm)
    });
  }
  return {
    floors,
    capacity,
    elevators: els,
    animals: [],
    time: 0,
    nextAnimalId: 0,
    algorithm: null,        // set externally
  };
}

export function spawnAnimal(sim) {
  const waiting = sim.animals.filter(a => a.state === 'waiting').length;
  if (waiting >= MAX_WAITING) return null;

  const origin = Math.floor(Math.random() * sim.floors);
  let dest = Math.floor(Math.random() * sim.floors);
  while (dest === origin) dest = Math.floor(Math.random() * sim.floors);

  const animal = {
    id: sim.nextAnimalId++,
    type: ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)],
    origin,
    dest,
    direction: dest > origin ? 1 : -1,
    state: 'waiting',    // waiting | boarding | riding | exiting | done
    floor: origin,
    elevator: null,      // elevator id when boarding/riding
    stateTimer: 0,
    waitStart: sim.time,
    animFrame: 0,
    animTimer: 0,
    x: 0,               // horizontal position for walk animation (set by renderer)
  };
  sim.animals.push(animal);
  return animal;
}

export function tickSim(sim, dt) {
  sim.time += dt;

  // Update elevators
  for (const el of sim.elevators) {
    tickElevator(sim, el, dt);
  }

  // Run algorithm to assign targets
  if (sim.algorithm) {
    sim.algorithm(sim);
  }

  // Update animal state timers and animations
  for (const animal of sim.animals) {
    // Boarding countdown — transitions to riding when timer expires
    if (animal.state === 'boarding') {
      animal.stateTimer -= dt;
      if (animal.stateTimer <= 0) {
        animal.state = 'riding';
        const el = sim.elevators.find(e => e.id === animal.elevator);
        if (el) el.passengers.push(animal);
      }
    }

    // Exiting countdown — transitions to done using sim time (not wall time)
    if (animal.state === 'exiting') {
      animal.stateTimer -= dt;
      if (animal.stateTimer <= 0) {
        animal.state = 'done';
      }
    }

    // Sprite animation — tied to sim time via dt
    animal.animTimer += dt;
    if (animal.animTimer > 0.12) {
      animal.animTimer = 0;
      animal.animFrame++;
    }
  }

  // Clean up done animals
  sim.animals = sim.animals.filter(a => a.state !== 'done');
}

function tickElevator(sim, el, dt) {
  switch (el.state) {
    case 'idle':
      // Check if we have targets
      if (el.targets.length > 0) {
        el.targetFloor = el.targets[0];
        if (el.targetFloor === Math.round(el.floor)) {
          // Already at target floor
          el.targets.shift();
          el.state = 'doors-opening';
          el.stateTimer = SIM_CONSTANTS.doorDuration;
        } else {
          el.direction = el.targetFloor > el.floor ? 1 : -1;
          el.state = 'moving';
        }
      }
      break;

    case 'moving': {
      el.floor += el.direction * SIM_CONSTANTS.elevatorSpeed * dt;
      // Check if we've reached or passed the target
      if (el.targetFloor !== null) {
        const reached = el.direction > 0
          ? el.floor >= el.targetFloor
          : el.floor <= el.targetFloor;
        if (reached) {
          el.floor = el.targetFloor;
          el.targets = el.targets.filter(t => t !== el.targetFloor);
          el.state = 'doors-opening';
          el.stateTimer = SIM_CONSTANTS.doorDuration;
        }
      }
      break;
    }

    case 'doors-opening':
      el.stateTimer -= dt;
      if (el.stateTimer <= 0) {
        el.state = 'loading';
        el.stateTimer = 0;
      }
      break;

    case 'loading': {
      const currentFloor = Math.round(el.floor);

      // Unload passengers whose destination is this floor
      const exiting = el.passengers.filter(a => a.dest === currentFloor);
      if (exiting.length > 0 && el.stateTimer <= 0) {
        const animal = exiting[0];
        animal.state = 'exiting';
        animal.stateTimer = SIM_CONSTANTS.exitDuration; // sim-time exit timer
        animal.elevator = null;
        animal.floor = currentFloor;
        el.passengers = el.passengers.filter(a => a.id !== animal.id);
        el.stateTimer = SIM_CONSTANTS.unloadingTime;
        break;
      }

      // Board waiting animals — direction-aware:
      // Only board animals going in the elevator's current direction,
      // or any direction if the elevator is idle (direction === 0)
      const waiting = sim.animals.filter(a =>
        a.state === 'waiting' &&
        a.origin === currentFloor &&
        el.passengers.length < sim.capacity &&
        (el.direction === 0 || a.direction === el.direction)
      );
      if (waiting.length > 0 && el.stateTimer <= 0) {
        const animal = waiting[0];
        animal.state = 'boarding';       // boarding state per spec lifecycle
        animal.stateTimer = SIM_CONSTANTS.boardingTime;
        animal.elevator = el.id;
        // Note: animal is added to el.passengers when boarding completes (in tickSim)
        // Add destination to targets if not already there
        if (!el.targets.includes(animal.dest)) {
          el.targets.push(animal.dest);
          el.targets.sort((a, b) => el.direction >= 0 ? a - b : b - a);
        }
        el.stateTimer = SIM_CONSTANTS.boardingTime;
        break;
      }

      // Nothing left to load/unload — close doors
      if (el.stateTimer <= 0) {
        el.state = 'doors-closing';
        el.stateTimer = SIM_CONSTANTS.doorDuration;
      } else {
        el.stateTimer -= dt;
      }
      break;
    }

    case 'doors-closing':
      el.stateTimer -= dt;
      if (el.stateTimer <= 0) {
        if (el.targets.length > 0) {
          el.targetFloor = el.targets[0];
          el.direction = el.targetFloor > el.floor ? 1 : -1;
          el.state = 'moving';
        } else {
          el.direction = 0;
          el.state = 'idle';
        }
      }
      break;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tests/sim.test.js
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add js/sim.js tests/sim.test.js
git commit -m "feat: add simulation engine with animal/elevator lifecycle"
```

---

### Task 6: SCAN Algorithm

**Files:**
- Create: `js/algorithms/scan.js`
- Create: `js/algorithms/index.js`
- Create: `tests/algorithms.test.js`

- [ ] **Step 1: Write failing tests (SCAN only — nearest/roundrobin added in their tasks)**

```js
// tests/algorithms.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanAlgorithm } from '../js/algorithms/scan.js';

function makeSim(overrides = {}) {
  return {
    floors: 10,
    capacity: 6,
    elevators: [{
      id: 0, floor: 0, direction: 0, passengers: [],
      state: 'idle', targets: [], targetFloor: null, stateTimer: 0,
    }],
    animals: [],
    ...overrides,
  };
}
// Export makeSim for use by later test additions
export { makeSim };

describe('SCAN algorithm', () => {
  it('assigns waiting animal floors as targets', () => {
    const sim = makeSim();
    sim.animals.push({ id: 0, origin: 3, dest: 7, state: 'waiting', direction: 1 });
    scanAlgorithm(sim);
    assert.ok(sim.elevators[0].targets.includes(3), 'Should target pickup floor');
  });

  it('does nothing with no waiting animals', () => {
    const sim = makeSim();
    scanAlgorithm(sim);
    assert.deepStrictEqual(sim.elevators[0].targets, []);
  });

  it('maintains direction until no more requests that way', () => {
    const sim = makeSim();
    sim.elevators[0].direction = 1;
    sim.elevators[0].floor = 3;
    sim.animals.push(
      { id: 0, origin: 5, dest: 8, state: 'waiting', direction: 1 },
      { id: 1, origin: 1, dest: 0, state: 'waiting', direction: -1 },
    );
    scanAlgorithm(sim);
    // Should prioritize floor 5 (in current direction) over floor 1
    assert.strictEqual(sim.elevators[0].targets[0], 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/algorithms.test.js
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `js/algorithms/scan.js`**

```js
// js/algorithms/scan.js — SCAN (elevator) algorithm
//
// Each waiting animal is assigned to exactly one elevator (the nearest idle
// or heading-toward elevator). Each elevator then sorts its targets in SCAN
// order: service everything in the current direction, then reverse.

export function scanAlgorithm(sim) {
  const waiting = sim.animals.filter(a => a.state === 'waiting');

  // Ensure passenger destinations are in targets
  for (const el of sim.elevators) {
    for (const p of el.passengers) {
      if (!el.targets.includes(p.dest)) el.targets.push(p.dest);
    }
  }

  // Assign each unserviced waiting animal to best elevator
  for (const animal of waiting) {
    if (animalAssigned(sim, animal)) continue;

    // Pick closest elevator, preferring one heading toward the animal
    let bestEl = null;
    let bestScore = Infinity;
    for (const el of sim.elevators) {
      const dist = Math.abs(el.floor - animal.origin);
      const headingToward = el.direction === 0 ||
        (el.direction > 0 && animal.origin >= el.floor) ||
        (el.direction < 0 && animal.origin <= el.floor);
      const score = headingToward ? dist : dist + sim.floors;
      if (score < bestScore) { bestScore = score; bestEl = el; }
    }
    if (bestEl && !bestEl.targets.includes(animal.origin)) {
      bestEl.targets.push(animal.origin);
    }
  }

  // Sort each elevator's targets in SCAN order
  for (const el of sim.elevators) {
    if (el.targets.length === 0) continue;
    const dir = el.direction || 1;
    const ahead = el.targets.filter(f => dir > 0 ? f >= el.floor : f <= el.floor);
    const behind = el.targets.filter(f => dir > 0 ? f < el.floor : f > el.floor);
    ahead.sort((a, b) => dir > 0 ? a - b : b - a);
    behind.sort((a, b) => dir > 0 ? a - b : b - a);
    el.targets = [...ahead, ...behind];
    if (el.direction === 0) {
      el.direction = el.targets[0] >= el.floor ? 1 : -1;
    }
  }
}

function animalAssigned(sim, animal) {
  return sim.elevators.some(el =>
    el.targets.includes(animal.origin) ||
    el.passengers.some(p => p.id === animal.id)
  );
}
```

- [ ] **Step 4: Create `js/algorithms/index.js` (initially only SCAN)**

```js
// js/algorithms/index.js — Algorithm registry
// nearest and roundrobin added in Tasks 7 and 8

import { scanAlgorithm } from './scan.js';

export const algorithms = {
  scan: scanAlgorithm,
  nearest: scanAlgorithm,     // placeholder — replaced in Task 7
  roundrobin: scanAlgorithm,  // placeholder — replaced in Task 8
};
```

- [ ] **Step 5: Run SCAN tests**

```bash
node --test tests/algorithms.test.js
```

Expected: All SCAN tests PASS.

- [ ] **Step 6: Commit**

```bash
git add js/algorithms/scan.js js/algorithms/index.js tests/algorithms.test.js
git commit -m "feat: add SCAN elevator algorithm with tests"
```

---

### Task 7: Nearest Car Algorithm

**Files:**
- Create: `js/algorithms/nearest.js`

- [ ] **Step 1: Add import and tests to `tests/algorithms.test.js`**

Add the import at the top of the file and append the test:

```js
// Add this import at top of file, after the scan import:
import { nearestCarAlgorithm } from '../js/algorithms/nearest.js';
```

Append to the existing test file:

```js
describe('Nearest Car algorithm', () => {
  it('assigns animal to closest elevator', () => {
    const sim = makeSim({
      elevators: [
        { id: 0, floor: 1, direction: 0, passengers: [], state: 'idle', targets: [], targetFloor: null, stateTimer: 0 },
        { id: 1, floor: 8, direction: 0, passengers: [], state: 'idle', targets: [], targetFloor: null, stateTimer: 0 },
      ],
    });
    sim.animals.push({ id: 0, origin: 2, dest: 5, state: 'waiting', direction: 1 });
    nearestCarAlgorithm(sim);
    assert.ok(sim.elevators[0].targets.includes(2), 'Elevator 0 (floor 1) should get the request');
    assert.ok(!sim.elevators[1].targets.includes(2), 'Elevator 1 (floor 8) should not');
  });
});
```

- [ ] **Step 1b: Update `js/algorithms/index.js` to use nearestCarAlgorithm**

Replace the nearest placeholder:

```js
import { scanAlgorithm } from './scan.js';
import { nearestCarAlgorithm } from './nearest.js';

export const algorithms = {
  scan: scanAlgorithm,
  nearest: nearestCarAlgorithm,
  roundrobin: scanAlgorithm,  // placeholder — replaced in Task 8
};
```

- [ ] **Step 2: Implement `js/algorithms/nearest.js`**

```js
// js/algorithms/nearest.js — Nearest Car algorithm

export function nearestCarAlgorithm(sim) {
  const waiting = sim.animals.filter(a => a.state === 'waiting');

  // Ensure passenger destinations are in targets
  for (const el of sim.elevators) {
    for (const p of el.passengers) {
      if (!el.targets.includes(p.dest)) {
        el.targets.push(p.dest);
      }
    }
  }

  for (const animal of waiting) {
    // Skip if already assigned
    if (sim.elevators.some(el => el.targets.includes(animal.origin))) continue;

    // Find nearest elevator (prefer idle, then heading-toward)
    let bestEl = null;
    let bestDist = Infinity;

    for (const el of sim.elevators) {
      if (el.passengers.length >= sim.capacity) continue;

      const dist = Math.abs(el.floor - animal.origin);
      const headingToward = el.direction === 0 ||
        (el.direction > 0 && animal.origin >= el.floor) ||
        (el.direction < 0 && animal.origin <= el.floor);

      const score = headingToward ? dist : dist + sim.floors; // penalize wrong direction

      if (score < bestDist) {
        bestDist = score;
        bestEl = el;
      }
    }

    if (bestEl) {
      if (!bestEl.targets.includes(animal.origin)) {
        bestEl.targets.push(animal.origin);
      }
      // Sort targets in current travel direction
      const dir = bestEl.direction || 1;
      bestEl.targets.sort((a, b) => dir > 0 ? a - b : b - a);
    }
  }
}
```

- [ ] **Step 3: Run tests**

```bash
node --test tests/algorithms.test.js
```

Expected: All SCAN and Nearest Car tests PASS.

- [ ] **Step 4: Commit**

```bash
git add js/algorithms/nearest.js tests/algorithms.test.js
git commit -m "feat: add Nearest Car algorithm"
```

---

### Task 8: Round Robin Algorithm

**Files:**
- Create: `js/algorithms/roundrobin.js`

- [ ] **Step 1: Add import and tests to `tests/algorithms.test.js`**

Add the import at the top and append the test:

```js
// Add this import at top of file, after nearest import:
import { roundRobinAlgorithm, resetRoundRobin } from '../js/algorithms/roundrobin.js';
```

Append:

```js
describe('Round Robin algorithm', () => {
  it('distributes animals across elevators evenly', () => {
    resetRoundRobin(); // ensure clean state
    const sim = makeSim({
      elevators: [
        { id: 0, floor: 0, direction: 0, passengers: [], state: 'idle', targets: [], targetFloor: null, stateTimer: 0 },
        { id: 1, floor: 0, direction: 0, passengers: [], state: 'idle', targets: [], targetFloor: null, stateTimer: 0 },
      ],
    });
    sim.animals.push(
      { id: 0, origin: 2, dest: 5, state: 'waiting', direction: 1 },
      { id: 1, origin: 3, dest: 1, state: 'waiting', direction: -1 },
    );
    roundRobinAlgorithm(sim);
    // One animal per elevator
    assert.ok(sim.elevators[0].targets.length > 0);
    assert.ok(sim.elevators[1].targets.length > 0);
  });
});
```

- [ ] **Step 1b: Update `js/algorithms/index.js` to use all three algorithms**

```js
import { scanAlgorithm } from './scan.js';
import { nearestCarAlgorithm } from './nearest.js';
import { roundRobinAlgorithm } from './roundrobin.js';

export const algorithms = {
  scan: scanAlgorithm,
  nearest: nearestCarAlgorithm,
  roundrobin: roundRobinAlgorithm,
};
```

- [ ] **Step 2: Implement `js/algorithms/roundrobin.js`**

```js
// js/algorithms/roundrobin.js — Round Robin algorithm

let rrIndex = 0;

/** Reset round-robin counter (call on sim reset) */
export function resetRoundRobin() { rrIndex = 0; }

export function roundRobinAlgorithm(sim) {
  const waiting = sim.animals.filter(a => a.state === 'waiting');

  // Ensure passenger destinations are in targets
  for (const el of sim.elevators) {
    for (const p of el.passengers) {
      if (!el.targets.includes(p.dest)) {
        el.targets.push(p.dest);
      }
    }
  }

  for (const animal of waiting) {
    // Skip if already assigned
    if (sim.elevators.some(el => el.targets.includes(animal.origin))) continue;

    // Assign to next elevator in round-robin order
    const el = sim.elevators[rrIndex % sim.elevators.length];
    rrIndex++;

    if (!el.targets.includes(animal.origin)) {
      el.targets.push(animal.origin);
    }

    // Each elevator uses SCAN-like ordering for its own queue
    const dir = el.direction || 1;
    el.targets.sort((a, b) => dir > 0 ? a - b : b - a);
  }
}
```

- [ ] **Step 3: Run all algorithm tests**

```bash
node --test tests/algorithms.test.js
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add js/algorithms/roundrobin.js tests/algorithms.test.js
git commit -m "feat: add Round Robin algorithm"
```

---

### Task 9: Canvas Renderer

**Files:**
- Create: `js/renderer.js`

The renderer draws the building cross-section: floors, shafts, elevator cars, animals. No tests — pure Canvas API.

- [ ] **Step 1: Create `js/renderer.js`**

```js
// js/renderer.js — Canvas rendering for the elevator simulation

import { getFrame } from './sprites.js';

// Layout constants
const FLOOR_HEIGHT = 80;       // pixels per floor (at 1x)
const SHAFT_WIDTH = 70;        // pixels per elevator shaft
const FLOOR_LABEL_WIDTH = 40;  // left margin for floor numbers
const WAITING_AREA_WIDTH = 100; // space for animals waiting
const CAR_WIDTH = 50;
const CAR_HEIGHT = 60;
const SPRITE_SCALE = 2;
const ANIMAL_SPACING = 20;

export function getLayout(sim) {
  const buildingWidth = FLOOR_LABEL_WIDTH + WAITING_AREA_WIDTH + sim.elevators.length * SHAFT_WIDTH + 20;
  const buildingHeight = sim.floors * FLOOR_HEIGHT;
  return { buildingWidth, buildingHeight, FLOOR_HEIGHT, SHAFT_WIDTH, FLOOR_LABEL_WIDTH, WAITING_AREA_WIDTH };
}

export function render(ctx, sim, canvasW, canvasH, scrollY) {
  const dpr = window.devicePixelRatio || 1;
  const scale = dpr >= 2 ? 4 : 2; // sprite scale: 2x native, 4x on high-DPI

  const layout = getLayout(sim);

  ctx.save();
  ctx.translate(0, -scrollY);

  // Draw from bottom up: floor 0 at bottom of building
  drawBuilding(ctx, sim, layout, canvasW);
  drawElevators(ctx, sim, layout);
  drawAnimals(ctx, sim, layout, scale);

  ctx.restore();
}

function floorY(floor, layout) {
  // Floor 0 is at bottom. Y increases downward in canvas.
  // We need to invert: higher floors have lower Y values.
  return (layout.buildingHeight) - (floor + 1) * layout.FLOOR_HEIGHT;
}

function drawBuilding(ctx, sim, layout, canvasW) {
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvasW, layout.buildingHeight + 40);

  for (let f = 0; f < sim.floors; f++) {
    const y = floorY(f, layout);

    // Floor slab
    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(layout.FLOOR_LABEL_WIDTH, y + layout.FLOOR_HEIGHT - 6, canvasW - layout.FLOOR_LABEL_WIDTH, 6);

    // Floor number
    ctx.fillStyle = '#8888aa';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${f + 1}`, layout.FLOOR_LABEL_WIDTH - 8, y + layout.FLOOR_HEIGHT / 2 + 5);

    // Waiting area background
    ctx.fillStyle = '#16213e';
    ctx.fillRect(layout.FLOOR_LABEL_WIDTH, y, layout.WAITING_AREA_WIDTH, layout.FLOOR_HEIGHT - 6);
  }

  // Elevator shaft backgrounds
  const shaftStartX = layout.FLOOR_LABEL_WIDTH + layout.WAITING_AREA_WIDTH;
  for (let i = 0; i < sim.elevators.length; i++) {
    const sx = shaftStartX + i * layout.SHAFT_WIDTH;
    ctx.fillStyle = '#0f1a30';
    ctx.fillRect(sx, 0, layout.SHAFT_WIDTH, layout.buildingHeight);
    // Shaft walls
    ctx.strokeStyle = '#333366';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, 0, layout.SHAFT_WIDTH, layout.buildingHeight);
  }
}

function drawElevators(ctx, sim, layout) {
  const shaftStartX = layout.FLOOR_LABEL_WIDTH + layout.WAITING_AREA_WIDTH;

  for (const el of sim.elevators) {
    const sx = shaftStartX + el.id * layout.SHAFT_WIDTH;
    const y = floorY(el.floor, layout);
    const carX = sx + (layout.SHAFT_WIDTH - CAR_WIDTH) / 2;
    const carY = y + (layout.FLOOR_HEIGHT - CAR_HEIGHT) / 2;

    // Elevator car body
    ctx.fillStyle = '#533483';
    ctx.fillRect(carX, carY, CAR_WIDTH, CAR_HEIGHT);

    // Door visualization
    const doorOpen = el.state === 'loading' || el.state === 'doors-opening' || el.state === 'doors-closing';
    if (doorOpen) {
      // Open doors — gap in the middle
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(carX + 8, carY + 4, CAR_WIDTH - 16, CAR_HEIGHT - 8);
    } else {
      // Closed doors — line down center
      ctx.strokeStyle = '#6a0572';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(carX + CAR_WIDTH / 2, carY + 4);
      ctx.lineTo(carX + CAR_WIDTH / 2, carY + CAR_HEIGHT - 4);
      ctx.stroke();
    }

    // Passenger count
    if (el.passengers.length > 0) {
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${el.passengers.length}`, carX + CAR_WIDTH / 2, carY - 4);
    }
  }
}

function drawAnimals(ctx, sim, layout, scale) {
  ctx.imageSmoothingEnabled = false;

  // Group waiting animals by floor
  const waitingByFloor = {};
  for (const animal of sim.animals) {
    if (animal.state === 'waiting' || animal.state === 'exiting') {
      const f = animal.state === 'waiting' ? animal.origin : animal.dest;
      if (!waitingByFloor[f]) waitingByFloor[f] = [];
      waitingByFloor[f].push(animal);
    }
  }

  // Draw waiting/exiting animals
  for (const [floor, animals] of Object.entries(waitingByFloor)) {
    const y = floorY(Number(floor), layout);
    animals.forEach((animal, i) => {
      const anim = animal.state === 'waiting' ? 'idle' : 'walk';
      const frame = getFrame(animal.type, anim, animal.animFrame);
      if (!frame) return;

      const ax = layout.FLOOR_LABEL_WIDTH + 8 + i * ANIMAL_SPACING;
      const ay = y + layout.FLOOR_HEIGHT - 6 - frame.fh * SPRITE_SCALE;

      ctx.drawImage(
        frame.img,
        frame.sx, frame.sy, frame.sw, frame.sh,
        ax, ay, frame.fw * SPRITE_SCALE, frame.fh * SPRITE_SCALE
      );

      // Direction arrow
      ctx.fillStyle = animal.direction > 0 ? '#4ade80' : '#f87171';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(animal.direction > 0 ? '\u25B2' : '\u25BC', ax + frame.fw * SPRITE_SCALE / 2, ay - 2);
    });
  }
}
```

- [ ] **Step 2: Verify renders in browser (will integrate in Task 10)**

This will be verified when `main.js` ties everything together in Task 10.

- [ ] **Step 3: Commit**

```bash
git add js/renderer.js
git commit -m "feat: add canvas renderer for building, elevators, and animals"
```

---

### Task 10: Control Strip Wiring

**Files:**
- Create: `js/controls.js`

Wires HTML inputs to simulation state. Handles play/pause/step/reset and live parameter changes.

- [ ] **Step 1: Create `js/controls.js`**

```js
// js/controls.js — Wire control strip inputs to simulation state

import { createSim, spawnAnimal } from './sim.js';
import { algorithms } from './algorithms/index.js';

export function setupControls(callbacks) {
  const els = {
    btnPlay: document.getElementById('btn-play'),
    btnStep: document.getElementById('btn-step'),
    btnReset: document.getElementById('btn-reset'),
    btnSpawn: document.getElementById('btn-spawn'),
    speed: document.getElementById('speed'),
    speedVal: document.getElementById('speed-val'),
    floors: document.getElementById('floors'),
    elevators: document.getElementById('elevators'),
    capacity: document.getElementById('capacity'),
    spawnRate: document.getElementById('spawn-rate'),
    algorithm: document.getElementById('algorithm'),
  };

  let paused = true;

  els.btnPlay.addEventListener('click', () => {
    paused = !paused;
    els.btnPlay.textContent = paused ? '\u25B6' : '\u23F8';
    callbacks.onPauseToggle(paused);
  });

  els.btnStep.addEventListener('click', () => {
    callbacks.onStep();
  });

  els.speed.addEventListener('input', () => {
    const val = parseFloat(els.speed.value);
    els.speedVal.textContent = `${val}x`;
    callbacks.onSpeedChange(val);
  });

  els.btnReset.addEventListener('click', () => {
    paused = true;
    els.btnPlay.textContent = '\u25B6';
    callbacks.onReset(getConfig());
  });

  // Config changes that trigger reset
  for (const input of [els.floors, els.elevators, els.capacity]) {
    input.addEventListener('change', () => {
      paused = true;
      els.btnPlay.textContent = '\u25B6';
      callbacks.onReset(getConfig());
    });
  }

  // Live adjustments
  els.spawnRate.addEventListener('input', () => {
    // Slider 0-100 maps to threshold 0.9-0.3
    const val = parseInt(els.spawnRate.value);
    const threshold = 0.9 - (val / 100) * 0.6;
    callbacks.onSpawnRateChange(threshold);
  });

  els.algorithm.addEventListener('change', () => {
    callbacks.onAlgorithmChange(els.algorithm.value);
  });

  els.btnSpawn.addEventListener('click', () => {
    callbacks.onManualSpawn();
  });

  function getConfig() {
    return {
      floors: parseInt(els.floors.value),
      elevators: parseInt(els.elevators.value),
      capacity: parseInt(els.capacity.value),
      algorithm: els.algorithm.value,
    };
  }

  // Return initial config
  return {
    config: getConfig(),
    paused,
    speed: parseFloat(els.speed.value),
    spawnThreshold: 0.9 - (parseInt(els.spawnRate.value) / 100) * 0.6,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add js/controls.js
git commit -m "feat: add control strip wiring"
```

---

### Task 11: Game Loop & Integration

**Files:**
- Modify: `js/main.js` (replace placeholder)

Ties everything together: sprite loading, sim creation, game loop (rAF), Perlin noise spawning, rendering.

- [ ] **Step 1: Rewrite `js/main.js`**

```js
// js/main.js — Bootstrap, game loop, integration

import { loadSprites } from './sprites.js';
import { createSim, spawnAnimal, tickSim } from './sim.js';
import { perlin1d, seedPerlin } from './perlin.js';
import { algorithms } from './algorithms/index.js';
import { resetRoundRobin } from './algorithms/roundrobin.js';
import { render, getLayout } from './renderer.js';
import { setupControls } from './controls.js';

const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');

let sim = null;
let paused = true;
let speed = 1;
let spawnThreshold = 0.6;
let scrollY = 0;
let lastTime = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resetSim(config) {
  sim = createSim(config);
  sim.algorithm = algorithms[config.algorithm] || algorithms.scan;
  seedPerlin(Date.now());
  resetRoundRobin(); // reset round-robin counter on sim reset
  scrollY = 0;
}

function gameLoop(now) {
  const dt = lastTime ? (now - lastTime) / 1000 : 0;
  lastTime = now;

  if (sim) {
    if (!paused) {
      const simDt = dt * speed;

      // Perlin noise spawning
      const noise = perlin1d(sim.time * 0.5);
      if (noise > spawnThreshold) {
        spawnAnimal(sim);
      }

      tickSim(sim, simDt);
    }

    // Render always (even when paused)
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    render(ctx, sim, canvas.clientWidth, canvas.clientHeight, scrollY);
  }

  requestAnimationFrame(gameLoop);
}

// Scroll handling
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (!sim) return;
  const layout = getLayout(sim);
  const maxScroll = Math.max(0, layout.buildingHeight - canvas.clientHeight);
  scrollY = Math.max(0, Math.min(maxScroll, scrollY + e.deltaY));
}, { passive: false });

async function init() {
  resize();
  window.addEventListener('resize', resize);

  await loadSprites();

  const initial = setupControls({
    onPauseToggle: (p) => { paused = p; },
    onStep: () => {
      if (sim && paused) {
        const simDt = (1 / 60) * speed;
        const noise = perlin1d(sim.time * 0.5);
        if (noise > spawnThreshold) spawnAnimal(sim);
        tickSim(sim, simDt);
      }
    },
    onSpeedChange: (s) => { speed = s; },
    onReset: (config) => {
      resetSim(config);
      paused = true;
    },
    onSpawnRateChange: (threshold) => { spawnThreshold = threshold; },
    onAlgorithmChange: (name) => {
      if (sim) sim.algorithm = algorithms[name] || algorithms.scan;
    },
    onManualSpawn: () => {
      if (sim) spawnAnimal(sim);
    },
  });

  resetSim(initial.config);
  paused = initial.paused;
  speed = initial.speed;
  spawnThreshold = initial.spawnThreshold;

  requestAnimationFrame(gameLoop);
}

init().catch(console.error);
```

- [ ] **Step 2: Open in browser and verify full integration**

Open `index.html`. Confirm:
- Control strip is visible with all inputs
- Building renders with 5 floors, 2 elevator shafts
- Elevator cars visible at ground floor
- Press Play — simulation starts, animals begin spawning
- Animals appear as pixel art sprites on floors
- Elevators move to pick up and deliver animals
- Pause/Step/Reset all work
- Changing floors/elevators triggers reset
- Speed slider changes simulation speed
- Algorithm dropdown switches behavior
- Spawn Animal button adds an animal immediately
- Scroll works if floors > viewport height

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: integrate game loop, controls, and rendering"
```

---

### Task 12: Polish & Bug Fixes

**Files:**
- Modify: various (as needed based on browser testing)

This task is for issues discovered during integration testing in Task 11.

- [ ] **Step 1: Browser test all control combinations**

Test matrix:
- 2 floors / 1 elevator → minimal case
- 50 floors / 8 elevators → stress test + scroll
- Each algorithm (SCAN, Nearest, Round Robin)
- Speed 0.5x and 5x
- Spawn rate min and max
- Rapid play/pause/step toggling
- Reset while elevators are in motion

- [ ] **Step 2: Fix any issues found**

Address rendering glitches, animation timing, edge cases.

- [ ] **Step 3: Run all tests**

```bash
node --test tests/perlin.test.js tests/sim.test.js tests/algorithms.test.js
```

Expected: All tests PASS.

- [ ] **Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: polish and bug fixes from integration testing"
```

---

### Task 13: GitHub Pages Setup

**Files:**
- Modify: git config for GitHub Pages

- [ ] **Step 1: Add `.gitignore`**

```
# Extracted source assets (not needed for deployment)
cats/
dogs/
foxes/
*.rar
```

- [ ] **Step 2: Verify the site works from file system**

Open `index.html` directly — confirm everything works with relative paths.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore for source asset archives"
```

- [ ] **Step 4: Rename branch to `main` and create GitHub repo**

```bash
git branch -m mian main
gh repo create elevation --public --source=. --push
```

- [ ] **Step 5: Enable GitHub Pages**

```bash
gh api repos/{owner}/elevation/pages -X POST -f source.branch=main -f source.path=/
```

Or: Settings → Pages → Source: Deploy from branch `main` / root.

- [ ] **Step 6: Verify live site**

Open the GitHub Pages URL and confirm the simulator works.
