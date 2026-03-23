// js/eventlog.js — Event log panel at the bottom of the page

const logEl = document.getElementById('event-log');
const MAX_ENTRIES = 200;
let entryCount = 0;

/**
 * Get actor type from animal type string.
 * e.g. 'cat-black' → 'cat', 'dog-base' → 'dog', 'fox-red' → 'fox'
 */
function actorType(animalType) {
  if (animalType.startsWith('cat-')) return 'cat';
  if (animalType.startsWith('dog-')) return 'dog';
  if (animalType.startsWith('fox-')) return 'fox';
  return 'unknown';
}

/**
 * Log an event.
 * @param {string} type - 'cat' | 'dog' | 'fox' | 'elevator'
 * @param {number|string} id - actor id
 * @param {string} desc - event description
 */
export function logEvent(type, id, desc) {
  const now = performance.now();
  const ts = (now / 1000).toFixed(3);
  const entry = document.createElement('p');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-timestamp">${ts}s</span> <span class="actor-${type}">[${type}]</span> <span class="actor-${type}">[${id}]</span> ${desc}`;
  logEl.appendChild(entry);
  entryCount++;

  // Prune old entries
  while (entryCount > MAX_ENTRIES) {
    logEl.removeChild(logEl.firstChild);
    entryCount--;
  }

  // Auto-scroll to bottom
  logEl.scrollTop = logEl.scrollHeight;
}

/**
 * Log an animal event, deriving actor type from animal.type.
 */
export function logAnimalEvent(animal, desc) {
  logEvent(actorType(animal.type), animal.name || animal.id, desc);
}

export function clearLog() {
  logEl.innerHTML = '';
  entryCount = 0;
}
