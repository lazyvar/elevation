# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Elevator simulator — a browser-based pixel-art visualization comparing three elevator scheduling algorithms (SCAN, Nearest Car, Round Robin). Vanilla JavaScript, zero dependencies, no build step.

## Development

**Run locally:** Serve the project root with any static HTTP server (e.g., `python3 -m http.server`). Open `index.html` in browser.

**Run tests:**
```bash
node --test tests/*.test.js
```

Tests use Node's built-in `node:test` module. Test files: `sim.test.js`, `algorithms.test.js`, `perlin.test.js`.

## Architecture

Static SPA: `index.html` → ES modules in `js/`, styles in `css/style.css`, sprite sheets in `assets/sprites/`.

### Core Modules

- **`js/main.js`** — Bootstrap, `requestAnimationFrame` game loop, state change detection for event logging, scroll handling
- **`js/sim.js`** — Tick-based simulation engine. `createSim(config)` initializes state, `tickSim(sim, dt)` advances it. Manages animal lifecycle (Waiting→Boarding→Riding→Exiting→Done) and elevator lifecycle (Idle→Moving→Doors→Loading→Closing)
- **`js/renderer.js`** — Canvas rendering with pixel-art scaling (`imageSmoothingEnabled = false`). Draws building, floors, elevator shafts, animated sprites. Falls back to colored rectangles if sprites fail to load
- **`js/sprites.js`** — Sprite sheet loader and frame extraction. Manifest defines 13 animal types (5 cats, 5 dogs, 3 foxes) with walk/idle animations
- **`js/algorithms/`** — Scheduling strategies, each exporting a function `(sim) => void`. Registered in `algorithms/index.js`. Swappable at runtime
- **`js/controls.js`** — Wires HTML inputs to simulation config. Changing floors/elevators/capacity resets the simulation
- **`js/eventlog.js`** — Color-coded state transition log, auto-scrolls, prunes to 200 entries
- **`js/perlin.js`** — Seeded 1D Perlin noise for organic spawn timing

### Key Constants (sim.js)

Elevator speed: 1.5 floors/sec, door duration: 0.4s, boarding time: 0.3s/animal, max 30 waiting animals.

### Sync Requirements

`ANIMAL_TYPES` in `sim.js` and the sprite manifest in `sprites.js` must stay in sync — both define the set of available animal types.

## Design Spec & Plan

- `docs/superpowers/specs/2026-03-23-elevator-simulator-design.md` — Full design specification
- `docs/superpowers/plans/2026-03-23-elevator-simulator.md` — Implementation plan
