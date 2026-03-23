// tests/algorithms.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanAlgorithm } from '../js/algorithms/scan.js';
import { nearestCarAlgorithm } from '../js/algorithms/nearest.js';
import { roundRobinAlgorithm, resetRoundRobin } from '../js/algorithms/roundrobin.js';

function makeSim(overrides = {}) {
  return {
    floors: 10,
    capacity: 6,
    elevators: [{
      id: 0, floor: 0, direction: 0, passengers: [],
      state: 'idle', targets: [], targetFloor: null, stateTimer: 0,
    }],
    animals: [],
    ...overrides,
  };
}
export { makeSim };

describe('SCAN algorithm', () => {
  it('assigns waiting animal floors as targets', () => {
    const sim = makeSim();
    sim.animals.push({ id: 0, origin: 3, dest: 7, state: 'waiting', direction: 1 });
    scanAlgorithm(sim);
    assert.ok(sim.elevators[0].targets.includes(3), 'Should target pickup floor');
  });

  it('does nothing with no waiting animals', () => {
    const sim = makeSim();
    scanAlgorithm(sim);
    assert.deepStrictEqual(sim.elevators[0].targets, []);
  });

  it('maintains direction until no more requests that way', () => {
    const sim = makeSim();
    sim.elevators[0].direction = 1;
    sim.elevators[0].floor = 3;
    sim.animals.push(
      { id: 0, origin: 5, dest: 8, state: 'waiting', direction: 1 },
      { id: 1, origin: 1, dest: 0, state: 'waiting', direction: -1 },
    );
    scanAlgorithm(sim);
    assert.strictEqual(sim.elevators[0].targets[0], 5);
  });
});

describe('Nearest Car algorithm', () => {
  it('assigns animal to closest elevator', () => {
    const sim = makeSim({
      elevators: [
        { id: 0, floor: 1, direction: 0, passengers: [], state: 'idle', targets: [], targetFloor: null, stateTimer: 0 },
        { id: 1, floor: 8, direction: 0, passengers: [], state: 'idle', targets: [], targetFloor: null, stateTimer: 0 },
      ],
    });
    sim.animals.push({ id: 0, origin: 2, dest: 5, state: 'waiting', direction: 1 });
    nearestCarAlgorithm(sim);
    assert.ok(sim.elevators[0].targets.includes(2), 'Elevator 0 (floor 1) should get the request');
    assert.ok(!sim.elevators[1].targets.includes(2), 'Elevator 1 (floor 8) should not');
  });
});

describe('Round Robin algorithm', () => {
  it('distributes animals across elevators evenly', () => {
    resetRoundRobin();
    const sim = makeSim({
      elevators: [
        { id: 0, floor: 0, direction: 0, passengers: [], state: 'idle', targets: [], targetFloor: null, stateTimer: 0 },
        { id: 1, floor: 0, direction: 0, passengers: [], state: 'idle', targets: [], targetFloor: null, stateTimer: 0 },
      ],
    });
    sim.animals.push(
      { id: 0, origin: 2, dest: 5, state: 'waiting', direction: 1 },
      { id: 1, origin: 3, dest: 1, state: 'waiting', direction: -1 },
    );
    roundRobinAlgorithm(sim);
    assert.ok(sim.elevators[0].targets.length > 0);
    assert.ok(sim.elevators[1].targets.length > 0);
  });
});
