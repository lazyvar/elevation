// tests/sim.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSim, spawnAnimal, tickSim, SIM_CONSTANTS } from '../js/sim.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Tick the sim forward by `seconds`, using small dt steps. */
function advanceSim(sim, seconds, dt = 0.016) {
  const steps = Math.ceil(seconds / dt);
  for (let i = 0; i < steps; i++) tickSim(sim, dt);
}

/** Create a deterministic waiting animal (bypasses randomness). */
function placeAnimal(sim, { origin, dest }) {
  const direction = dest > origin ? 1 : -1;
  const animal = {
    id: sim.nextAnimalId++,
    type: 'cat-black',
    name: 'Test',
    origin,
    dest,
    direction,
    state: 'waiting',
    floor: origin,
    elevator: null,
    stateTimer: 0,
    waitStart: sim.time,
    animFrame: 0,
    animTimer: 0,
    x: 0,
  };
  sim.animals.push(animal);
  return animal;
}

// ---------------------------------------------------------------------------
// createSim
// ---------------------------------------------------------------------------

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

  it('assigns unique ids to elevators', () => {
    const sim = createSim({ floors: 5, elevators: 3, capacity: 4 });
    const ids = sim.elevators.map(e => e.id);
    assert.deepStrictEqual(ids, [0, 1, 2]);
  });
});

// ---------------------------------------------------------------------------
// spawnAnimal
// ---------------------------------------------------------------------------

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
    // Use enough floors so per-floor cap (3) doesn't limit us: 10 floors × 3 = 30
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    let spawned = 0;
    for (let i = 0; i < 50; i++) {
      if (spawnAnimal(sim)) spawned++;
    }
    assert.strictEqual(spawned, 30);
    const result = spawnAnimal(sim);
    assert.strictEqual(result, null);
  });

  it('respects per-floor cap of 3', () => {
    // 1 floor means at most 3 waiting animals (all must originate on floor 0)
    const sim = createSim({ floors: 2, elevators: 1, capacity: 4 });
    let spawned = 0;
    for (let i = 0; i < 20; i++) {
      if (spawnAnimal(sim)) spawned++;
    }
    // With 2 floors, max = 2 floors × 3 per-floor = 6
    assert.ok(spawned <= 6);
    assert.ok(spawned >= 2); // at least some should spawn
  });

  it('sets correct direction based on origin and dest', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    for (let i = 0; i < 20; i++) {
      const a = spawnAnimal(sim);
      if (!a) break;
      const expected = a.dest > a.origin ? 1 : -1;
      assert.strictEqual(a.direction, expected);
    }
  });

  it('assigns incrementing ids', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const a1 = spawnAnimal(sim);
    const a2 = spawnAnimal(sim);
    assert.strictEqual(a1.id, 0);
    assert.strictEqual(a2.id, 1);
  });
});

// ---------------------------------------------------------------------------
// tickSim — basic
// ---------------------------------------------------------------------------

