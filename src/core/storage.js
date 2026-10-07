export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or disabled (private mode): the app keeps working in memory.
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored on purpose, see writeJSON.
  }
}
