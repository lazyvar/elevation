// js/sprites.js — Sprite manifest, loader, and frame animator

// Frame dimensions measured from actual sprite sheets:
// Cats walk: grid layout (3 cols), ~64x55 per frame, 8 frames
// Cats idle: horizontal strip, 64x64 per frame, 5 frames
// Dogs walk: horizontal strip, 64x55 per frame, 7 frames
// Dogs idle: horizontal strip, 64x64 per frame, 5 frames
// Foxes walk: horizontal strip, 64x64 per frame, 8 frames
// Foxes idle: horizontal strip, 64x64 per frame, 4 frames

const MANIFEST = {
  // Cats
  'cat-black':    { walk: { src: 'assets/sprites/cats/black-walk.png',    fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/black-idle.png',    fw: 64, fh: 64, cols: 5, count: 5 } },
  'cat-grey':     { walk: { src: 'assets/sprites/cats/grey-walk.png',     fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/grey-idle.png',     fw: 64, fh: 64, cols: 5, count: 5 } },
  'cat-pinkie':   { walk: { src: 'assets/sprites/cats/pinkie-walk.png',   fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/pinkie-idle.png',   fw: 64, fh: 64, cols: 5, count: 5 } },
  'cat-siamese':  { walk: { src: 'assets/sprites/cats/siamese-walk.png',  fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/siamese-idle.png',  fw: 64, fh: 64, cols: 5, count: 5 } },
  'cat-yellow':   { walk: { src: 'assets/sprites/cats/yellow-walk.png',   fw: 64, fh: 55, cols: 3, count: 8 },
                    idle: { src: 'assets/sprites/cats/yellow-idle.png',   fw: 64, fh: 64, cols: 5, count: 5 } },
  // Dogs
  'dog-base':       { walk: { src: 'assets/sprites/dogs/base-walk.png',       fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/base-idle.png',       fw: 64, fh: 64, cols: 5, count: 5 } },
  'dog-blackwhite': { walk: { src: 'assets/sprites/dogs/blackwhite-walk.png', fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/blackwhite-idle.png', fw: 64, fh: 64, cols: 5, count: 5 } },
  'dog-black':      { walk: { src: 'assets/sprites/dogs/black-walk.png',      fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/black-idle.png',      fw: 64, fh: 64, cols: 5, count: 5 } },
  'dog-brown':      { walk: { src: 'assets/sprites/dogs/brown-walk.png',      fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/brown-idle.png',      fw: 64, fh: 64, cols: 5, count: 5 } },
  'dog-exotic':     { walk: { src: 'assets/sprites/dogs/exotic-walk.png',     fw: 64, fh: 55, cols: 7, count: 7 },
                      idle: { src: 'assets/sprites/dogs/exotic-idle.png',     fw: 64, fh: 64, cols: 5, count: 5 } },
  // Foxes
  'fox-arctic':  { walk: { src: 'assets/sprites/foxes/arctic-walk.png',  fw: 64, fh: 64, cols: 8, count: 8 },
                   idle: { src: 'assets/sprites/foxes/arctic-idle.png',  fw: 64, fh: 64, cols: 4, count: 4 } },
  'fox-red':     { walk: { src: 'assets/sprites/foxes/red-walk.png',     fw: 64, fh: 64, cols: 8, count: 8 },
                   idle: { src: 'assets/sprites/foxes/red-idle.png',     fw: 64, fh: 64, cols: 4, count: 4 } },
  'fox-silver':  { walk: { src: 'assets/sprites/foxes/silver-walk.png',  fw: 64, fh: 64, cols: 8, count: 8 },
                   idle: { src: 'assets/sprites/foxes/silver-idle.png',  fw: 64, fh: 64, cols: 4, count: 4 } },
};

export const ANIMAL_TYPES = Object.keys(MANIFEST);

const images = new Map();

export async function loadSprites() {
  const promises = [];
  for (const [type, anims] of Object.entries(MANIFEST)) {
    for (const [anim, info] of Object.entries(anims)) {
      const key = `${type}:${anim}`;
      const img = new Image();
      const p = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(`Failed to load ${info.src}`));
      });
      img.src = info.src;
      images.set(key, { img, ...info });
      promises.push(p);
    }
  }
  await Promise.all(promises);
}

/**
 * Get the source rect for a specific animation frame.
 * @param {string} type - e.g. 'cat-black'
 * @param {string} anim - 'walk' or 'idle'
 * @param {number} frame - frame index (will be wrapped)
 * @returns {{ img, sx, sy, sw, sh, fw, fh }}
 */
export function getFrame(type, anim, frame) {
  const key = `${type}:${anim}`;
  const data = images.get(key);
  if (!data) return null;
  const f = frame % data.count;
  const col = f % data.cols;
  const row = Math.floor(f / data.cols);
  return {
    img: data.img,
    sx: col * data.fw,
    sy: row * data.fh,
    sw: data.fw,
    sh: data.fh,
    fw: data.fw,
    fh: data.fh,
  };
}

/** Get total frame count for an animation */
export function getFrameCount(type, anim) {
  const key = `${type}:${anim}`;
  const data = images.get(key);
  return data ? data.count : 0;
}