describe('tickSim', () => {
  it('does not crash with empty sim', () => {
    const sim = createSim({ floors: 5, elevators: 2, capacity: 6 });
    assert.doesNotThrow(() => tickSim(sim, 0.016));
  });

  it('advances sim time', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    tickSim(sim, 0.5);
    assert.ok(Math.abs(sim.time - 0.5) < 0.001);
  });

  it('moves elevator toward target floor', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.targets = [3];
    tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'moving');
    assert.strictEqual(el.direction, 1);
    // Run until arrival (3 floors at 1.5 fl/s = 2s, plus door time)
    advanceSim(sim, 3);
    assert.strictEqual(Math.round(el.floor), 3);
  });

  it('transitions through door states at a floor with a waiting animal', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    // Place a waiting animal on floor 0 so hasWork is true
    placeAnimal(sim, { origin: 0, dest: 3 });
    el.targets = [0];
    el.floor = 0;
    tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'doors-opening');
    // Advance past door opening (0.4s) into loading
    advanceSim(sim, 0.5);
    assert.strictEqual(el.state, 'loading');
  });

  it('boards waiting animal with boarding state', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = placeAnimal(sim, { origin: 0, dest: 3 });
    const el = sim.elevators[0];
    el.floor = 0;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1;
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'boarding');
    // Advance past boarding time (0.3s)
    advanceSim(sim, 0.5);
    assert.strictEqual(animal.state, 'riding');
    assert.strictEqual(el.passengers.length, 1);
  });

  it('does not board animal going opposite direction', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = placeAnimal(sim, { origin: 2, dest: 0 }); // wants to go down
    const el = sim.elevators[0];
    el.floor = 2;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1; // going up
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'waiting');
  });

  it('does not board opposite-direction animal even when elevator is empty', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = placeAnimal(sim, { origin: 2, dest: 0 }); // wants to go down
    const el = sim.elevators[0];
    el.floor = 2;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1; // going up, no passengers
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'waiting');
  });

  it('idle elevator (direction 0) accepts animal going any direction', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = placeAnimal(sim, { origin: 2, dest: 0 }); // wants to go down
    const el = sim.elevators[0];
    el.floor = 2;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 0; // idle — no committed direction
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'boarding');
  });

  it('enforces capacity limit', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 2 });
    const el = sim.elevators[0];
    el.floor = 0;
    el.state = 'loading';
    el.stateTimer = 0;
    el.direction = 1;
    el.passengers = [{ id: 99, dest: 4 }, { id: 98, dest: 4 }];
    const animal = placeAnimal(sim, { origin: 0, dest: 3 });
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'waiting');
  });

  it('cleans up done animals', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = placeAnimal(sim, { origin: 0, dest: 3 });
    animal.state = 'done';
    assert.strictEqual(sim.animals.length, 1);
    tickSim(sim, 0.016);
    assert.strictEqual(sim.animals.length, 0);
  });

  it('unloads passengers at destination floor', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = placeAnimal(sim, { origin: 0, dest: 3 });
    animal.state = 'riding';
    animal.elevator = 0;
    const el = sim.elevators[0];
    el.floor = 3;
    el.state = 'loading';
    el.stateTimer = 0;
    el.passengers = [animal];
    tickSim(sim, 0.016);
    assert.strictEqual(animal.state, 'done');
    assert.strictEqual(el.passengers.length, 0);
  });

  it('elevator becomes idle after completing all targets', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 3;
    el.state = 'doors-closing';
    el.stateTimer = 0;
    el.targets = [];
    tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'idle');
    assert.strictEqual(el.direction, 0);
  });

  it('door sensor reopens for new waiting animals during close', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 2;
    el.state = 'doors-closing';
    el.stateTimer = 0.2; // mid-close
    el.direction = 1;
    // Animal appears while doors closing
    placeAnimal(sim, { origin: 2, dest: 4 });
    tickSim(sim, 0.016);
    assert.strictEqual(el.state, 'doors-opening');
  });
});

// ---------------------------------------------------------------------------
// Elevator picks up intermediate targets while moving (bug fix)
// ---------------------------------------------------------------------------

