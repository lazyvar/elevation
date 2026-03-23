// tests/sim.test.js
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createSim, spawnAnimal, tickSim, SIM_CONSTANTS } from '../js/sim.js';

describe('createSim', () => {
  it('creates simulation with correct defaults', () => {
    const sim = createSim({ floors: 5, elevators: 2, capacity: 6 });
    assert.strictEqual(sim.floors, 5);
    assert.strictEqual(sim.elevators.length, 2);
    assert.strictEqual(sim.capacity, 6);
    assert.deepStrictEqual(sim.animals, []);
    assert.strictEqual(sim.elevators[0].floor, 0);
    assert.strictEqual(sim.elevators[0].direction, 0);
    assert.deepStrictEqual(sim.elevators[0].passengers, []);
    assert.strictEqual(sim.elevators[0].state, 'idle');
  });
});

describe('spawnAnimal', () => {
  it('creates an animal with valid origin and destination', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = spawnAnimal(sim);
    assert.ok(animal.origin >= 0 && animal.origin < 5);
    assert.ok(animal.dest >= 0 && animal.dest < 5);
    assert.notStrictEqual(animal.origin, animal.dest);
    assert.strictEqual(animal.state, 'waiting');
    assert.ok(animal.type);
  });

  it('respects max waiting cap of 30', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    for (let i = 0; i < 30; i++) spawnAnimal(sim);
    assert.strictEqual(sim.animals.length, 30);
    const result = spawnAnimal(sim);
    assert.strictEqual(result, null);
    assert.strictEqual(sim.animals.length, 30);
  });
});

describe('tickSim', () => {
  it('does not crash with empty sim', () => {
    const sim = createSim({ floors: 5, elevators: 2, capacity: 6 });
    assert.doesNotThrow(() => tickSim(sim, 0.016));
  });

  it('moves elevator toward target floor', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.targets = [3];
    tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'moving');
    assert.strictEqual(el.direction, 1);
    for (let i = 0; i < 200; i++) tickSim(sim, 0.016);
    assert.strictEqual(Math.round(el.floor), 3);
  });

  it('transitions through door states at a floor', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.targets = [0];
    el.floor = 0;
    tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'doors-opening');
    for (let i = 0; i < 30; i++) tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'doors-closing');
  });

  it('boards waiting animal with boarding state', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = spawnAnimal(sim);
    animal.origin = 0;
    animal.dest = 3;
    animal.floor = 0;
    animal.direction = 1;
    const el = sim.elevators[0];
    el.floor = 0;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1;
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'boarding');
    for (let i = 0; i < 25; i++) tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'riding');
    assert.strictEqual(el.passengers.length, 1);
  });

  it('does not board animal going opposite direction', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = spawnAnimal(sim);
    animal.origin = 2;
    animal.dest = 0;
    animal.floor = 2;
    animal.direction = -1;
    const el = sim.elevators[0];
    el.floor = 2;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1;
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'waiting');
  });

  it('enforces capacity limit', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 2 });
    const el = sim.elevators[0];
    el.floor = 0;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1;
    el.passengers = [{ id: 99, dest: 4 }, { id: 98, dest: 4 }];
    const animal = spawnAnimal(sim);
    animal.origin = 0;
    animal.dest = 3;
    animal.floor = 0;
    animal.direction = 1;
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'waiting');
  });

  it('uses sim-time for exit animation (not wall time)', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = spawnAnimal(sim);
    animal.state = 'exiting';
    animal.stateTimer = 0.5;
    tickSim(sim, 0.3);
    assert.strictEqual(animal.state, 'exiting');
    assert.ok(animal.stateTimer < 0.3);
    tickSim(sim, 0.3);
    assert.strictEqual(animal.state, 'done');
  });
});
