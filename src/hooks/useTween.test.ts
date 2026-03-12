import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTween } from './useTween';

describe('useTween', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useTween(42));

    // On first render, state is initialized with the target
    expect(result.current).toBe(42);
  });

  it('disabled=true returns target directly', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) =>
        useTween(target, { disabled: true }),
      { initialProps: { target: 10 } },
    );

    expect(result.current).toBe(10);

    rerender({ target: 50 });
    expect(result.current).toBe(50);
  });

  it('returns a number', () => {
    const { result } = renderHook(() => useTween(100, { duration: 300 }));

    expect(typeof result.current).toBe('number');
  });
});
