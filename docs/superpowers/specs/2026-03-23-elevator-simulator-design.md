# Elevator Simulator — Design Spec

## Overview

A browser-based elevator simulator hosted as a static single page on GitHub Pages. Users configure a building with floors and elevators, then watch pixel-art animals ride elevators controlled by selectable scheduling algorithms. The primary goals are: (A) a visually satisfying toy to watch, and (B) an algorithm playground for comparing elevator scheduling strategies.

## Tech Stack

- **Rendering:** HTML Canvas for the simulation, HTML/CSS for the control strip
- **Language:** Vanilla JavaScript, ES modules (`type="module"`), no framework
- **Build:** None — no bundler, no transpiler. Served directly by GitHub Pages
- **Dependencies:** Zero
- **Browser target:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge). No IE11 or legacy fallback.

## Page Layout

Full viewport, two zones stacked vertically:

### Control Strip (top, ~60-80px, fixed)

Horizontal bar across the top of the page. Controls are secondary to the visual — the simulation canvas is the star.

- **Left group:** Play/Pause button, Step button, Speed slider (0.5x–5x), Reset button
- **Center group:** Floors (number input, 2–50), Elevators (number input, 1–8), Max capacity per elevator (number input, 1–20)
- **Right group:** Spawn rate slider (Perlin noise threshold, labeled "Spawn Rate"), Algorithm dropdown (SCAN, Nearest Car, Round Robin), "Spawn Animal" button (spawns one animal at a random floor with a random destination — same as auto-spawner, just manual trigger)

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

- If the building exceeds viewport height, the canvas scrolls vertically via mouse wheel / trackpad. The canvas element itself handles scroll, not the page.
- Ground floor at the bottom, top floor at the top
- Sprites render at 2x native pixel size (4x on displays with devicePixelRatio >= 2)
- `imageSmoothingEnabled = false` for crisp pixel art

## Simulation Engine

Tick-based simulation on `requestAnimationFrame`, decoupled from rendering:

### Timing

- Sim clock advances by `dt * speedMultiplier` each frame
- All logic runs against sim time, not wall time
- One sim tick = one `requestAnimationFrame` callback (~16ms wall time at 60fps). The `dt` passed to the update loop is the real frame delta in seconds, scaled by `speedMultiplier`. No fixed timestep — the sim is purely visual, determinism is not required.

### Simulation Constants (defaults)

- **Elevator speed:** 1.5 floors/sec (sim time)
- **Door open/close duration:** 0.4s each
- **Boarding time per animal:** 0.3s (animals board one at a time)
- **Unloading time per animal:** 0.3s

### Default Initial State

- **Floors:** 5
- **Elevators:** 2
- **Capacity:** 6
- **Algorithm:** SCAN
- **Speed:** 1x
- **State:** Paused — user hits Play to start

### Perlin Noise Spawner

A 1D Perlin noise function (classic Perlin, inlined — no dependency) sampled over sim time controls spawn probability each tick. The noise output is in range [0, 1]. The spawn rate slider maps linearly to a threshold: slider min (left) = threshold 0.9 (rare spawns), slider max (right) = threshold 0.3 (frequent spawns). When the noise sample exceeds the threshold, one animal spawns at a random floor with a random different destination floor (same-floor destinations are rerolled). This creates organic waves of activity — busy periods and lulls — instead of uniform random arrivals.

Maximum 30 animals waiting across all floors. Beyond this, spawning pauses until animals are delivered.

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
- Step advances one sim tick while paused, using a fixed dt of 16.67ms (1/60s) at 1x speed

## Scheduling Algorithms

Three algorithms, selectable via dropdown. Switching mid-run recalculates future target assignments; in-transit passengers are unaffected (they still exit at their destination). Only the decision of which elevator goes where next changes. All algorithms share a common interface: given current state (elevator positions, directions, passenger lists, waiting animals), produce target floors for each elevator.

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
- Sprites at 2x native size (4x on high-DPI)
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
