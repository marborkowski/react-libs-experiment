import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncState } from './useAsyncState';

describe('useAsyncState', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('executes async function on mount', async () => {
    const asyncFn = vi.fn(async () => 'hello');

    renderHook(() => useAsyncState(asyncFn, []));

    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it('sets loading=true then data on success', async () => {
    let resolve!: (value: string) => void;
    const asyncFn = vi.fn(
      () => new Promise<string>((r) => { resolve = r; }),
    );

    const { result } = renderHook(() => useAsyncState(asyncFn, []));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await act(async () => {
      resolve('data');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('data');
    expect(result.current.error).toBeUndefined();
  });

  it('sets error on failure', async () => {
    const error = new Error('fail');
    const asyncFn = vi.fn(async () => {
      throw error;
    });

    const { result } = renderHook(() => useAsyncState(asyncFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('cancels on unmount', async () => {
    let receivedSignal: AbortSignal | undefined;
    const asyncFn = vi.fn(async (signal: AbortSignal) => {
      receivedSignal = signal;
      return new Promise<string>((resolve) => {
        const timer = setTimeout(() => resolve('done'), 1000);
        signal.addEventListener('abort', () => clearTimeout(timer));
      });
    });

    const { unmount } = renderHook(() => useAsyncState(asyncFn, []));

    expect(receivedSignal!.aborted).toBe(false);

    unmount();

    expect(receivedSignal!.aborted).toBe(true);
  });

  it('race condition: newer call cancels older', async () => {
    let callCount = 0;
    const signals: AbortSignal[] = [];

    const asyncFn = vi.fn(async (signal: AbortSignal) => {
      signals.push(signal);
      callCount++;
      const current = callCount;
      await new Promise((r) => setTimeout(r, 10));
      return `result-${current}`;
    });

    const { result, rerender } = renderHook(
      ({ dep }: { dep: number }) => useAsyncState(asyncFn, [dep]),
      { initialProps: { dep: 1 } },
    );

    // Rerender with new dep before first resolves
    rerender({ dep: 2 });

    // First signal should be aborted
    expect(signals[0].aborted).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have the result from the second call
    expect(result.current.data).toBe('result-2');
  });

  it('retry() re-executes the function', async () => {
    let callCount = 0;
    const asyncFn = vi.fn(async () => {
      callCount++;
      return `result-${callCount}`;
    });

    const { result } = renderHook(() => useAsyncState(asyncFn, []));

    await waitFor(() => {
      expect(result.current.data).toBe('result-1');
    });

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.data).toBe('result-2');
    });

    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  it('cancel() aborts current execution', async () => {
    let receivedSignal: AbortSignal | undefined;
    const asyncFn = vi.fn(async (signal: AbortSignal) => {
      receivedSignal = signal;
      await new Promise((r) => setTimeout(r, 5000));
      return 'done';
    });

    const { result } = renderHook(() => useAsyncState(asyncFn, []));

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(receivedSignal!.aborted).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('setData() manually sets data', async () => {
    const asyncFn = vi.fn(async () => 'original');

    const { result } = renderHook(() => useAsyncState(asyncFn, []));

    await waitFor(() => {
      expect(result.current.data).toBe('original');
    });

    act(() => {
      result.current.setData('manual');
    });

    expect(result.current.data).toBe('manual');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('immediate=false skips initial execution', () => {
    const asyncFn = vi.fn(async () => 'data');

    const { result } = renderHook(() =>
      useAsyncState(asyncFn, [], { immediate: false }),
    );

    expect(asyncFn).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('retry with retryCount works', async () => {
    vi.useFakeTimers();

    let attempts = 0;
    const asyncFn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`fail-${attempts}`);
      }
      return 'success';
    });

    const { result } = renderHook(() =>
      useAsyncState(asyncFn, [], { retryCount: 3, retryDelay: 100 }),
    );

    // First attempt fails
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Advance through retry delay (100ms * 2^0 = 100ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Second attempt fails, advance through retry delay (100ms * 2^1 = 200ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Third attempt succeeds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.data).toBe('success');
    expect(result.current.loading).toBe(false);
    expect(attempts).toBe(3);
  });
});
