import { useCallback, useRef, useSyncExternalStore } from 'react';

interface HistoryControls<T> {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  history: readonly T[];
  pointer: number;
}

type UseHistoryReturn<T> = [
  state: T,
  setState: (value: T | ((prev: T) => T)) => void,
  controls: HistoryControls<T>,
];

interface HistoryOptions {
  maxSize?: number;
}

interface HistoryStore<T> {
  getState: () => T;
  setState: (value: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  getCanUndo: () => boolean;
  getCanRedo: () => boolean;
  getHistory: () => readonly T[];
  getPointer: () => number;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number;
}

function createHistoryStore<T>(initial: T, maxSize: number): HistoryStore<T> {
  let stack: T[] = [initial];
  let pointer = 0;
  let version = 0;
  const listeners = new Set<() => void>();

  function notify() {
    version++;
    listeners.forEach((l) => l());
  }

  return {
    getState: () => stack[pointer],
    setState: (value) => {
      const prev = stack[pointer];
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
      // Discard forward history
      stack = stack.slice(0, pointer + 1);
      stack.push(next);
      // Enforce max size
      if (stack.length > maxSize) {
        stack = stack.slice(stack.length - maxSize);
      }
      pointer = stack.length - 1;
      notify();
    },
    undo: () => {
      if (pointer > 0) {
        pointer--;
        notify();
      }
    },
    redo: () => {
      if (pointer < stack.length - 1) {
        pointer++;
        notify();
      }
    },
    clear: () => {
      const current = stack[pointer];
      stack = [current];
      pointer = 0;
      notify();
    },
    getCanUndo: () => pointer > 0,
    getCanRedo: () => pointer < stack.length - 1,
    getHistory: () => stack,
    getPointer: () => pointer,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => version,
  };
}

/**
 * useHistory - State with built-in undo/redo.
 *
 * ```
 * const [value, setValue, { undo, redo, canUndo, canRedo }] = useHistory('');
 *
 * setValue('hello');
 * setValue('world');
 * undo(); // value is 'hello'
 * redo(); // value is 'world'
 * ```
 *
 * Options:
 * - `maxSize`: Maximum number of history entries (default: 100)
 */
export function useHistory<T>(
  initialValue: T,
  options: HistoryOptions = {},
): UseHistoryReturn<T> {
  const { maxSize = 100 } = options;

  const storeRef = useRef<HistoryStore<T> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createHistoryStore(initialValue, maxSize);
  }
  const store = storeRef.current;

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(onStoreChange),
    [store],
  );

  useSyncExternalStore(subscribe, store.getSnapshot, store.getSnapshot);

  const controls: HistoryControls<T> = {
    undo: store.undo,
    redo: store.redo,
    canUndo: store.getCanUndo(),
    canRedo: store.getCanRedo(),
    clear: store.clear,
    history: store.getHistory(),
    pointer: store.getPointer(),
  };

  return [store.getState(), store.setState, controls];
}
