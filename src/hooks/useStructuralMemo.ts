import { useRef, DependencyList } from 'react';
import { deepEqual } from '../utils/deepEqual';

/**
 * useStructuralMemo - Like useMemo, but returns the previous reference
 * if the new result is deeply equal to the old one.
 *
 * This prevents downstream re-renders caused by new object/array references
 * that have the same content.
 *
 * ```
 * const filters = useStructuralMemo(
 *   () => ({ status: 'active', role: user.role }),
 *   [user.role]
 * );
 * // If user.role hasn't actually changed value, `filters` keeps the same reference
 * ```
 */
export function useStructuralMemo<T>(
  factory: () => T,
  deps: DependencyList,
): T {
  const valueRef = useRef<{ value: T; deps: DependencyList } | null>(null);

  const depsChanged =
    valueRef.current === null ||
    deps.length !== valueRef.current.deps.length ||
    deps.some((dep, i) => !Object.is(dep, valueRef.current!.deps[i]));

  if (depsChanged) {
    const newValue = factory();

    if (valueRef.current !== null && deepEqual(valueRef.current.value, newValue)) {
      // Structurally identical — keep old reference, update deps
      valueRef.current = { value: valueRef.current.value, deps };
    } else {
      valueRef.current = { value: newValue, deps };
    }
  }

  return valueRef.current!.value;
}
