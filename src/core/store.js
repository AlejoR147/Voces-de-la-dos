import { readJSON, writeJSON } from './storage.js';

export function createStore(initialState, { persistKey } = {}) {
  let state = persistKey ? { ...initialState, ...readJSON(persistKey, {}) } : initialState;
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
