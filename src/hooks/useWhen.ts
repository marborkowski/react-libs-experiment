import { useEffect, useRef } from 'react';

/**
 * useWhen - Runs an effect when a condition becomes true.
 *
 * Unlike useEffect, this focuses on state transitions rather than synchronization.
 * The effect fires only on the transition from false → true.
 *
 * ```
 * useWhen(user.isLoggedIn, () => {
 *   analytics.track('login');
 *   return () => analytics.track('logout'); // cleanup when condition becomes false
 * });
 * ```
 */
export function useWhen(
  condition: boolean,
  effect: () => void | (() => void),
): void {
  const prevRef = useRef(false);
  const cleanupRef = useRef<(() => void) | void>(undefined);

  useEffect(() => {
    const wasTrue = prevRef.current;
    prevRef.current = condition;

    if (condition && !wasTrue) {
      // Transition: false → true — run the effect
      cleanupRef.current = effect();
    } else if (!condition && wasTrue) {
      // Transition: true → false — run cleanup
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    }
  }, [condition, effect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);
}

/**
 * useWhenChanged - Runs a callback whenever a value changes, providing
 * both previous and next values.
 *
 * This replaces the common pattern:
 * ```
 * const prevRef = useRef(value);
 * useEffect(() => {
 *   if (prevRef.current !== value) { ... }
 *   prevRef.current = value;
 * }, [value]);
 * ```
 *
 * With the elegant:
 * ```
 * useWhenChanged(userId, (prev, next) => {
 *   console.log(`User changed from ${prev} to ${next}`);
 *   loadUserProfile(next);
 * });
 * ```
 */
export function useWhenChanged<T>(
  value: T,
  callback: (previous: T, current: T) => void | (() => void),
  isEqual: (a: T, b: T) => boolean = Object.is,
): void {
  const prevRef = useRef(value);
  const cleanupRef = useRef<(() => void) | void>(undefined);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const prev = prevRef.current;
    if (!isEqual(prev, value)) {
      cleanupRef.current?.();
      cleanupRef.current = callbackRef.current(prev, value);
      prevRef.current = value;
    }
  }, [value, isEqual]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);
}