describe('intermediate target pickup', () => {
  it('elevator stops at a new intermediate target added while moving', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 0;
    el.targets = [7];
    el.targetFloor = 7;
    el.direction = 1;
    el.state = 'moving';

    // Place a waiting animal on floor 3 going up (so there's work to do)
    placeAnimal(sim, { origin: 3, dest: 7 });

    // Advance until elevator is past floor 1 but before floor 3
    advanceSim(sim, 1.0); // ~1.5 floors
    assert.ok(el.floor > 1 && el.floor < 3, `Expected floor between 1-3, got ${el.floor}`);

    // Simulate algorithm adding floor 3 as intermediate target
    el.targets.push(3);
    el.targets.sort((a, b) => a - b);

    // Advance — elevator should stop at floor 3, not skip to 7
    advanceSim(sim, 2.0);
    // Elevator should have reached floor 3 and opened doors
    assert.ok(el.floor <= 4, `Expected elevator to stop at/near floor 3, got ${el.floor}`);
  });

  it('elevator stops at closer intermediate target going down', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 8;
    el.targets = [1];
    el.targetFloor = 1;
    el.direction = -1;
    el.state = 'moving';

    // Place a waiting animal on floor 5 going down (so there's work to do)
    placeAnimal(sim, { origin: 5, dest: 1 });

    // Advance until elevator is past floor 7 but before floor 5
    advanceSim(sim, 0.5);
    assert.ok(el.floor < 8 && el.floor > 5, `Expected floor between 5-8, got ${el.floor}`);

    // Add floor 5 as intermediate target
    el.targets.push(5);
    el.targets.sort((a, b) => b - a); // descending for going down

    // targetFloor should update to 5 on next tick
    tickSim(sim, 0.016);
    assert.strictEqual(el.targetFloor, 5);

    // Advance enough to reach floor 5 but not much further
    advanceSim(sim, 1.5);
    // Elevator should have stopped at floor 5 (doors-opening or loading or doors-closing)
    assert.strictEqual(Math.round(el.floor), 5);
    assert.ok(
      el.state === 'doors-opening' || el.state === 'loading' || el.state === 'doors-closing',
      `Expected door state at floor 5, got ${el.state}`
    );
  });

  it('targetFloor updates to nearer target each tick while moving', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 0;
    el.targets = [3, 7];
    el.targetFloor = 7;
    el.direction = 1;
    el.state = 'moving';

    tickSim(sim, 0.016);
    // After one tick, targetFloor should have been updated to 3 (nearer ahead target)
    assert.strictEqual(el.targetFloor, 3);
  });

  it('ignores targets behind the elevator when updating targetFloor', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 5;
    el.targets = [2, 8]; // 2 is behind, 8 is ahead
    el.targetFloor = 8;
    el.direction = 1;
    el.state = 'moving';

    tickSim(sim, 0.016);
    // Should still target 8, not 2
    assert.strictEqual(el.targetFloor, 8);
  });

  it('full elevator skips pickup-only floors and goes straight to dropoff', () => {
    const sim = createSim({ floors: 15, elevators: 1, capacity: 2 });
    const el = sim.elevators[0];

    // Fill elevator to capacity with passengers going to floor 8
    const rider1 = placeAnimal(sim, { origin: 0, dest: 8 });
    rider1.state = 'riding'; rider1.elevator = 0;
    const rider2 = placeAnimal(sim, { origin: 0, dest: 8 });
    rider2.state = 'riding'; rider2.elevator = 0;
    el.passengers = [rider1, rider2];

    // Waiting animals on intermediate floors (elevator can't pick them up)
    placeAnimal(sim, { origin: 3, dest: 9 });
    placeAnimal(sim, { origin: 5, dest: 10 });
    placeAnimal(sim, { origin: 6, dest: 11 });

    el.floor = 1;
    el.direction = 1;
    el.targets = [3, 5, 6, 8]; // algorithm assigned all these floors
    el.targetFloor = 3;
    el.state = 'moving';

    // Track which floors the elevator actually stops at (opens doors)
    const stoppedFloors = [];
    let lastState = 'moving';
    for (let i = 0; i < 500; i++) {
      tickSim(sim, 0.016);
      if (el.state === 'doors-opening' && lastState !== 'doors-opening') {
        stoppedFloors.push(Math.round(el.floor));
      }
      lastState = el.state;
    }

    // Should only stop at floor 8 (dropoff), not 3, 5, or 6 (pickup-only while full)
    assert.deepStrictEqual(stoppedFloors, [8]);
  });
});

// ---------------------------------------------------------------------------
// Boarding animation
// ---------------------------------------------------------------------------

describe('boarding and animation', () => {
  it('boarding animal transitions to riding after boarding time', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = placeAnimal(sim, { origin: 0, dest: 3 });
    animal.state = 'boarding';
    animal.stateTimer = SIM_CONSTANTS.boardingTime;
    animal.elevator = 0;

    // Not yet done
    tickSim(sim, SIM_CONSTANTS.boardingTime * 0.5);
    assert.strictEqual(animal.state, 'boarding');

    // Should transition after full boarding time
    advanceSim(sim, SIM_CONSTANTS.boardingTime);
    assert.strictEqual(animal.state, 'riding');
  });

  it('sprite animation frame advances with sim time', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const animal = placeAnimal(sim, { origin: 0, dest: 3 });
    const startFrame = animal.animFrame;
    advanceSim(sim, 1.0); // plenty of time for frames to advance
    assert.ok(animal.animFrame > startFrame);
  });
});

// ---------------------------------------------------------------------------
// Full elevator lifecycle integration
// ---------------------------------------------------------------------------

