import { readJSON, writeJSON } from './storage.js';

export function createStore(initialState, { persistKey } = {}) {
  // Descarta claves persistidas con forma inválida (null o tipo distinto al
  // valor inicial) para que un storage corrupto no rompa lecturas como
  // `enrollments[userId]` o `accounts.find`.
  const sanitizePersisted = (persisted) => {
    if (!persisted || typeof persisted !== 'object') return {};
    const clean = {};
    Object.entries(persisted).forEach(([key, value]) => {
      if (!(key in initialState)) return;
      const expected = initialState[key];
      if (Array.isArray(expected)) {
        if (Array.isArray(value)) clean[key] = value;
        return;
      }
      if (expected !== null && typeof expected === 'object') {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) clean[key] = value;
        return;
      }
      clean[key] = value;
    });
    return clean;
  };

  let state = persistKey ? { ...initialState, ...sanitizePersisted(readJSON(persistKey, {})) } : initialState;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(patch) {
    const previous = state;
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    if (persistKey) writeJSON(persistKey, state);
    listeners.forEach((listener) => listener(state, previous));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function watch(selector, callback) {
    let current = selector(state);
    callback(current);
    return subscribe((next) => {
      const value = selector(next);
      if (value !== current) {
        current = value;
        callback(value);
      }
    });
  }

  return { getState, setState, subscribe, watch };
}
