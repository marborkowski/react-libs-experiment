import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStructuralMemo } from './useStructuralMemo';

describe('useStructuralMemo', () => {
  it('returns computed value', () => {
    const { result } = renderHook(() =>
      useStructuralMemo(() => ({ x: 1, y: 2 }), []),
    );

    expect(result.current).toEqual({ x: 1, y: 2 });
  });

  it('returns same reference when result is structurally equal', () => {
    const { result, rerender } = renderHook(
      ({ dep }) => useStructuralMemo(() => ({ x: 1, y: 2 }), [dep]),
      { initialProps: { dep: 'a' } },
    );

    const firstRef = result.current;

    rerender({ dep: 'b' });

    // Factory produces structurally equal result, so reference should be the same
    expect(result.current).toBe(firstRef);
  });

  it('returns new reference when result changes', () => {
    const { result, rerender } = renderHook(
      ({ dep }) => useStructuralMemo(() => ({ x: dep }), [dep]),
      { initialProps: { dep: 1 } },
    );

    const firstRef = result.current;

    rerender({ dep: 2 });

    expect(result.current).not.toBe(firstRef);
    expect(result.current).toEqual({ x: 2 });
  });

  it('works with arrays', () => {
    const { result, rerender } = renderHook(
      ({ dep }) => useStructuralMemo(() => [1, 2, 3], [dep]),
      { initialProps: { dep: 'a' } },
    );

    const firstRef = result.current;

    rerender({ dep: 'b' });

    // Structurally equal array, same reference
    expect(result.current).toBe(firstRef);

    // Now return a different array
    const { result: result2, rerender: rerender2 } = renderHook(
      ({ items }) => useStructuralMemo(() => [...items], [items]),
      { initialProps: { items: [1, 2, 3] } },
    );

    const ref2 = result2.current;
    const newItems = [1, 2, 4];
    rerender2({ items: newItems });

    expect(result2.current).not.toBe(ref2);
    expect(result2.current).toEqual([1, 2, 4]);
  });

  it('works with nested objects', () => {
    const { result, rerender } = renderHook(
      ({ dep }) =>
        useStructuralMemo(
          () => ({ user: { name: 'Alice', scores: [10, 20] } }),
          [dep],
        ),
      { initialProps: { dep: 0 } },
    );

    const firstRef = result.current;

    rerender({ dep: 1 });

    // Structurally equal nested object keeps same reference
    expect(result.current).toBe(firstRef);
  });

  it('recomputes when deps change', () => {
    let computeCount = 0;

    const { rerender } = renderHook(
      ({ dep }) =>
        useStructuralMemo(() => {
          computeCount++;
          return { value: dep };
        }, [dep]),
      { initialProps: { dep: 1 } },
    );

    expect(computeCount).toBe(1);

    // Same dep, should not recompute
    rerender({ dep: 1 });
    expect(computeCount).toBe(1);

    // Different dep, should recompute
    rerender({ dep: 2 });
    expect(computeCount).toBe(2);
  });
});
