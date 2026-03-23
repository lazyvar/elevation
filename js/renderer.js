// js/renderer.js — Canvas rendering for the elevator simulation

import { getFrame } from './sprites.js';
import { SIM_CONSTANTS } from './sim.js';

// Layout constants
const FLOOR_HEIGHT = 80;
const SHAFT_WIDTH = 80;
const SHAFT_GAP = 32;
const FLOOR_LABEL_WIDTH = 40;
const WAITING_AREA_WIDTH = 200;
const SPRITE_SCALE = 1;
const ANIMAL_SPACING = 50;

// Elevator sprite images (loaded async)
const elevatorImages = {};
const ELEVATOR_SPRITES = {
  closed: 'assets/sprites/elevator/lift-closed.png',   // 96x64, 3 frames @ 32x64
  open: 'assets/sprites/elevator/lift-open.png',        // 192x64, 3 frames @ 64x64
  door: 'assets/sprites/elevator/lift-door.png',        // 192x64, 3 frames @ 64x64
  rail: 'assets/sprites/elevator/rail.png',              // 12x32
  shaftTile1: 'assets/sprites/elevator/shaft-tile1.png', // 32x64
  shaftTile2: 'assets/sprites/elevator/shaft-tile2.png', // 32x64
};

// Load elevator sprites
for (const [key, src] of Object.entries(ELEVATOR_SPRITES)) {
  const img = new Image();
  img.src = src;
  elevatorImages[key] = img;
}

// Elevator car dimensions (from sprite)
const CAR_WIDTH = 64;
const CAR_HEIGHT = 64;

export function getLayout(sim) {
  const buildingWidth = FLOOR_LABEL_WIDTH + WAITING_AREA_WIDTH + sim.elevators.length * (SHAFT_WIDTH + SHAFT_GAP) + 20;
  const buildingHeight = sim.floors * FLOOR_HEIGHT;
  return { buildingWidth, buildingHeight, FLOOR_HEIGHT, SHAFT_WIDTH, SHAFT_GAP, FLOOR_LABEL_WIDTH, WAITING_AREA_WIDTH };
}

export function render(ctx, sim, canvasW, canvasH, scrollY) {
  const layout = getLayout(sim);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Anchor building to bottom of canvas
  const bottomOffset = Math.max(0, canvasH - layout.buildingHeight);
  ctx.translate(0, bottomOffset - scrollY);

  drawBuilding(ctx, sim, layout, canvasW);
  drawElevators(ctx, sim, layout);
  drawAnimals(ctx, sim, layout);

  ctx.restore();
}

function floorY(floor, layout) {
  return layout.buildingHeight - (floor + 1) * layout.FLOOR_HEIGHT;
}

function drawBuilding(ctx, sim, layout, canvasW) {
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(0, -canvasW, canvasW, layout.buildingHeight + canvasW + 40);

  for (let f = 0; f < sim.floors; f++) {
    const y = floorY(f, layout);

    // Floor slab
    ctx.fillStyle = '#ccc';
    ctx.fillRect(layout.FLOOR_LABEL_WIDTH, y + layout.FLOOR_HEIGHT - 6, canvasW - layout.FLOOR_LABEL_WIDTH, 6);

    // Floor number
    ctx.fillStyle = '#666';
    ctx.font = '14px Sora, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${f + 1}`, layout.FLOOR_LABEL_WIDTH - 8, y + layout.FLOOR_HEIGHT / 2 + 5);

    // Waiting area background
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(layout.FLOOR_LABEL_WIDTH, y, layout.WAITING_AREA_WIDTH, layout.FLOOR_HEIGHT - 6);
  }

  // Elevator shaft backgrounds with tiled sprites
  const shaftStartX = layout.FLOOR_LABEL_WIDTH + layout.WAITING_AREA_WIDTH;
  const tile1 = elevatorImages.shaftTile1;
  const tile2 = elevatorImages.shaftTile2;
  const rail = elevatorImages.rail;

  for (let i = 0; i < sim.elevators.length; i++) {
    const sx = shaftStartX + i * (layout.SHAFT_WIDTH + layout.SHAFT_GAP);

    // Fill shaft background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(sx, 0, layout.SHAFT_WIDTH, layout.buildingHeight);

    // Tile the shaft walls if loaded
    if (tile1.complete && tile1.naturalWidth > 0) {
      const tileW = 32;
      const tileH = 64;
      for (let ty = 0; ty < layout.buildingHeight; ty += tileH) {
        // Left wall tile
        ctx.drawImage(tile1, sx, ty, tileW, tileH);
        // Right wall tile
        ctx.drawImage(tile2, sx + layout.SHAFT_WIDTH - tileW, ty, tileW, tileH);
      }
    }

    // Draw rails on each side if loaded
    if (rail.complete && rail.naturalWidth > 0) {
      const railW = 12;
      const railH = 32;
      for (let ry = 0; ry < layout.buildingHeight; ry += railH) {
        ctx.drawImage(rail, sx + 34, ry, railW, railH);
        ctx.drawImage(rail, sx + layout.SHAFT_WIDTH - 34 - railW, ry, railW, railH);
      }
    }

    // Shaft border
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, 0, layout.SHAFT_WIDTH, layout.buildingHeight);
  }
}

