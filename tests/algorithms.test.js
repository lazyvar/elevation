// tests/algorithms.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanAlgorithm } from '../js/algorithms/scan.js';

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
