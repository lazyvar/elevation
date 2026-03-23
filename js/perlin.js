// js/perlin.js — Classic 1D Perlin noise, normalized to [0, 1]

let perm = new Uint8Array(512);

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function grad1d(hash, x) {
  return (hash & 1) === 0 ? x : -x;
}

export function seedPerlin(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // Fisher-Yates shuffle with seed
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  perm.set(p);
  perm.copyWithin(256, 0, 256);
}

export function perlin1d(x) {
  const xi = Math.floor(x) & 255;
  const xf = x - Math.floor(x);
  const u = fade(xf);
  const a = grad1d(perm[xi], xf);
  const b = grad1d(perm[xi + 1], xf - 1);
  // Raw Perlin is in [-1, 1], normalize to [0, 1]
  return (lerp(a, b, u) + 1) / 2;
}

// Default seed
seedPerlin(Date.now());
