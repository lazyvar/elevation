// js/controls.js — Wire control strip inputs to simulation state

const SCENARIOS = {
  chaos:      { floors: 12, elevators: 10, capacity: 1,  algorithm: 'scan',       spawnRate: 50 },
  'lone-lift':{ floors: 12, elevators: 1,  capacity: 1,  algorithm: 'scan',       spawnRate: 30 },
  express:    { floors: 8,  elevators: 3,  capacity: 8,  algorithm: 'nearest',    spawnRate: 70 },
  skyscraper: { floors: 40, elevators: 6,  capacity: 10, algorithm: 'scan',       spawnRate: 60 },
  'rush-hour':{ floors: 10, elevators: 4,  capacity: 4,  algorithm: 'roundrobin', spawnRate: 100 },
  penthouse:  { floors: 20, elevators: 2,  capacity: 3,  algorithm: 'nearest',    spawnRate: 40 },
  sardines:   { floors: 5,  elevators: 2,  capacity: 20, algorithm: 'roundrobin', spawnRate: 80 },
  'scan-sweep':       { floors: 30, elevators: 3, capacity: 6,  algorithm: 'scan',       spawnRate: 65 },
  'nearest-cluster':  { floors: 8,  elevators: 5, capacity: 4,  algorithm: 'nearest',    spawnRate: 90 },
  'rr-balance':       { floors: 10, elevators: 6, capacity: 4,  algorithm: 'roundrobin', spawnRate: 70 },
};

export function setupControls(callbacks) {
  const els = {
    btnPlay: document.getElementById('btn-play'),
    btnStep: document.getElementById('btn-step'),
    btnReset: document.getElementById('btn-reset'),
    btnSpawn: document.getElementById('btn-spawn'),
    btnClear: document.getElementById('btn-clear'),
    speed: document.getElementById('speed'),
    speedVal: document.getElementById('speed-val'),
    floors: document.getElementById('floors'),
    elevators: document.getElementById('elevators'),
    capacity: document.getElementById('capacity'),
    spawnRate: document.getElementById('spawn-rate'),
    spawnRateVal: document.getElementById('spawn-rate-val'),
    algorithm: document.getElementById('algorithm'),
    scenario: document.getElementById('scenario'),
  };

  let paused = true;

  els.btnPlay.addEventListener('click', () => {
    paused = !paused;
    els.btnPlay.textContent = paused ? '\u25B6' : '\u23F8';
    callbacks.onPauseToggle(paused);
  });

  els.btnStep.addEventListener('click', () => {
    callbacks.onStep();
  });

  els.speed.addEventListener('input', () => {
    const val = parseFloat(els.speed.value);
    els.speedVal.textContent = `${val}x`;
    callbacks.onSpeedChange(val);
  });

  els.btnReset.addEventListener('click', () => {
    paused = true;
    els.btnPlay.textContent = '\u25B6';
    callbacks.onReset(getConfig());
  });

  for (const input of [els.floors, els.elevators, els.capacity]) {
    input.addEventListener('change', () => {
      paused = true;
      els.btnPlay.textContent = '\u25B6';
      callbacks.onReset(getConfig());
    });
  }

  els.spawnRate.addEventListener('input', () => {
    const val = parseInt(els.spawnRate.value);
    els.spawnRateVal.textContent = val;
    // val 0 = no spawning (threshold above max noise), val 100 = max spawning
    const threshold = val === 0 ? Infinity : 0.9 - (val / 100) * 0.6;
    callbacks.onSpawnRateChange(threshold);
  });

  els.algorithm.addEventListener('change', () => {
    callbacks.onAlgorithmChange(els.algorithm.value);
  });

  els.btnSpawn.addEventListener('click', () => {
    callbacks.onManualSpawn();
  });

  els.btnClear.addEventListener('click', () => {
    callbacks.onClearAnimals();
  });

  els.scenario.addEventListener('change', () => {
    const preset = SCENARIOS[els.scenario.value];
    if (!preset) return; // custom — do nothing
    applyPreset(preset);
    paused = true;
    els.btnPlay.textContent = '\u25B6';
    callbacks.onReset(getConfig());
  });

  function applyPreset(preset) {
    els.floors.value = preset.floors;
    els.elevators.value = preset.elevators;
    els.capacity.value = preset.capacity;
    els.algorithm.value = preset.algorithm;
    els.spawnRate.value = preset.spawnRate;
    els.spawnRateVal.textContent = preset.spawnRate;
    callbacks.onAlgorithmChange(preset.algorithm);
    const threshold = preset.spawnRate === 0 ? Infinity : 0.9 - (preset.spawnRate / 100) * 0.6;
    callbacks.onSpawnRateChange(threshold);
  }

  function getConfig() {
    return {
      floors: parseInt(els.floors.value),
      elevators: parseInt(els.elevators.value),
      capacity: parseInt(els.capacity.value),
      algorithm: els.algorithm.value,
    };
  }

  return {
    config: getConfig(),
    paused,
    speed: parseFloat(els.speed.value),
    spawnThreshold: parseInt(els.spawnRate.value) === 0 ? Infinity : 0.9 - (parseInt(els.spawnRate.value) / 100) * 0.6,
  };
}
