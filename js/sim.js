// js/sim.js — Simulation state and tick logic

// Animal type list — no browser dependency. Matches sprites.js MANIFEST keys.
const ANIMAL_TYPES = [
  'cat-black','cat-grey','cat-pinkie','cat-siamese','cat-yellow',
  'dog-base','dog-blackwhite','dog-black','dog-brown','dog-exotic',
  'fox-arctic','fox-red','fox-silver'
];

const MAX_WAITING = 30;

// Simulation constants
export const SIM_CONSTANTS = {
  elevatorSpeed: 1.5,     // floors per second
  doorDuration: 0.4,      // seconds to open or close
  boardingTime: 0.3,      // seconds per animal boarding
  unloadingTime: 0.3,     // seconds per animal unloading
  exitDuration: 0.5,      // seconds for walk-off animation (sim time)
};

export function createSim({ floors, elevators, capacity }) {
  const els = [];
  for (let i = 0; i < elevators; i++) {
    els.push({
      id: i,
      floor: 0,
      targetFloor: null,
      direction: 0,
      passengers: [],
      state: 'idle',
      stateTimer: 0,
      targets: [],
    });
  }
  return {
    floors,
    capacity,
    elevators: els,
    animals: [],
    time: 0,
    nextAnimalId: 0,
    algorithm: null,
  };
}

export function spawnAnimal(sim) {
  const waiting = sim.animals.filter(a => a.state === 'waiting').length;
  if (waiting >= MAX_WAITING) return null;

  const origin = Math.floor(Math.random() * sim.floors);
  let dest = Math.floor(Math.random() * sim.floors);
  while (dest === origin) dest = Math.floor(Math.random() * sim.floors);

  const animal = {
    id: sim.nextAnimalId++,
    type: ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)],
    origin,
    dest,
    direction: dest > origin ? 1 : -1,
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

export function tickSim(sim, dt) {
  sim.time += dt;

  // Update elevators
  for (const el of sim.elevators) {
    tickElevator(sim, el, dt);
  }

  // Run algorithm to assign targets
  if (sim.algorithm) {
    sim.algorithm(sim);
  }

  // Update animal state timers and animations
  for (const animal of sim.animals) {
    // Boarding countdown — transitions to riding when timer expires
    if (animal.state === 'boarding') {
      animal.stateTimer -= dt;
      if (animal.stateTimer <= 0) {
        animal.state = 'riding';
        const el = sim.elevators.find(e => e.id === animal.elevator);
        if (el) el.passengers.push(animal);
      }
    }

    // Exiting countdown — transitions to done using sim time (not wall time)
    if (animal.state === 'exiting') {
      animal.stateTimer -= dt;
      if (animal.stateTimer <= 0) {
        animal.state = 'done';
      }
    }

    // Sprite animation — tied to sim time via dt
    animal.animTimer += dt;
    if (animal.animTimer > 0.12) {
      animal.animTimer = 0;
      animal.animFrame++;
    }
  }

  // Clean up done animals
  sim.animals = sim.animals.filter(a => a.state !== 'done');
}

function tickElevator(sim, el, dt) {
  switch (el.state) {
    case 'idle':
      if (el.targets.length > 0) {
        el.targetFloor = el.targets[0];
        if (el.targetFloor === Math.round(el.floor)) {
          el.targets.shift();
          el.state = 'doors-opening';
          el.stateTimer = SIM_CONSTANTS.doorDuration;
        } else {
          el.direction = el.targetFloor > el.floor ? 1 : -1;
          el.state = 'moving';
        }
      }
      break;

    case 'moving': {
      el.floor += el.direction * SIM_CONSTANTS.elevatorSpeed * dt;
      if (el.targetFloor !== null) {
        const reached = el.direction > 0
          ? el.floor >= el.targetFloor
          : el.floor <= el.targetFloor;
        if (reached) {
          el.floor = el.targetFloor;
          el.targets = el.targets.filter(t => t !== el.targetFloor);
          el.state = 'doors-opening';
          el.stateTimer = SIM_CONSTANTS.doorDuration;
        }
      }
      break;
    }

    case 'doors-opening':
      el.stateTimer -= dt;
      if (el.stateTimer <= 0) {
        el.state = 'loading';
        el.stateTimer = 0;
      }
      break;

    case 'loading': {
      const currentFloor = Math.round(el.floor);

      // Unload passengers whose destination is this floor
      const exiting = el.passengers.filter(a => a.dest === currentFloor);
      if (exiting.length > 0 && el.stateTimer <= 0) {
        const animal = exiting[0];
        animal.state = 'exiting';
        animal.stateTimer = SIM_CONSTANTS.exitDuration;
        animal.elevator = null;
        animal.floor = currentFloor;
        el.passengers = el.passengers.filter(a => a.id !== animal.id);
        el.stateTimer = SIM_CONSTANTS.unloadingTime;
        break;
      }

      // Board waiting animals — direction-aware
      const waiting = sim.animals.filter(a =>
        a.state === 'waiting' &&
        a.origin === currentFloor &&
        el.passengers.length < sim.capacity &&
        (el.direction === 0 || a.direction === el.direction)
      );
      if (waiting.length > 0 && el.stateTimer <= 0) {
        const animal = waiting[0];
        animal.state = 'boarding';
        animal.stateTimer = SIM_CONSTANTS.boardingTime;
        animal.elevator = el.id;
        if (!el.targets.includes(animal.dest)) {
          el.targets.push(animal.dest);
          el.targets.sort((a, b) => el.direction >= 0 ? a - b : b - a);
        }
        el.stateTimer = SIM_CONSTANTS.boardingTime;
        break;
      }

      // Nothing left to load/unload — close doors
      if (el.stateTimer <= 0) {
        el.state = 'doors-closing';
        el.stateTimer = SIM_CONSTANTS.doorDuration;
      } else {
        el.stateTimer -= dt;
      }
      break;
    }

    case 'doors-closing':
      el.stateTimer -= dt;
      if (el.stateTimer <= 0) {
        if (el.targets.length > 0) {
          el.targetFloor = el.targets[0];
          el.direction = el.targetFloor > el.floor ? 1 : -1;
          el.state = 'moving';
        } else {
          el.direction = 0;
          el.state = 'idle';
        }
      }
      break;
  }
}
