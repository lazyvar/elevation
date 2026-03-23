// js/algorithms/scan.js — SCAN (elevator) algorithm
//
// Assigns waiting animals to elevators with load balancing.
// Each elevator sorts its targets in SCAN order.

export function scanAlgorithm(sim) {
  const waiting = sim.animals.filter(a => a.state === 'waiting');

  // Ensure passenger destinations are in targets
  for (const el of sim.elevators) {
    for (const p of el.passengers) {
      if (!el.targets.includes(p.dest)) el.targets.push(p.dest);
    }
  }

  // Count how many animals each elevator is expected to handle per floor
  // (passengers already aboard + animals on floors already targeted)
  const elLoad = sim.elevators.map(el => {
    let load = el.passengers.length;
    // Count waiting animals on floors this elevator is already targeting
    for (const t of el.targets) {
      load += waiting.filter(a => a.origin === t).length;
    }
    return load;
  });

  // For each floor with waiting animals, ensure at least one elevator targets it
  // Spread the load: if an elevator is already overloaded, pick a different one
  const floorGroups = {};
  for (const animal of waiting) {
    if (!floorGroups[animal.origin]) floorGroups[animal.origin] = [];
    floorGroups[animal.origin].push(animal);
  }

  for (const [floorStr, animals] of Object.entries(floorGroups)) {
    const floor = Number(floorStr);

    // How many elevator-loads do we need for this floor?
    // Each elevator can take up to sim.capacity passengers
    const alreadyTargeting = sim.elevators.filter(el => el.targets.includes(floor) && el.passengers.length < sim.capacity);
    const capacityAssigned = alreadyTargeting.reduce((sum, el) => sum + (sim.capacity - el.passengers.length), 0);

    if (capacityAssigned >= animals.length) continue; // enough elevators assigned

    // Need more elevators for this floor
    let remaining = animals.length - capacityAssigned;
    const available = sim.elevators
      .filter(el => !el.targets.includes(floor) && el.passengers.length < sim.capacity)
      .map(el => {
        const dist = Math.abs(el.floor - floor);
        const headingToward = el.direction === 0 ||
          (el.direction > 0 && floor >= el.floor) ||
          (el.direction < 0 && floor <= el.floor);
        const loadPenalty = (el.targets.length + el.passengers.length) * 3;
        const score = (headingToward ? dist : dist + sim.floors) + loadPenalty;
        return { el, score };
      })
      .sort((a, b) => a.score - b.score);

    for (const { el } of available) {
      if (remaining <= 0) break;
      el.targets.push(floor);
      remaining -= (sim.capacity - el.passengers.length);
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
