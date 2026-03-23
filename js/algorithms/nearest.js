// js/algorithms/nearest.js — Nearest Car algorithm

export function nearestCarAlgorithm(sim) {
  const waiting = sim.animals.filter(a => a.state === 'waiting');

  for (const el of sim.elevators) {
    for (const p of el.passengers) {
      if (!el.targets.includes(p.dest)) el.targets.push(p.dest);
    }
  }

  for (const animal of waiting) {
    if (sim.elevators.some(el => el.targets.includes(animal.origin) && el.passengers.length < sim.capacity)) continue;

    let bestEl = null;
    let bestDist = Infinity;

    for (const el of sim.elevators) {
      if (el.passengers.length >= sim.capacity) continue;
      const dist = Math.abs(el.floor - animal.origin);
      const headingToward = el.direction === 0 ||
        (el.direction > 0 && animal.origin >= el.floor) ||
        (el.direction < 0 && animal.origin <= el.floor);
      const loadPenalty = (el.targets.length + el.passengers.length) * 2;
      const score = (headingToward ? dist : dist + sim.floors) + loadPenalty;
      if (score < bestDist) { bestDist = score; bestEl = el; }
    }

    if (bestEl) {
      if (!bestEl.targets.includes(animal.origin)) bestEl.targets.push(animal.origin);
      const dir = bestEl.direction || 1;
      bestEl.targets.sort((a, b) => dir > 0 ? a - b : b - a);
    }
  }
}
