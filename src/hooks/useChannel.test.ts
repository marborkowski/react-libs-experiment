import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChannel, resetChannels } from './useChannel';

describe('useChannel', () => {
  beforeEach(() => {
    resetChannels();
  });

  it('send function is returned', () => {
    const { result } = renderHook(() => useChannel('test'));

    expect(typeof result.current).toBe('function');
  });

  it('listener receives messages', () => {
    const listener = vi.fn();

    const { result: senderResult } = renderHook(() => useChannel<string>('chat'));
    renderHook(() => useChannel<string>('chat', listener));

    act(() => {
      senderResult.current('hello');
    });

    expect(listener).toHaveBeenCalledWith('hello');
  });

  it('multiple listeners on same channel all receive', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const { result: senderResult } = renderHook(() => useChannel<string>('news'));
    renderHook(() => useChannel<string>('news', listener1));
    renderHook(() => useChannel<string>('news', listener2));

    act(() => {
      senderResult.current('breaking');
    });

    expect(listener1).toHaveBeenCalledWith('breaking');
    expect(listener2).toHaveBeenCalledWith('breaking');
  });

  it('different channels are isolated', () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const { result: senderA } = renderHook(() => useChannel<string>('channel-a'));
    renderHook(() => useChannel<string>('channel-a', listenerA));
    renderHook(() => useChannel<string>('channel-b', listenerB));

    act(() => {
      senderA.current('msg-a');
    });

    expect(listenerA).toHaveBeenCalledWith('msg-a');
    expect(listenerB).not.toHaveBeenCalled();
  });

  it('cleanup on unmount removes listener', () => {
    const listener = vi.fn();

    const { result: senderResult } = renderHook(() => useChannel<string>('events'));
    const { unmount } = renderHook(() => useChannel<string>('events', listener));

    act(() => {
      senderResult.current('before');
    });
    expect(listener).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      senderResult.current('after');
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
