import { useRef, useSyncExternalStore, useCallback } from 'react';

type Listener = () => void;

interface ReactiveStore<T extends object> {
  proxy: T;
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => number;
}

function createReactiveStore<T extends object>(initial: T): ReactiveStore<T> {
  const listeners = new Set<Listener>();
  let version = 0;

  function notify() {
    version++;
    listeners.forEach((l) => l());
  }

  function createProxy<O extends object>(target: O): O {
    const proxyCache = new WeakMap<object, object>();

    const handler: ProxyHandler<O> = {
      get(obj, prop, receiver) {
        const value = Reflect.get(obj, prop, receiver);
        if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
          if (!proxyCache.has(value as object)) {
            proxyCache.set(value as object, createProxy(value as object));
          }
          return proxyCache.get(value as object);
        }
        return value;
      },
      set(obj, prop, value, receiver) {
        const oldValue = Reflect.get(obj, prop, receiver);
        if (Object.is(oldValue, value)) return true;
        const result = Reflect.set(obj, prop, value, receiver);
        if (result) {
          proxyCache.delete(oldValue as object);
          notify();
        }
        return result;
      },
      deleteProperty(obj, prop) {
        const result = Reflect.deleteProperty(obj, prop);
        if (result) notify();
        return result;
      },
    };

    return new Proxy(target, handler);
  }

  const proxy = createProxy(initial);

  return {
    proxy,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => version,
  };
}

/**
 * useReactive - Proxy-based mutable reactive state.
 *
 * Instead of `const [count, setCount] = useState(0)`, write:
 * ```
 * const state = useReactive({ count: 0, name: 'hello' });
 * state.count++;        // triggers re-render
 * state.name = 'world'; // triggers re-render
 * ```
 *
 * Supports deeply nested objects — mutations at any level trigger re-renders.
 */
export function useReactive<T extends object>(initialState: T | (() => T)): T {
  const storeRef = useRef<ReactiveStore<T> | null>(null);

  if (storeRef.current === null) {
    const initial = typeof initialState === 'function'
      ? (initialState as () => T)()
      : initialState;
    storeRef.current = createReactiveStore(structuredClone(initial));
  }

  const store = storeRef.current;

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(onStoreChange),
    [store],
  );

  useSyncExternalStore(
    subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  return store.proxy;
}
