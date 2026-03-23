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
