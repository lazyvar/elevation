# Elevation

<img src="assets/sprites/cats/black-single.png" alt="pixel art cat" width="64" style="image-rendering: pixelated;">

A browser-based pixel-art elevator simulator that visualizes three scheduling algorithms side by side. Cats, dogs, and foxes ride elevators through a building while you tweak parameters in real time.

## Quick Start

Serve the project root with any static HTTP server:

```bash
python3 -m http.server
```

Open `http://localhost:8000` in your browser. No build step, no dependencies.

## How It Works

Animals spawn on random floors and want to reach a destination. Elevators pick them up and drop them off based on the selected scheduling algorithm. The event log tracks every state change in real time.

### Algorithms

| Algorithm | Strategy |
|-----------|----------|
| **SCAN** | Sweeps up then down like a typewriter, serving all requests in one direction before reversing. Efficient for tall buildings with steady traffic. |
| **Nearest Car** | Dispatches the closest available elevator to each request. Best when requests cluster on a few floors. |
| **Round Robin** | Distributes requests evenly across elevators in rotation. Simple, fair, and keeps all cars equally busy. |

### Controls

- **Play/Pause/Step** — run continuously or advance one tick at a time
- **Speed** — 0.5x to 5x simulation speed
- **Scenario presets** — preconfigured building setups (Chaos, Skyscraper, SCAN Sweep, etc.)
- **Floors / Elevators / Capacity** — adjust building parameters (resets simulation)
- **Spawn Rate** — how frequently new animals appear
- **Spawn Animal** — click to manually place an animal
- **Clear** — remove all waiting animals

### Scenario Presets

| Preset | Floors | Elevators | Capacity | Algorithm | Highlights |
|--------|--------|-----------|----------|-----------|------------|
| Chaos | 12 | 10 | 1 | SCAN | Tiny elevators, maximum chaos |
| Lone Lift | 12 | 1 | 1 | SCAN | One elevator does everything |
| Express | 8 | 3 | 8 | Nearest | High capacity, fast service |
| Skyscraper | 40 | 6 | 10 | SCAN | Tall building stress test |
| Rush Hour | 10 | 4 | 4 | Round Robin | Peak traffic, even distribution |
| Penthouse | 20 | 2 | 3 | Nearest | Long rides, few cars |
| Sardines | 5 | 2 | 20 | Round Robin | Pack them in |
| SCAN Sweep | 30 | 3 | 6 | SCAN | SCAN at its best — long sweeps |
| Nearest Cluster | 8 | 5 | 4 | Nearest | Nearest Car shines with clusters |
| RR Balance | 10 | 6 | 4 | Round Robin | Fair distribution across many cars |

## Architecture

Static SPA — no framework, no bundler. ES modules loaded directly by the browser.

```
index.html              Entry point
css/style.css           Styles
js/
  main.js               Game loop and bootstrap
  sim.js                Tick-based simulation engine
  renderer.js           Canvas rendering (pixel-art scaled)
  sprites.js            Sprite sheet loader and animation
  controls.js           UI wiring and scenario presets
  eventlog.js           Color-coded state transition log
  perlin.js             Seeded 1D Perlin noise for organic spawn timing
  algorithms/
    index.js            Algorithm registry
    scan.js             SCAN (elevator) algorithm
    nearest.js          Nearest Car algorithm
    roundrobin.js       Round Robin algorithm
assets/sprites/         Sprite sheets (cats, dogs, foxes, elevator)
tests/                  Node.js test suite (node:test)
```

## Tests

```bash
node --test tests/*.test.js
```

Uses Node's built-in `node:test` module. Covers simulation engine, all three algorithms, and Perlin noise.

## License

MIT
