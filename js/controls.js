// js/controls.js — Wire control strip inputs to simulation state

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
