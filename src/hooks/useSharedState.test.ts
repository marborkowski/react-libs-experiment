import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSharedState } from './useSharedState';
import type { StorageAdapter } from './useSharedState';

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

  it('returns initial value (in-memory, no persistence)', () => {
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

  it('does NOT touch localStorage by default', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    const { result } = renderHook(() =>
      useSharedState('no-persist-key', 'value'),
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });

  it('persists to localStorage when persist: "localStorage"', () => {
    const { result } = renderHook(() =>
      useSharedState('persist-ls-key', 'init', { persist: 'localStorage' }),
    );

    act(() => {
      result.current[1]('persisted');
    });

    expect(localStorage.getItem('__shared_state_persist-ls-key')).toBe('"persisted"');
  });

  it('restores from localStorage when persist: "localStorage"', () => {
    localStorage.setItem('__shared_state_restore-key', '"restored-value"');

    const { result } = renderHook(() =>
      useSharedState('restore-key', 'default', { persist: 'localStorage' }),
    );

    expect(result.current[0]).toBe('restored-value');
  });

  it('works with custom storage adapter', () => {
    const store = new Map<string, string>();
    const adapter: StorageAdapter = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => { store.set(k, v); },
      removeItem: (k) => { store.delete(k); },
    };

    const { result } = renderHook(() =>
      useSharedState('custom-adapter-key', 0, { persist: adapter }),
    );

    act(() => {
      result.current[1](99);
    });

    expect(result.current[0]).toBe(99);
    expect(store.get('__shared_state_custom-adapter-key')).toBe('99');
  });

  it('supports custom serialize/deserialize', () => {
    const store = new Map<string, string>();
    const adapter: StorageAdapter = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => { store.set(k, v); },
      removeItem: (k) => { store.delete(k); },
    };

    const { result } = renderHook(() =>
      useSharedState('custom-serde-key', { count: 0 }, {
        persist: adapter,
        serialize: (v) => `CUSTOM:${JSON.stringify(v)}`,
        deserialize: (s) => JSON.parse(s.replace('CUSTOM:', '')),
      }),
    );

    act(() => {
      result.current[1]({ count: 42 });
    });

    expect(store.get('__shared_state_custom-serde-key')).toBe('CUSTOM:{"count":42}');
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() =>
      useSharedState('func-update-key', 10),
    );

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(15);
  });
});
