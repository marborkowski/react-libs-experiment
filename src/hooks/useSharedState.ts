import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Adapter interface for optional persistence.
 * Implement this to add custom storage backends (e.g. IndexedDB, encrypted storage).
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SharedStateOptions<T> {
  /**
   * Optional persistence layer.
   * - `'localStorage'` — use window.localStorage
   * - `'sessionStorage'` — use window.sessionStorage
   * - `StorageAdapter` — custom adapter implementing getItem/setItem/removeItem
   * - `undefined` (default) — no persistence, pure in-memory
   */
  persist?: 'localStorage' | 'sessionStorage' | StorageAdapter;

  /**
   * Custom serializer (default: JSON.stringify).
   * Only used when `persist` is set.
   */
  serialize?: (value: T) => string;

  /**
   * Custom deserializer (default: JSON.parse).
   * Only used when `persist` is set.
   */
  deserialize?: (raw: string) => T;
}

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

function resolveAdapter(
  persist: SharedStateOptions<unknown>['persist'],
): StorageAdapter | null {
  if (!persist) return null;
  if (persist === 'localStorage' && typeof localStorage !== 'undefined') {
    return localStorage;
  }
  if (persist === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
    return sessionStorage;
  }
  if (typeof persist === 'object') return persist;
  return null;
}

function getOrCreateStore<T>(
  key: string,
  initial: T,
  options: SharedStateOptions<T>,
): SharedStore<T> {
  if (stores.has(key)) {
    storeCounts.set(key, (storeCounts.get(key) ?? 0) + 1);
    return stores.get(key)! as SharedStore<T>;
  }

  const serialize = options.serialize ?? JSON.stringify;
  const deserialize = options.deserialize ?? JSON.parse;
  const adapter = resolveAdapter(options.persist);

  let value: T;
  let version = 0;
  const listeners = new Set<() => void>();
  let channel: BroadcastChannel | null = null;
  let storageCleanup: (() => void) | null = null;

  // Restore from storage adapter if provided
  if (adapter) {
    try {
      const stored = adapter.getItem(`__shared_state_${key}`);
      value = stored !== null ? deserialize(stored) : initial;
    } catch {
      value = initial;
    }
  } else {
    value = initial;
  }

  function notify() {
    version++;
    listeners.forEach((l) => l());
  }

  function persist(val: T) {
    if (!adapter) return;
    try {
      adapter.setItem(`__shared_state_${key}`, serialize(val));
    } catch {
      // Storage full or unavailable — degrade gracefully
    }
  }

  // Set up cross-tab communication via BroadcastChannel
  try {
    channel = new BroadcastChannel(`__shared_state_${key}`);
    channel.onmessage = (event) => {
      value = event.data as T;
      notify();
    };
  } catch {
    // BroadcastChannel not available (SSR, old browsers)
    // Fall back to storage events only if a persistent adapter is active
    if (adapter && typeof window !== 'undefined') {
      const onStorage = (e: StorageEvent) => {
        if (e.key === `__shared_state_${key}` && e.newValue !== null) {
          try {
            value = deserialize(e.newValue);
            notify();
          } catch {
            // ignore parse errors
          }
        }
      };
      window.addEventListener('storage', onStorage);
      storageCleanup = () => window.removeEventListener('storage', onStorage);
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
      storageCleanup?.();
      listeners.clear();
    },
  };

  stores.set(key, store as SharedStore<unknown>);
  storeCounts.set(key, 1);
  return store;
}

/**
 * useSharedState - State that syncs across components and browser tabs.
 *
 * By default, state is **in-memory only** with cross-tab sync via BroadcastChannel.
 * Optionally, pass a `persist` adapter for durable storage.
 *
 * ```
 * // In-memory only (default) — no localStorage!
 * const [count, setCount] = useSharedState('counter', 0);
 *
 * // With localStorage persistence
 * const [theme, setTheme] = useSharedState('theme', 'light', {
 *   persist: 'localStorage',
 * });
 *
 * // With sessionStorage (cleared on tab close)
 * const [token, setToken] = useSharedState('token', '', {
 *   persist: 'sessionStorage',
 * });
 *
 * // With custom adapter
 * const [data, setData] = useSharedState('data', defaults, {
 *   persist: myEncryptedStorageAdapter,
 *   serialize: (v) => encrypt(JSON.stringify(v)),
 *   deserialize: (s) => JSON.parse(decrypt(s)),
 * });
 * ```
 */
export function useSharedState<T>(
  key: string,
  initialValue: T,
  options: SharedStateOptions<T> = {},
): [T, (value: T | ((prev: T) => T)) => void] {
  const optionsRef = useRef(options);
  const storeRef = useRef<SharedStore<T> | null>(null);

  if (storeRef.current === null) {
    storeRef.current = getOrCreateStore(key, initialValue, optionsRef.current);
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

  // Reset store ref if key changes (unlikely but defensive)
  useEffect(() => {
    return () => {
      storeRef.current = null;
    };
  }, [key]);

  return [store.get(), store.set];
}