function drawElevators(ctx, sim, layout) {
  const shaftStartX = layout.FLOOR_LABEL_WIDTH + layout.WAITING_AREA_WIDTH;
  const closedImg = elevatorImages.closed;
  const openImg = elevatorImages.open;
  const doorImg = elevatorImages.door;

  for (const el of sim.elevators) {
    const sx = shaftStartX + el.id * (layout.SHAFT_WIDTH + layout.SHAFT_GAP);
    const y = floorY(el.floor, layout);
    const carX = sx + (layout.SHAFT_WIDTH - CAR_WIDTH) / 2;
    const carY = y + (layout.FLOOR_HEIGHT - CAR_HEIGHT) / 2;

    // Compute door openness as 0 (closed) to 1 (fully open)
    let doorOpenness = 0;
    if (el.state === 'doors-opening') {
      doorOpenness = 1 - (el.stateTimer / SIM_CONSTANTS.doorDuration);
    } else if (el.state === 'doors-closing') {
      doorOpenness = el.stateTimer / SIM_CONSTANTS.doorDuration;
    } else if (el.state === 'loading') {
      doorOpenness = 1;
    }
    doorOpenness = Math.max(0, Math.min(1, doorOpenness));

    if (closedImg.complete && closedImg.naturalWidth > 0) {
      // Animate using 3 frames from lift-closed.png (32x64 each)
      // frame 0 = closed, frame 1 = half open, frame 2 = fully open
      let frameIdx;
      if (doorOpenness < 0.33) frameIdx = 0;
      else if (doorOpenness < 0.66) frameIdx = 1;
      else frameIdx = 2;
      ctx.drawImage(closedImg, frameIdx * 32, 0, 32, 64, carX, carY, CAR_WIDTH, CAR_HEIGHT);
    } else {
      // Fallback rectangle
      ctx.fillStyle = '#333';
      ctx.fillRect(carX, carY, CAR_WIDTH, CAR_HEIGHT);
    }

    // Passenger count
    if (el.passengers.length > 0) {
      ctx.fillStyle = '#111';
      ctx.font = '11px Sora, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${el.passengers.length}`, carX + CAR_WIDTH / 2, carY - 4);
    }
  }
}

function drawAnimals(ctx, sim, layout) {
  ctx.imageSmoothingEnabled = false;

  // Group waiting/exiting animals by floor
  const waitingByFloor = {};
  for (const animal of sim.animals) {
    if (animal.state === 'waiting' || animal.state === 'exiting') {
      const f = animal.state === 'waiting' ? animal.origin : animal.dest;
      if (!waitingByFloor[f]) waitingByFloor[f] = [];
      waitingByFloor[f].push(animal);
    }
  }

  // Draw waiting/exiting animals
  for (const [floor, animals] of Object.entries(waitingByFloor)) {
    const y = floorY(Number(floor), layout);
    animals.forEach((animal, i) => {
      const anim = animal.state === 'waiting' ? 'idle' : 'walk';
      const frame = getFrame(animal.type, anim, animal.animFrame);
      if (!frame) return;

      const ax = layout.FLOOR_LABEL_WIDTH + 8 + i * ANIMAL_SPACING;
      const ay = y + layout.FLOOR_HEIGHT - 6 - frame.fh * SPRITE_SCALE;

      ctx.drawImage(
        frame.img,
        frame.sx, frame.sy, frame.sw, frame.sh,
        ax, ay, frame.fw * SPRITE_SCALE, frame.fh * SPRITE_SCALE
      );

      // Direction arrow
      ctx.fillStyle = animal.direction > 0 ? '#16a34a' : '#dc2626';
      ctx.font = '10px Sora, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(animal.direction > 0 ? '\u25B2' : '\u25BC', ax + frame.fw * SPRITE_SCALE / 2, ay - 2);
    });
  }
}
