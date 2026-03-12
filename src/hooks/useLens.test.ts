import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useLens } from './useLens';

function useTestLens<T extends object, P extends string>(initial: T, path: P) {
  const [state, setState] = useState(initial);
  const [value, setValue] = useLens(state, setState, path);
  return { state, setState, value, setValue };
}

describe('useLens', () => {
  it('reads value at path', () => {
    const { result } = renderHook(() =>
      useTestLens({ a: { b: 42 } }, 'a.b'),
    );

    expect(result.current.value).toBe(42);
  });

  it('sets value at path (updates parent state immutably)', () => {
    const { result } = renderHook(() =>
      useTestLens({ a: { b: 42 } }, 'a.b'),
    );

    const originalState = result.current.state;

    act(() => {
      result.current.setValue(100);
    });

    expect(result.current.value).toBe(100);
    expect(result.current.state).toEqual({ a: { b: 100 } });
    // Immutable: new reference
    expect(result.current.state).not.toBe(originalState);
  });

  it('works with nested paths', () => {
    const { result } = renderHook(() =>
      useTestLens(
        { user: { profile: { address: { city: 'NYC' } } } },
        'user.profile.address.city',
      ),
    );

    expect(result.current.value).toBe('NYC');

    act(() => {
      result.current.setValue('LA');
    });

    expect(result.current.value).toBe('LA');
    expect(result.current.state.user.profile.address.city).toBe('LA');
  });

  it('functional updates work', () => {
    const { result } = renderHook(() =>
      useTestLens({ count: 5 }, 'count'),
    );

    act(() => {
      result.current.setValue((prev: number) => prev + 10);
    });

    expect(result.current.value).toBe(15);
  });
});
