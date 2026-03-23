// tests/perlin.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { perlin1d, seedPerlin } from '../js/perlin.js';

describe('perlin1d', () => {
  it('returns values in [0, 1]', () => {
    seedPerlin(42);
    for (let i = 0; i < 1000; i++) {
      const v = perlin1d(i * 0.05);
      assert.ok(v >= 0 && v <= 1, `Value ${v} out of range at t=${i * 0.05}`);
    }
  });

  it('is deterministic for the same seed', () => {
    seedPerlin(123);
    const a = perlin1d(0.5);
    seedPerlin(123);
    const b = perlin1d(0.5);
    assert.strictEqual(a, b);
  });

  it('varies over time (not constant)', () => {
    seedPerlin(99);
    const values = new Set();
    for (let i = 0; i < 100; i++) {
      values.add(perlin1d(i * 0.1).toFixed(4));
    }
    assert.ok(values.size > 10, `Expected variation, got only ${values.size} unique values`);
  });

  it('is smooth (adjacent samples are close)', () => {
    seedPerlin(7);
    const step = 0.01;
    for (let t = 0; t < 10; t += step) {
      const a = perlin1d(t);
      const b = perlin1d(t + step);
      const diff = Math.abs(a - b);
      assert.ok(diff < 0.2, `Jump of ${diff} at t=${t}`);
    }
  });
});
