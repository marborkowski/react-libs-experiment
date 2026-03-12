import { useCallback, useMemo } from 'react';
import { getByPath, setByPath } from '../utils/path';

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : unknown
  : P extends keyof T
    ? T[P]
    : unknown;

type SetState<T> = (value: T | ((prev: T) => T)) => void;

/**
 * useLens - Path-based focusing into nested state.
 *
 * Creates a "lens" into a specific path of your state, returning a getter
 * and setter for just that path. Changes propagate to the parent state immutably.
 *
 * ```
 * const [user, setUser] = useState({
 *   profile: { name: 'Alice', address: { city: 'NYC' } }
 * });
 *
 * const [city, setCity] = useLens(user, setUser, 'profile.address.city');
 * // city === 'NYC'
 * setCity('LA'); // immutably updates the entire user state
 * ```
 *
 * Also supports functional updates:
 * ```
 * setCity(prev => prev.toUpperCase());
 * ```
 */
export function useLens<T extends object, P extends string>(
  state: T,
  setState: SetState<T>,
  path: P,
): [PathValue<T, P>, SetState<PathValue<T, P>>] {
  const value = useMemo(
    () => getByPath(state, path) as PathValue<T, P>,
    [state, path],
  );

  const setValue: SetState<PathValue<T, P>> = useCallback(
    (valueOrFn) => {
      setState((prevState) => {
        const prevValue = getByPath(prevState, path) as PathValue<T, P>;
        const nextValue =
          typeof valueOrFn === 'function'
            ? (valueOrFn as (prev: PathValue<T, P>) => PathValue<T, P>)(prevValue)
            : valueOrFn;
        return setByPath(prevState, path, nextValue);
      });
    },
    [setState, path],
  );

  return [value, setValue];
}
