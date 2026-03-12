import { useCallback, useRef, useSyncExternalStore } from 'react';

interface SharedStore<T> {
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number;
  destroy: () => void;
}

// Global registry so multiple components using the same key share the same store
const stores = new Map<string, SharedStore<unknown>>();
const storeCounts = new Map<string, number>();

function getOrCreateStore<T>(key: string, initial: T): SharedStore<T> {
  if (stores.has(key)) {
    storeCounts.set(key, (storeCounts.get(key) ?? 0) + 1);
    return stores.get(key)! as SharedStore<T>;
  }

  let value: T;
  let version = 0;
  const listeners = new Set<() => void>();
  let channel: BroadcastChannel | null = null;

  // Try to restore from localStorage
  try {
    const stored = localStorage.getItem(`__shared_state_${key}`);
    value = stored !== null ? JSON.parse(stored) : initial;
  } catch {
    value = initial;
  }

  function notify() {
    version++;
    listeners.forEach((l) => l());
  }

  function persist(val: T) {
    try {
      localStorage.setItem(`__shared_state_${key}`, JSON.stringify(val));
    } catch {
      // Storage full or unavailable — degrade gracefully
    }
  }

  // Set up cross-tab communication
  try {
    channel = new BroadcastChannel(`__shared_state_${key}`);
    channel.onmessage = (event) => {
      value = event.data as T;
      notify();
    };
  } catch {
    // BroadcastChannel not available (SSR, old browsers) — localStorage-only fallback
    if (typeof window !== 'undefined') {
      const onStorage = (e: StorageEvent) => {
        if (e.key === `__shared_state_${key}` && e.newValue !== null) {
          try {
            value = JSON.parse(e.newValue);
            notify();
          } catch {
            // ignore parse errors
          }
        }
      };
      window.addEventListener('storage', onStorage);
    }
  }

  const store: SharedStore<T> = {
    get: () => value,
    set: (valueOrFn) => {
      const next =
        typeof valueOrFn === 'function'
          ? (valueOrFn as (prev: T) => T)(value)
          : valueOrFn;
      value = next;
      persist(next);
      channel?.postMessage(next);
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => version,
    destroy: () => {
      channel?.close();
      listeners.clear();
    },
  };

  stores.set(key, store as SharedStore<unknown>);
  storeCounts.set(key, 1);
  return store;
}

/**
 * useSharedState - State that syncs across browser tabs/windows.
 *
 * Uses BroadcastChannel for instant cross-tab sync with localStorage
 * persistence. Falls back to storage events when BroadcastChannel is unavailable.
 *
 * ```
 * // In Tab 1:
 * const [theme, setTheme] = useSharedState('theme', 'light');
 * setTheme('dark');
 *
 * // In Tab 2 (automatically updated):
 * const [theme, setTheme] = useSharedState('theme', 'light');
 * // theme === 'dark'
 * ```
 *
 * Multiple components within the same tab also share the same state instance.
 */
export function useSharedState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const storeRef = useRef<SharedStore<T> | null>(null);

  if (storeRef.current === null) {
    storeRef.current = getOrCreateStore(key, initialValue);
  }

  const store = storeRef.current;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsub = store.subscribe(onStoreChange);
      return () => {
        unsub();
        const count = (storeCounts.get(key) ?? 1) - 1;
        if (count <= 0) {
          store.destroy();
          stores.delete(key);
          storeCounts.delete(key);
        } else {
          storeCounts.set(key, count);
        }
      };
    },
    [store, key],
  );

  useSyncExternalStore(subscribe, store.getSnapshot, store.getSnapshot);

  return [store.get(), store.set];
}
