import { useRef, useCallback, useInsertionEffect } from 'react';

/**
 * useStaticCallback - Returns a function with stable identity that always
 * calls the latest version of your callback.
 *
 * This is the spiritual successor to the abandoned React `useEvent` RFC.
 * Solves the #1 pain point with useCallback + dependency arrays.
 *
 * ```
 * const handleClick = useStaticCallback((e: MouseEvent) => {
 *   console.log(latestState); // always reads current closure
 * });
 *
 * // handleClick identity NEVER changes — safe to pass as prop or use in effects
 * ```
 */
export function useStaticCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R {
  const fnRef = useRef(fn);

  // useInsertionEffect runs synchronously before layout effects,
  // ensuring the ref is updated before any effect reads it.
  useInsertionEffect(() => {
    fnRef.current = fn;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: Args) => fnRef.current(...args), []);
}
