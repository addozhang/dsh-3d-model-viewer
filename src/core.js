// React is injected at factory time by the module loader; modules read it
// through this shared holder.
export let React = null;
export let h = null;

export function setReact(react) {
  React = react;
  h = react.createElement;
}

export function makeStore() {
  let state = { open: false, name: "", mesh: null, error: "", loading: false };
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    set: (patch) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); },
  };
}

export function makeSessionStore() {
  let state = { files: [], selected: "", mesh: null, error: "", loading: false, mtime: 0 };
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    set: (patch) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); },
  };
}

export const useStore = (store) => React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
