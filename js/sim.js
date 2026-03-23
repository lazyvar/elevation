// js/sim.js — Simulation state and tick logic

// Animal type list — no browser dependency. Matches sprites.js MANIFEST keys.
const ANIMAL_TYPES = [
  'cat-black','cat-grey','cat-pinkie','cat-siamese','cat-yellow',
  'dog-base','dog-blackwhite','dog-black','dog-brown','dog-exotic',
  'fox-arctic','fox-red','fox-silver'
];

const MAX_WAITING = 30;
const MAX_PER_FLOOR = 3;

// Animal name pools by species
const CAT_NAMES = [
  'Mochi','Luna','Miso','Cleo','Nori','Biscuit','Pepper','Salem','Ginger','Olive',
  'Tofu','Sushi','Maple','Willow','Hazel','Pumpkin','Whiskers','Muffin','Cinnamon','Basil',
  'Chai','Sage','Clover','Nutmeg','Waffles','Pickles','Nugget','Toffee','Cocoa','Latte',
];
const DOG_NAMES = [
  'Barkley','Scout','Bear','Cooper','Duke','Rosie','Banjo','Ziggy','Moose','Maple',
  'Bruno','Frankie','Waldo','Poppy','Otis','Rufus','Gus','Benny','Oakley','Chester',
  'Tucker','Hank','Murphy','Jasper','Marley','Louie','Winston','Baxter','Dexter','Monty',
];
const FOX_NAMES = [
  'Ember','Blaze','Rusty','Fern','Juniper','Ash','Clover','Bramble','Maple','Cedar',
  'Sorrel','Hawthorn','Briar','Thistle','Birch','Rowan','Flint','Reed','Moss','Sage',
  'Ivy','Heather','Glen','Wren','Alder','Lark','Pike','Dusk','Storm','Frost',
];

function pickName(type) {
  const pool = type.startsWith('cat') ? CAT_NAMES
    : type.startsWith('dog') ? DOG_NAMES
    : FOX_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

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

export function spawnAnimal(sim, forceOrigin) {
  const waiting = sim.animals.filter(a => a.state === 'waiting').length;
  if (waiting >= MAX_WAITING) return null;

  let origin;
  if (forceOrigin != null) {
    origin = forceOrigin;
  } else {
    // Pick a floor that isn't already full
    let attempts = 0;
    do {
      origin = Math.floor(Math.random() * sim.floors);
      attempts++;
    } while (
      attempts < 20 &&
      sim.animals.filter(a => a.state === 'waiting' && a.origin === origin).length >= MAX_PER_FLOOR
    );
    if (sim.animals.filter(a => a.state === 'waiting' && a.origin === origin).length >= MAX_PER_FLOOR) {
      return null; // all floors full
    }
  }

  let dest = Math.floor(Math.random() * sim.floors);
  while (dest === origin) dest = Math.floor(Math.random() * sim.floors);

  const type = ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)];
  const animal = {
    id: sim.nextAnimalId++,
    type,
    name: pickName(type),
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
          // Only open doors if there's actually something to do on this floor
          const hasWork = el.passengers.some(a => a.dest === el.targetFloor) ||
            (el.passengers.length < sim.capacity && sim.animals.some(a =>
              a.state === 'waiting' &&
              a.origin === el.targetFloor
            ));
          if (hasWork) {
            el.state = 'doors-opening';
            el.stateTimer = SIM_CONSTANTS.doorDuration;
          }
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
        animal.state = 'done';
        animal.elevator = null;
        el.passengers = el.passengers.filter(a => a.id !== animal.id);
        el.stateTimer = SIM_CONSTANTS.unloadingTime;
        break;
      }

      // Board waiting animals — direction-aware (but accept any direction when empty)
      const waiting = sim.animals.filter(a =>
        a.state === 'waiting' &&
        a.origin === currentFloor &&
        el.passengers.length < sim.capacity &&
        (el.direction === 0 || el.passengers.length === 0 || a.direction === el.direction)
      );
      if (waiting.length > 0 && el.stateTimer <= 0) {
        const animal = waiting[0];
        animal.state = 'boarding';
        animal.stateTimer = SIM_CONSTANTS.boardingTime;
        animal.elevator = el.id;
        // Adopt animal's direction when elevator has none
        if (el.direction === 0) el.direction = animal.direction;
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

    case 'doors-closing': {
      el.stateTimer -= dt;

      // Abort close if new passengers are waiting on this floor (door sensor)
      const closingFloor = Math.round(el.floor);
      const newWaiting = sim.animals.some(a =>
        a.state === 'waiting' &&
        a.origin === closingFloor &&
        el.passengers.length < sim.capacity &&
        (el.direction === 0 || el.passengers.length === 0 || a.direction === el.direction)
      );
      const needsUnload = el.passengers.some(a => a.dest === closingFloor);
      if (newWaiting || needsUnload) {
        // Reopen: reverse the remaining close progress into an opening
        const elapsed = SIM_CONSTANTS.doorDuration - el.stateTimer;
        el.state = 'doors-opening';
        el.stateTimer = elapsed; // time left to finish opening = how far we closed
        break;
      }

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
}
