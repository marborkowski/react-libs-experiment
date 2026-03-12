import { useEffect, useRef, useReducer, useCallback } from 'react';

interface WorkerState<T> {
  result: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

interface WorkerReturn<T> extends WorkerState<T> {
  /** Re-run the worker with the current input */
  retry: () => void;
}

type Action<T> =
  | { type: 'start' }
  | { type: 'success'; result: T }
  | { type: 'error'; error: Error };

function reducer<T>(state: WorkerState<T>, action: Action<T>): WorkerState<T> {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true, error: undefined };
    case 'success':
      return { result: action.result, loading: false, error: undefined };
    case 'error':
      return { ...state, loading: false, error: action.error };
  }
}

function createWorkerBlob(fn: Function): Blob {
  const fnString = fn.toString();
  const workerCode = `
    self.onmessage = function(e) {
      const fn = ${fnString};
      try {
        const result = fn(e.data);
        if (result && typeof result.then === 'function') {
          result.then(
            function(r) { self.postMessage({ type: 'success', result: r }); },
            function(err) { self.postMessage({ type: 'error', error: String(err) }); }
          );
        } else {
          self.postMessage({ type: 'success', result: result });
        }
      } catch (err) {
        self.postMessage({ type: 'error', error: String(err) });
      }
    };
  `;
  return new Blob([workerCode], { type: 'application/javascript' });
}

/**
 * useWorker - Run expensive computations in a Web Worker seamlessly.
 *
 * Automatically creates an inline Web Worker from your function,
 * passes data to it, and returns the result reactively.
 *
 * ```
 * const { result, loading, error } = useWorker(
 *   (data: number[]) => {
 *     // This runs in a separate thread!
 *     return data.reduce((sum, n) => sum + n, 0);
 *   },
 *   [1, 2, 3, 4, 5]
 * );
 * ```
 *
 * Important: The worker function must be self-contained (no closures over
 * external variables). It receives the input data as its argument.
 *
 * Supports both sync and async worker functions.
 */
export function useWorker<TInput, TResult>(
  workerFn: (input: TInput) => TResult | Promise<TResult>,
  input: TInput,
): WorkerReturn<TResult> {
  const [state, dispatch] = useReducer(reducer<TResult>, {
    result: undefined,
    loading: true,
    error: undefined,
  });

  const workerRef = useRef<Worker | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const workerFnRef = useRef(workerFn);
  workerFnRef.current = workerFn;
  const inputRef = useRef(input);
  inputRef.current = input;

  const execute = useCallback(() => {
    // Cleanup previous worker
    workerRef.current?.terminate();
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    dispatch({ type: 'start' });

    try {
      const blob = createWorkerBlob(workerFnRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const worker = new Worker(url);
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const msg = e.data as { type: 'success' | 'error'; result?: TResult; error?: string };
        if (msg.type === 'success') {
          dispatch({ type: 'success', result: msg.result! });
        } else {
          dispatch({ type: 'error', error: new Error(msg.error) });
        }
      };

      worker.onerror = (e) => {
        dispatch({
          type: 'error',
          error: new Error(e.message || 'Worker execution failed'),
        });
      };

      worker.postMessage(inputRef.current);
    } catch (err) {
      dispatch({
        type: 'error',
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  useEffect(() => {
    execute();
    return () => {
      workerRef.current?.terminate();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [execute, input]);

  return {
    result: state.result as TResult | undefined,
    loading: state.loading,
    error: state.error,
    retry: execute,
  };
}
