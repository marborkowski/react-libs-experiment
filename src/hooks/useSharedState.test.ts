import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSharedState } from './useSharedState';

// Mock BroadcastChannel since jsdom doesn't support it
vi.stubGlobal('BroadcastChannel', class {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage() {}
  close() {}
});

describe('useSharedState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value', () => {
    const { result } = renderHook(() =>
      useSharedState('test-key-1', 'hello'),
    );

    expect(result.current[0]).toBe('hello');
  });

  it('setState updates value', () => {
    const { result } = renderHook(() =>
      useSharedState('test-key-2', 0),
    );

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
  });

  it('multiple hooks with same key share state', () => {
    const { result: result1 } = renderHook(() =>
      useSharedState('shared-key', 'initial'),
    );
    const { result: result2 } = renderHook(() =>
      useSharedState('shared-key', 'initial'),
    );

    act(() => {
      result1.current[1]('updated');
    });

    expect(result1.current[0]).toBe('updated');
    expect(result2.current[0]).toBe('updated');
  });
});
