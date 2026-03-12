import { useRef, useState, useEffect, useCallback } from 'react';

type EasingFunction = (t: number) => number;

const easings: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  spring: (t) => 1 - Math.cos(t * Math.PI * 0.5) * Math.exp(-6 * t),
};

interface TweenOptions {
  /** Duration in milliseconds (default: 300) */
  duration?: number;
  /** Easing function name or custom function (default: 'easeOut') */
  easing?: keyof typeof easings | EasingFunction;
  /** If true, disable animation and return target value immediately */
  disabled?: boolean;
}

/**
 * useTween - Smoothly animate between numeric values.
 *
 * Any time the target value changes, the returned value animates to it
 * using requestAnimationFrame. Zero dependencies, pure hook.
 *
 * ```
 * const [count, setCount] = useState(0);
 * const smooth = useTween(count, { duration: 500, easing: 'spring' });
 *
 * // In JSX:
 * <div style={{ width: smooth }}>{Math.round(smooth)}</div>
 * ```
 *
 * Built-in easings: linear, easeIn, easeOut, easeInOut,
 * easeInCubic, easeOutCubic, easeInOutCubic, spring
 */
export function useTween(
  target: number,
  options: TweenOptions = {},
): number {
  const { duration = 300, easing = 'easeOut', disabled = false } = options;

  const [current, setCurrent] = useState(target);
  const startRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const easingFn: EasingFunction =
    typeof easing === 'function' ? easing : (easings[easing] ?? easings.easeOut);

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      const easedProgress = easingFn(progress);

      const from = startRef.current;
      const value = from + (target - from) * easedProgress;
      setCurrent(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    },
    [target, duration, easingFn],
  );

  useEffect(() => {
    if (disabled) {
      setCurrent(target);
      return;
    }

    // Start new animation from current value
    startRef.current = current;
    startTimeRef.current = null;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, disabled, animate]);

  if (disabled) return target;

  return current;
}
