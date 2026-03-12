import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStaticCallback } from './useStaticCallback';

describe('useStaticCallback', () => {
  it('returns a function', () => {
    const { result } = renderHook(() => useStaticCallback(() => 'hello'));
    expect(typeof result.current).toBe('function');
  });

  it('function identity is stable across re-renders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useStaticCallback(() => value),
      { initialProps: { value: 'first' } },
    );

    const firstRef = result.current;

    rerender({ value: 'second' });

    expect(result.current).toBe(firstRef);
  });

  it('always calls the latest version of the callback', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useStaticCallback(() => value),
      { initialProps: { value: 'first' } },
    );

    expect(result.current()).toBe('first');

    rerender({ value: 'second' });

    expect(result.current()).toBe('second');
  });

  it('works with arguments and return values', () => {
    const { result, rerender } = renderHook(
      ({ multiplier }) =>
        useStaticCallback((a: number, b: number) => (a + b) * multiplier),
      { initialProps: { multiplier: 1 } },
    );

    expect(result.current(2, 3)).toBe(5);

    rerender({ multiplier: 10 });

    expect(result.current(2, 3)).toBe(50);
  });
});
