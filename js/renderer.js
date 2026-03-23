// js/renderer.js — Canvas rendering for the elevator simulation

import { getFrame } from './sprites.js';

// Layout constants
const FLOOR_HEIGHT = 80;
const SHAFT_WIDTH = 70;
const FLOOR_LABEL_WIDTH = 40;
const WAITING_AREA_WIDTH = 100;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 60;
const SPRITE_SCALE = 2;
const ANIMAL_SPACING = 20;

export function getLayout(sim) {
  const buildingWidth = FLOOR_LABEL_WIDTH + WAITING_AREA_WIDTH + sim.elevators.length * SHAFT_WIDTH + 20;
  const buildingHeight = sim.floors * FLOOR_HEIGHT;
  return { buildingWidth, buildingHeight, FLOOR_HEIGHT, SHAFT_WIDTH, FLOOR_LABEL_WIDTH, WAITING_AREA_WIDTH };
}

export function render(ctx, sim, canvasW, canvasH, scrollY) {
  const dpr = window.devicePixelRatio || 1;
  const scale = dpr >= 2 ? 4 : 2;

  const layout = getLayout(sim);

  ctx.save();
  ctx.translate(0, -scrollY);

  drawBuilding(ctx, sim, layout, canvasW);
  drawElevators(ctx, sim, layout);
  drawAnimals(ctx, sim, layout, scale);

  ctx.restore();
}

function floorY(floor, layout) {
  return (layout.buildingHeight) - (floor + 1) * layout.FLOOR_HEIGHT;
}

function drawBuilding(ctx, sim, layout, canvasW) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvasW, layout.buildingHeight + 40);

  for (let f = 0; f < sim.floors; f++) {
    const y = floorY(f, layout);

    // Floor slab
    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(layout.FLOOR_LABEL_WIDTH, y + layout.FLOOR_HEIGHT - 6, canvasW - layout.FLOOR_LABEL_WIDTH, 6);

    // Floor number
    ctx.fillStyle = '#8888aa';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${f + 1}`, layout.FLOOR_LABEL_WIDTH - 8, y + layout.FLOOR_HEIGHT / 2 + 5);

    // Waiting area background
    ctx.fillStyle = '#16213e';
    ctx.fillRect(layout.FLOOR_LABEL_WIDTH, y, layout.WAITING_AREA_WIDTH, layout.FLOOR_HEIGHT - 6);
  }

  // Elevator shaft backgrounds
  const shaftStartX = layout.FLOOR_LABEL_WIDTH + layout.WAITING_AREA_WIDTH;
  for (let i = 0; i < sim.elevators.length; i++) {
    const sx = shaftStartX + i * layout.SHAFT_WIDTH;
    ctx.fillStyle = '#0f1a30';
    ctx.fillRect(sx, 0, layout.SHAFT_WIDTH, layout.buildingHeight);
    ctx.strokeStyle = '#333366';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, 0, layout.SHAFT_WIDTH, layout.buildingHeight);
  }
}

function drawElevators(ctx, sim, layout) {
  const shaftStartX = layout.FLOOR_LABEL_WIDTH + layout.WAITING_AREA_WIDTH;

  for (const el of sim.elevators) {
    const sx = shaftStartX + el.id * layout.SHAFT_WIDTH;
    const y = floorY(el.floor, layout);
    const carX = sx + (layout.SHAFT_WIDTH - CAR_WIDTH) / 2;
    const carY = y + (layout.FLOOR_HEIGHT - CAR_HEIGHT) / 2;

    // Elevator car body
    ctx.fillStyle = '#533483';
    ctx.fillRect(carX, carY, CAR_WIDTH, CAR_HEIGHT);

    // Door visualization
    const doorOpen = el.state === 'loading' || el.state === 'doors-opening' || el.state === 'doors-closing';
    if (doorOpen) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(carX + 8, carY + 4, CAR_WIDTH - 16, CAR_HEIGHT - 8);
    } else {
      ctx.strokeStyle = '#6a0572';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(carX + CAR_WIDTH / 2, carY + 4);
      ctx.lineTo(carX + CAR_WIDTH / 2, carY + CAR_HEIGHT - 4);
      ctx.stroke();
    }

    // Passenger count
    if (el.passengers.length > 0) {
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${el.passengers.length}`, carX + CAR_WIDTH / 2, carY - 4);
    }
  }
}

function drawAnimals(ctx, sim, layout, scale) {
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
      ctx.fillStyle = animal.direction > 0 ? '#4ade80' : '#f87171';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(animal.direction > 0 ? '\u25B2' : '\u25BC', ax + frame.fw * SPRITE_SCALE / 2, ay - 2);
    });
  }
}
