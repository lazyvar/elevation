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
  resetRoundRobin();
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
