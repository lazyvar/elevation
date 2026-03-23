// js/main.js — Bootstrap, game loop, integration

import { loadSprites } from './sprites.js';
import { createSim, spawnAnimal, tickSim } from './sim.js';
import { perlin1d, seedPerlin } from './perlin.js';
import { algorithms } from './algorithms/index.js';
import { resetRoundRobin } from './algorithms/roundrobin.js';
import { render, getLayout, canvasYToFloor, isWaitingArea } from './renderer.js';
import { setupControls } from './controls.js';
import { logAnimalEvent, logEvent, clearLog } from './eventlog.js';

// Generate favicon from first frame of yellow cat idle sprite
{
  const img = new Image();
  img.src = 'assets/sprites/cats/yellow-idle.png';
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(img, 0, 0, 64, 64, 0, 0, 32, 32);
    document.getElementById('favicon').href = c.toDataURL('image/png');
  };
}

const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');

let sim = null;
let paused = true;
let speed = 1;
let spawnThreshold = 0.6;
let scrollY = 0;
let lastTime = 0;
let spawnCooldown = 0;
let hoveredFloor = -1;

// Track previous states for event detection
let prevAnimalStates = new Map();
let prevElevatorStates = new Map();

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
  resetRoundRobin();
  scrollY = -1; // sentinel: will be set to bottom on first render frame
  prevAnimalStates.clear();
  prevElevatorStates.clear();
  clearLog();

  // Pre-spawn a batch of animals
  const initialCount = Math.min(sim.floors * 2, 20);
  for (let i = 0; i < initialCount; i++) {
    spawnAnimal(sim);
  }
  detectEvents();
}

function detectEvents() {
  if (!sim) return;

  // Animal events
  for (const animal of sim.animals) {
    const prev = prevAnimalStates.get(animal.id);
    const state = animal.state;

    if (!prev) {
      logAnimalEvent(animal, `spawned on floor ${animal.origin + 1}, wants floor ${animal.dest + 1}`);
    } else if (prev !== state) {
      if (state === 'boarding') {
        logAnimalEvent(animal, `boarding elevator ${animal.elevator}`);
      } else if (state === 'riding') {
        logAnimalEvent(animal, `riding to floor ${animal.dest + 1}`);
      } else if (state === 'done') {
        logAnimalEvent(animal, `arrived at floor ${animal.dest + 1}`);
      }
    }
    prevAnimalStates.set(animal.id, state);
  }

  // Clean up removed animals
  const activeIds = new Set(sim.animals.map(a => a.id));
  for (const id of prevAnimalStates.keys()) {
    if (!activeIds.has(id)) prevAnimalStates.delete(id);
  }

  // Elevator events
  for (const el of sim.elevators) {
    const prev = prevElevatorStates.get(el.id);
    const state = el.state;

    if (prev && prev !== state) {
      if (state === 'moving') {
        logEvent('elevator', el.id, `moving to floor ${(el.targets[0] ?? Math.round(el.floor)) + 1}`);
      } else if (state === 'doors-opening') {
        logEvent('elevator', el.id, `stopped at floor ${Math.round(el.floor) + 1}`);
      }
    }
    prevElevatorStates.set(el.id, state);
  }
}

function gameLoop(now) {
  const dt = lastTime ? (now - lastTime) / 1000 : 0;
  lastTime = now;

  if (sim) {
    if (!paused) {
      const simDt = dt * speed;

      // Perlin noise spawning with cooldown
      spawnCooldown -= simDt;
      if (spawnCooldown <= 0) {
        const noise = perlin1d(sim.time * 0.5);
        if (noise > spawnThreshold) {
          spawnAnimal(sim);
          spawnCooldown = 2.0;
        }
      }

      tickSim(sim, simDt);
      detectEvents();
    }

    // Keep canvas buffer in sync with CSS size
    resize();

    // On first frame after reset, scroll to bottom so floor 1 is visible
    if (scrollY < 0) {
      const layout = getLayout(sim);
      scrollY = Math.max(0, layout.buildingHeight - canvas.clientHeight);
    }

    // Render always (even when paused)
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    render(ctx, sim, canvas.clientWidth, canvas.clientHeight, scrollY, hoveredFloor);
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

// Floor hover and click-to-spawn
canvas.addEventListener('mousemove', (e) => {
  if (!sim) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (isWaitingArea(x, sim)) {
    hoveredFloor = canvasYToFloor(y, sim, canvas.clientHeight, scrollY);
    canvas.style.cursor = hoveredFloor >= 0 ? 'pointer' : '';
  } else {
    hoveredFloor = -1;
    canvas.style.cursor = '';
  }
});

canvas.addEventListener('mouseleave', () => {
  hoveredFloor = -1;
  canvas.style.cursor = '';
});

canvas.addEventListener('click', (e) => {
  if (!sim || hoveredFloor < 0) return;
  const animal = spawnAnimal(sim, hoveredFloor);
  if (animal) detectEvents();
});

// Draggable event log resize handle
{
  const handle = document.getElementById('log-resize-handle');
  const log = document.getElementById('event-log');
  let dragging = false;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    dragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const newWidth = window.innerWidth - e.clientX - handle.offsetWidth / 2;
    log.style.width = Math.max(100, Math.min(600, newWidth)) + 'px';
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

async function init() {
  resize();
  window.addEventListener('resize', resize);

  try {
    await loadSprites();
  } catch (err) {
    console.warn('Sprite loading failed (are you using a local server?). Falling back to shapes.', err);
  }

  const initial = setupControls({
    onPauseToggle: (p) => { paused = p; },
    onStep: () => {
      if (sim && paused) {
        const simDt = (1 / 60) * speed;
        spawnCooldown -= simDt;
        if (spawnCooldown <= 0) {
          const noise = perlin1d(sim.time * 0.5);
          if (noise > spawnThreshold) { spawnAnimal(sim); spawnCooldown = 2.0; }
        }
        tickSim(sim, simDt);
        detectEvents();
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
      if (sim) {
        spawnAnimal(sim);
        detectEvents();
      }
    },
    onClearAnimals: () => {
      if (sim) {
        sim.animals = sim.animals.filter(a => a.state !== 'waiting');
        for (const el of sim.elevators) {
          el.targets = [];
        }
      }
    },
  });

  resetSim(initial.config);
  paused = initial.paused;
  speed = initial.speed;
  spawnThreshold = initial.spawnThreshold;

  logEvent('elevator', '~', 'Welcome to Elevation! Press <a href="#" class="log-play-link">Play</a> to start the simulation.');
  document.getElementById('event-log').querySelector('.log-play-link').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('btn-play').click();
  });

  requestAnimationFrame(gameLoop);
}

init().catch(console.error);