describe('full elevator lifecycle', () => {
  it('completes a full pickup-ride-dropoff cycle', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    const animal = placeAnimal(sim, { origin: 0, dest: 2 });

    // Set elevator to pick up on floor 0 and deliver to floor 2
    el.floor = 0;
    el.targets = [0];

    // Run long enough for full cycle:
    // doors-open(0.4) + board(0.3) + doors-close(0.4) + move 2 floors(1.33) + doors-open(0.4) + unload(0.3) + doors-close(0.4)
    advanceSim(sim, 5.0);

    // Animal should be done (cleaned up)
    assert.strictEqual(sim.animals.filter(a => a.id === animal.id).length, 0);
  });

  it('elevator returns to idle with direction 0 after all work done', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 3;
    el.targets = [3];
    // Need a passenger to trigger hasWork
    const animal = placeAnimal(sim, { origin: 0, dest: 3 });
    animal.state = 'riding';
    animal.elevator = 0;
    el.passengers = [animal];
    el.direction = 1;

    advanceSim(sim, 3.0);

    assert.strictEqual(el.state, 'idle');
    assert.strictEqual(el.direction, 0);
    assert.strictEqual(el.targets.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Algorithm integration
// ---------------------------------------------------------------------------

describe('algorithm integration', () => {
  it('algorithm runs each tick and assigns targets', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    let callCount = 0;
    sim.algorithm = () => { callCount++; };
    tickSim(sim, 0.016);
    tickSim(sim, 0.016);
    assert.strictEqual(callCount, 2);
  });

  it('null algorithm does not crash', () => {
    const sim = createSim({ floors: 5, elevators: 1, capacity: 4 });
    sim.algorithm = null;
    assert.doesNotThrow(() => tickSim(sim, 0.016));
  });
});

// ---------------------------------------------------------------------------
// SCAN direction continuation
// ---------------------------------------------------------------------------

describe('SCAN direction behavior', () => {
  it('elevator going up continues past intermediate floors to serve highest target before reversing', () => {
    const sim = createSim({ floors: 15, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];

    // Riding passenger going to floor 10
    const rider = placeAnimal(sim, { origin: 0, dest: 10 });
    rider.state = 'riding';
    rider.elevator = 0;
    el.passengers = [rider];

    el.floor = 3;
    el.direction = 1;
    el.targets = [5, 10]; // targets ahead going up
    el.targetFloor = 5;
    el.state = 'moving';

    // Full trip: move 3→5 (1.3s) + doors(0.8s) + move 5→10 (3.3s) + doors(0.8s) + unload(0.3s) ≈ 6.5s
    advanceSim(sim, 8.0);
    // The rider should be delivered (gone from passengers)
    assert.strictEqual(el.passengers.length, 0);
  });

  it('elevator continues in current direction when targets exist both ahead and behind', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 5;
    el.direction = 1; // going up
    el.targets = [2, 8]; // 2 is behind, 8 is ahead
    el.targetFloor = 8;
    el.state = 'doors-closing';
    el.stateTimer = 0; // about to finish closing

    tickSim(sim, 0.016);
    // Should continue up toward 8, not reverse to 2
    assert.strictEqual(el.direction, 1);
    assert.strictEqual(el.targetFloor, 8);
    assert.strictEqual(el.state, 'moving');
  });

  it('elevator reverses only when no targets remain in current direction', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 7;
    el.direction = 1; // going up
    el.targets = [3]; // only target is behind
    el.state = 'doors-closing';
    el.stateTimer = 0;

    tickSim(sim, 0.016);
    // Should reverse to go down toward 3
    assert.strictEqual(el.direction, -1);
    assert.strictEqual(el.targetFloor, 3);
    assert.strictEqual(el.state, 'moving');
  });

  it('elevator going down serves lowest target before reversing', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 5;
    el.direction = -1; // going down
    el.targets = [2, 8]; // 2 is ahead (below), 8 is behind (above)
    el.state = 'doors-closing';
    el.stateTimer = 0;

    tickSim(sim, 0.016);
    // Should continue down toward 2
    assert.strictEqual(el.direction, -1);
    assert.strictEqual(el.targetFloor, 2);
  });

  it('up-bound elevator does not pick up down-bound animal at intermediate stop', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];

    // Animal on floor 5 wants to go DOWN
    const downAnimal = placeAnimal(sim, { origin: 5, dest: 1 });

    // Elevator going UP, stops at floor 5 (has a rider going to 8)
    const rider = placeAnimal(sim, { origin: 0, dest: 8 });
    rider.state = 'riding';
    rider.elevator = 0;
    el.passengers = [rider];

    el.floor = 5;
    el.direction = 1;
    el.state = 'loading';
    el.stateTimer = 0;

    tickSim(sim, 0.016);
    // Down-bound animal should NOT board an up-bound elevator
    assert.strictEqual(downAnimal.state, 'waiting');
  });

  it('door sensor does not reopen for opposite-direction animal', () => {
    const sim = createSim({ floors: 10, elevators: 1, capacity: 4 });
    const el = sim.elevators[0];
    el.floor = 5;
    el.direction = 1; // going up
    el.state = 'doors-closing';
    el.stateTimer = 0.2; // mid-close
    el.targets = [8];

    // Animal on this floor wants to go DOWN
    placeAnimal(sim, { origin: 5, dest: 2 });

    tickSim(sim, 0.016);
    // Should NOT reopen — animal is going opposite direction
    assert.strictEqual(el.state, 'doors-closing');
  });
});
