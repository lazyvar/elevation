# Elevator Simulator — Design Spec

## Overview

A browser-based elevator simulator hosted as a static single page on GitHub Pages. Users configure a building with floors and elevators, then watch pixel-art animals ride elevators controlled by selectable scheduling algorithms. The primary goals are: (A) a visually satisfying toy to watch, and (B) an algorithm playground for comparing elevator scheduling strategies.

## Tech Stack

- **Rendering:** HTML Canvas for the simulation, HTML/CSS for the control strip
- **Language:** Vanilla JavaScript, ES modules (`type="module"`), no framework
- **Build:** None — no bundler, no transpiler. Served directly by GitHub Pages
- **Dependencies:** Zero

## Page Layout

Full viewport, two zones stacked vertically:

### Control Strip (top, ~60-80px, fixed)

Horizontal bar across the top of the page. Controls are secondary to the visual — the simulation canvas is the star.

- **Left group:** Play/Pause button, Step button, Speed slider (0.5x–5x), Reset button
- **Center group:** Floors (number input, 2–50), Elevators (number input, 1–8), Max capacity per elevator (number input, 1–20)
- **Right group:** Spawn rate slider (Perlin noise intensity), Algorithm dropdown (SCAN, Nearest Car, Round Robin), "Spawn Animal" button for manual placement

Changes to floors, elevators, or capacity trigger a simulation reset. Speed and spawn rate are adjustable live.

### Canvas Area (below, fills remaining viewport)

The building cross-section visualization. Resizes with the browser window.

## Building Visualization

2D cross-section rendered on canvas, pixel-art style:

- **Floors:** Horizontal slabs spanning the building width. Floor numbers labeled on the left edge. Each floor has a visible waiting area (left side of each shaft) where animals queue.
- **Elevator shafts:** Vertical columns side by side. Each shaft has visible rails/walls. Count matches the elevator setting.
- **Elevator cars:** Sprites moving vertically within their shaft. Smooth pixel-snapped animation. Doors open/close when stopped at a floor.
- **Animals:** Pixel-art sprites standing in the waiting area, walking into elevators, and walking out at destinations. A small indicator (colored dot or arrow) shows desired direction.

### Scrolling & Scaling

- If the building exceeds viewport height, the canvas scrolls vertically
- Ground floor at the bottom, top floor at the top
- Sprites render at 2x–3x native pixel size for visibility
- `imageSmoothingEnabled = false` for crisp pixel art

## Simulation Engine

Tick-based simulation on `requestAnimationFrame`, decoupled from rendering:

### Timing

- Sim clock advances by `dt * speedMultiplier` each frame
- All logic runs against sim time, not wall time

### Perlin Noise Spawner

A 1D Perlin noise function sampled over sim time controls spawn probability each tick. When the noise value exceeds a threshold (inversely related to the spawn rate slider), a new animal spawns at a random floor wanting a random destination floor. This creates organic waves of activity — busy periods and lulls — instead of uniform random arrivals.

### Animal Lifecycle

Spawned → Waiting (on floor) → Boarding → Riding → Exiting → Done (removed)

Each animal tracks:
- Origin floor
- Destination floor
- Direction (up/down)
- Wait start time (for future stats)
- Animal type (randomly selected from 13 available)

### Elevator Lifecycle

Idle → Moving → Stopping → Doors Opening → Loading/Unloading → Doors Closing → Moving

Each elevator tracks:
- Current floor (continuous float for smooth animation)
- Direction
- Passenger list
- Target floors queue

### Capacity Enforcement

Elevators won't board more animals than their max capacity. Waiting animals see a full elevator and stay put for the next one.

### Play/Pause/Step

- Pause freezes sim clock; rendering continues (static frame)
- Step advances exactly one sim tick while paused

## Scheduling Algorithms

Three algorithms, selectable via dropdown. Switching mid-run reassigns all elevator targets immediately. All share a common interface: given current state (elevator positions, directions, passenger lists, waiting animals), produce target floors for each elevator.

### SCAN (Elevator Algorithm)

Each elevator moves in one direction, servicing all requests in that direction, then reverses. Classic elevator behavior. Simple and fair.

### Nearest Car

When an animal requests an elevator, the system assigns the nearest idle or already-heading-that-way elevator. Greedy — good responsiveness but can starve distant floors.

### Round Robin

Requests distributed evenly across elevators in sequence. Each elevator independently services its own queue using SCAN. Simple load balancing, predictable but not optimal.

## Sprite & Asset System

### Animal Types (13 total)

**Cats (5):** Black, Grey, Pinkie, Siamese, Yellow
- Source: `8 BIT-PIXEL CATS V3.2` pack
- Sprite sheets with grid layouts
- Animations: Walking, Sitting/Idle (Breathing)

**Dogs (5):** Base, Black & White, Black, Brown, Exotic
- Source: `8-Bit Dogs` pack
- Sprite sheets with horizontal strip layouts
- Animations: Walking, Sitting

**Foxes (3):** Arctic, Red, Silver
- Source: `Foxes` pack
- Sprite sheets (`-Sheet.png`) with horizontal strip layouts
- Animations: Walking (caminhando), Crouching/Idle (agachando)

### Sprite Manifest

A JS config object mapping each animal to:
- Sprite sheet path
- Frame size (width, height)
- Frame count per animation
- Layout (grid vs horizontal strip)

The manifest normalizes differences between the three packs.

### Rendering

- `imageSmoothingEnabled = false` for pixel-perfect rendering
- Sprites at 2x–3x native size
- Frame animation timing tied to sim clock
- Random animal type selected on spawn

## File Structure

```
elevation/
├── index.html              # Entry point, control strip HTML, canvas element
├── css/
│   └── style.css           # Control strip styling, layout
├── js/
│   ├── main.js             # Bootstrap, game loop, glue
│   ├── sim.js              # Simulation engine (tick, spawn, lifecycle)
│   ├── renderer.js         # Canvas rendering (building, elevators, animals)
│   ├── sprites.js          # Sprite loader, manifest, frame animation
│   ├── perlin.js           # Perlin noise implementation
│   ├── algorithms/
│   │   ├── scan.js         # SCAN algorithm
│   │   ├── nearest.js      # Nearest Car algorithm
│   │   └── roundrobin.js   # Round Robin algorithm
│   └── controls.js         # Control strip wiring (inputs ↔ sim state)
├── assets/
│   └── sprites/            # Organized sprite sheets (cats/, dogs/, foxes/)
└── docs/
    └── superpowers/specs/  # This document
```

## Future Additions (Not in scope)

- Stats dashboard (average wait time, throughput, etc.)
- Additional algorithms
- Custom algorithm editor
- Sound effects
