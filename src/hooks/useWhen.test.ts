import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWhen, useWhenChanged } from './useWhen';

describe('useWhen', () => {
  it('effect fires when condition becomes true', () => {
    const effect = vi.fn();

    const { rerender } = renderHook(
      ({ condition }: { condition: boolean }) => useWhen(condition, effect),
      { initialProps: { condition: false } },
    );

    expect(effect).not.toHaveBeenCalled();

    rerender({ condition: true });

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('cleanup fires when condition becomes false', () => {
    const cleanup = vi.fn();
    const effect = vi.fn(() => cleanup);

    const { rerender } = renderHook(
      ({ condition }: { condition: boolean }) => useWhen(condition, effect),
      { initialProps: { condition: false } },
    );

    rerender({ condition: true });
    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    rerender({ condition: false });
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('effect does not fire on re-render if condition stays true', () => {
    const effect = vi.fn();

    const { rerender } = renderHook(
      ({ condition }: { condition: boolean }) => useWhen(condition, effect),
      { initialProps: { condition: false } },
    );

    rerender({ condition: true });
    expect(effect).toHaveBeenCalledTimes(1);

    // Re-render with condition still true
    rerender({ condition: true });
    expect(effect).toHaveBeenCalledTimes(1);
  });
});

describe('useWhenChanged', () => {
  it('fires callback when value changes', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ value }: { value: number }) => useWhenChanged(value, callback),
      { initialProps: { value: 1 } },
    );

    expect(callback).not.toHaveBeenCalled();

    rerender({ value: 2 });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('receives previous and current values', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ value }: { value: number }) => useWhenChanged(value, callback),
      { initialProps: { value: 10 } },
    );

    rerender({ value: 20 });

    expect(callback).toHaveBeenCalledWith(10, 20);
  });

  it('does not fire if value is the same', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ value }: { value: number }) => useWhenChanged(value, callback),
      { initialProps: { value: 5 } },
    );

    rerender({ value: 5 });

    expect(callback).not.toHaveBeenCalled();
  });
});
