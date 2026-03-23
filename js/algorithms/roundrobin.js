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
    if (sim.elevators.some(el => el.targets.includes(animal.origin))) continue;

    const el = sim.elevators[rrIndex % sim.elevators.length];
    rrIndex++;

    if (!el.targets.includes(animal.origin)) el.targets.push(animal.origin);
    const dir = el.direction || 1;
    el.targets.sort((a, b) => dir > 0 ? a - b : b - a);
  }
}
