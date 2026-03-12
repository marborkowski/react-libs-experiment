import { useRef, useReducer, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

interface AsyncStateReturn<T> extends AsyncState<T> {
  /** Re-execute the async function */
  retry: () => void;
  /** Cancel the current execution */
  cancel: () => void;
  /** Manually set the data */
  setData: (data: T) => void;
}

interface AsyncStateOptions {
  /** Execute immediately on mount (default: true) */
  immediate?: boolean;
  /** Number of retry attempts on error (default: 0) */
  retryCount?: number;
  /** Base delay in ms between retries, doubles each attempt (default: 1000) */
  retryDelay?: number;
  /** Called when the async function succeeds */
  onSuccess?: (data: unknown) => void;
  /** Called when the async function fails */
  onError?: (error: Error) => void;
}

type Action<T> =
  | { type: 'loading' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: Error }
  | { type: 'setData'; data: T }
  | { type: 'reset' };

function reducer<T>(state: AsyncState<T>, action: Action<T>): AsyncState<T> {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: undefined };
    case 'success':
      return { data: action.data, loading: false, error: undefined };
    case 'error':
      return { ...state, loading: false, error: action.error };
    case 'setData':
      return { data: action.data, loading: false, error: undefined };
    case 'reset':
      return { data: undefined, loading: false, error: undefined };
  }
}

/**
 * useAsyncState - Async-native state primitive with loading/error tracking,
 * cancellation, and retry support.
 *
 * ```
 * const { data, loading, error, retry, cancel } = useAsyncState(
 *   async (signal) => {
 *     const res = await fetch('/api/users', { signal });
 *     return res.json();
 *   },
 *   [] // dependency array
 * );
 * ```
 *
 * Features:
 * - Auto-cancels previous execution when deps change (race condition protection)
 * - Auto-cancels on unmount
 * - Retry with exponential backoff
 * - AbortSignal passed to your async function
 */
export function useAsyncState<T>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
  options: AsyncStateOptions = {},
): AsyncStateReturn<T> {
  const {
    immediate = true,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [state, dispatch] = useReducer(reducer<T>, {
    data: undefined,
    loading: immediate,
    error: undefined,
  });

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const optionsRef = useRef({ retryCount, retryDelay, onSuccess, onError });
  optionsRef.current = { retryCount, retryDelay, onSuccess, onError };

  const execute = useCallback(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: 'loading' });

    const attemptExecution = async (attempt: number): Promise<void> => {
      try {
        const result = await asyncFnRef.current(controller.signal);
        if (!controller.signal.aborted && mountedRef.current) {
          dispatch({ type: 'success', data: result });
          optionsRef.current.onSuccess?.(result);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        if (!mountedRef.current) return;

        const error = err instanceof Error ? err : new Error(String(err));

        if (attempt < optionsRef.current.retryCount) {
          const delay = optionsRef.current.retryDelay * Math.pow(2, attempt);
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, delay);
            controller.signal.addEventListener('abort', () => {
              clearTimeout(timer);
              resolve();
            });
          });
          if (!controller.signal.aborted && mountedRef.current) {
            return attemptExecution(attempt + 1);
          }
        } else {
          dispatch({ type: 'error', error });
          optionsRef.current.onError?.(error);
        }
      }
    };

    attemptExecution(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    if (mountedRef.current) {
      dispatch({ type: 'reset' });
    }
  }, []);

  const setData = useCallback((data: T) => {
    dispatch({ type: 'setData', data });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return {
    data: state.data as T | undefined,
    loading: state.loading,
    error: state.error,
    retry: execute,
    cancel,
    setData,
  };
}
