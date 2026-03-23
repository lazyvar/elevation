// js/algorithms/roundrobin.js — Round Robin algorithm

let rrIndex = 0;

export function resetRoundRobin() { rrIndex = 0; }

export function roundRobinAlgorithm(sim) {
  const waiting = sim.animals.filter(a => a.state === 'waiting');

  for (const el of sim.elevators) {
    for (const p of el.passengers) {
      if (!el.targets.includes(p.dest)) el.targets.push(p.dest);
    }
  }

  for (const animal of waiting) {
    if (sim.elevators.some(el => el.targets.includes(animal.origin) && el.passengers.length < sim.capacity)) continue;

    // Find next non-full elevator in round-robin order
    let el = null;
    for (let i = 0; i < sim.elevators.length; i++) {
      const candidate = sim.elevators[(rrIndex + i) % sim.elevators.length];
      if (candidate.passengers.length < sim.capacity) {
        el = candidate;
        rrIndex = (rrIndex + i + 1) % sim.elevators.length;
        break;
      }
    }
    if (!el) continue;

    if (!el.targets.includes(animal.origin)) el.targets.push(animal.origin);
    const dir = el.direction || 1;
    el.targets.sort((a, b) => dir > 0 ? a - b : b - a);
  }
}
