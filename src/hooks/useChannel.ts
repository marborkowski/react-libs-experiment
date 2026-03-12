import { useEffect, useCallback, useRef } from 'react';

type ChannelListener<T> = (message: T) => void;
type Unsubscribe = () => void;

interface ChannelBus {
  listeners: Map<string, Set<ChannelListener<unknown>>>;
  subscribe: <T>(channel: string, listener: ChannelListener<T>) => Unsubscribe;
  emit: <T>(channel: string, message: T) => void;
}

// Global singleton bus — shared across all components
const bus: ChannelBus = {
  listeners: new Map(),
  subscribe<T>(channel: string, listener: ChannelListener<T>) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    const set = this.listeners.get(channel)!;
    set.add(listener as ChannelListener<unknown>);
    return () => {
      set.delete(listener as ChannelListener<unknown>);
      if (set.size === 0) {
        this.listeners.delete(channel);
      }
    };
  },
  emit<T>(channel: string, message: T) {
    const set = this.listeners.get(channel);
    if (set) {
      set.forEach((listener) => listener(message));
    }
  },
};

/**
 * useChannel - Event-driven inter-component communication without
 * prop drilling or Context.
 *
 * Uses a lightweight pub/sub pattern. Components can communicate
 * across the entire tree without being directly connected.
 *
 * ```
 * // In NotificationBanner.tsx:
 * useChannel<{ text: string; type: 'info' | 'error' }>('notification', (msg) => {
 *   showToast(msg.text, msg.type);
 * });
 *
 * // In any other component:
 * const notify = useChannel<{ text: string; type: 'info' | 'error' }>('notification');
 * notify({ text: 'Saved!', type: 'info' });
 * ```
 *
 * Overloads:
 * - `useChannel(name)` — returns a send function only
 * - `useChannel(name, listener)` — subscribes and returns a send function
 */
export function useChannel<T = unknown>(channel: string): (message: T) => void;
export function useChannel<T = unknown>(
  channel: string,
  listener: ChannelListener<T>,
): (message: T) => void;
export function useChannel<T = unknown>(
  channel: string,
  listener?: ChannelListener<T>,
): (message: T) => void {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    if (!listenerRef.current) return;

    const handler: ChannelListener<T> = (msg) => {
      listenerRef.current?.(msg);
    };

    return bus.subscribe(channel, handler);
  }, [channel]);

  const send = useCallback(
    (message: T) => {
      bus.emit(channel, message);
    },
    [channel],
  );

  return send;
}

/**
 * Resets all channels. Useful for testing.
 */
export function resetChannels(): void {
  bus.listeners.clear();
}
