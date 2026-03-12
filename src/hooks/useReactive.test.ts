import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReactive } from './useReactive';

describe('useReactive', () => {
  it('sets initial state correctly', () => {
    const { result } = renderHook(() => useReactive({ count: 0, name: 'hello' }));
    expect(result.current.count).toBe(0);
    expect(result.current.name).toBe('hello');
  });

  it('mutating a property triggers re-render', () => {
    const { result } = renderHook(() => useReactive({ count: 0 }));

    act(() => {
      result.current.count = 5;
    });

    expect(result.current.count).toBe(5);
  });

  it('nested property mutations trigger re-render', () => {
    const { result } = renderHook(() =>
      useReactive({ user: { name: 'Alice', address: { city: 'NYC' } } }),
    );

    act(() => {
      result.current.user.address.city = 'LA';
    });

    expect(result.current.user.address.city).toBe('LA');
  });

  it('multiple mutations in one act batch properly', () => {
    const { result } = renderHook(() => useReactive({ a: 1, b: 2 }));

    act(() => {
      result.current.a = 10;
      result.current.b = 20;
    });

    expect(result.current.a).toBe(10);
    expect(result.current.b).toBe(20);
  });

  it('array push works', () => {
    const { result } = renderHook(() => useReactive({ items: [1, 2, 3] }));

    act(() => {
      result.current.items.push(4);
    });

    expect(result.current.items).toEqual([1, 2, 3, 4]);
    expect(result.current.items.length).toBe(4);
  });

  it('array splice works', () => {
    const { result } = renderHook(() => useReactive({ items: ['a', 'b', 'c', 'd'] }));

    act(() => {
      result.current.items.splice(1, 2);
    });

    expect(result.current.items).toEqual(['a', 'd']);
  });

  it('delete property works', () => {
    const { result } = renderHook(() =>
      useReactive<{ a: number; b?: number }>({ a: 1, b: 2 }),
    );

    act(() => {
      delete result.current.b;
    });

    expect(result.current.b).toBeUndefined();
    expect('b' in result.current).toBe(false);
  });

  it('lazy initializer function works', () => {
    const initializer = () => ({ count: 42, label: 'lazy' });
    const { result } = renderHook(() => useReactive(initializer));

    expect(result.current.count).toBe(42);
    expect(result.current.label).toBe('lazy');

    act(() => {
      result.current.count = 100;
    });

    expect(result.current.count).toBe(100);
  });
});
