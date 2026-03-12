import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTween } from "../hooks/useTween";

function AnimatedBar() {
  const [target, setTarget] = useState(50);
  const [easing, setEasing] = useState<string>("easeOut");
  const [duration, setDuration] = useState(300);

  const value = useTween(target, { duration, easing: easing as any });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <label>
          Target:{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
          {target}
        </label>
        <label>
          Duration:{" "}
          <input
            type="range"
            min={100}
            max={2000}
            step={100}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          {duration}ms
        </label>
        <label>
          Easing:{" "}
          <select value={easing} onChange={(e) => setEasing(e.target.value)}>
            {[
              "linear",
              "easeIn",
              "easeOut",
              "easeInOut",
              "easeInCubic",
              "easeOutCubic",
              "easeInOutCubic",
              "spring",
            ].map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ position: "relative", height: 40, background: "#f0f0f0", borderRadius: 4 }}>
        <div
          style={{
            position: "absolute",
            height: "100%",
            width: `${value}%`,
            background: `hsl(${value * 1.2}, 70%, 50%)`,
            borderRadius: 4,
            transition: "none",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            fontWeight: "bold",
          }}
        >
          {Math.round(value)}%
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {[0, 25, 50, 75, 100].map((v) => (
          <button key={v} onClick={() => setTarget(v)}>
            \u2192 {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnimatedCounter() {
  const [count, setCount] = useState(0);
  const animated = useTween(count, { duration: 500, easing: "spring" });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 64, fontWeight: "bold", fontVariantNumeric: "tabular-nums" }}>
        {Math.round(animated)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setCount((c) => c - 10)}>-10</button>
        <button onClick={() => setCount((c) => c - 1)}>-1</button>
        <button onClick={() => setCount((c) => c + 1)}>+1</button>
        <button onClick={() => setCount((c) => c + 10)}>+10</button>
        <button onClick={() => setCount(Math.floor(Math.random() * 1000))}>Random</button>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Animation/useTween",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useTween(target: number, options?): number`",
          "",
          "Smoothly animates a numeric value from its current position to a new `target`",
          "using `requestAnimationFrame`. No CSS transitions — pure JS animation with full control.",
          "",
          "### How it works internally",
          "1. When `target` changes, starts a `requestAnimationFrame` loop.",
          "2. On each frame, computes `elapsed / duration` progress and applies the easing function.",
          "3. Interpolates between the start value and target: `start + (target - start) * eased`.",
          "4. Returns the current interpolated value (triggers re-render each frame).",
          "5. Cancels the animation loop on unmount or when target changes mid-animation.",
          "",
          "### API",
          "| Param | Type | Default | Description |",
          "|---|---|---|---|",
          "| `target` | `number` | \u2014 | Value to animate toward |",
          "| `options.duration` | `number` | `300` | Animation duration in ms |",
          "| `options.easing` | `string \\| fn` | `'easeOut'` | Easing name or custom `(t: number) => number` |",
          "| `options.disabled` | `boolean` | `false` | Skip animation, return target immediately |",
          "",
          "**Returns** `number` \u2014 current animated value (updates every frame).",
          "",
          "### Built-in easings",
          "`linear`, `easeIn`, `easeOut`, `easeInOut`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `spring`",
          "",
          "```tsx",
          "const width = useTween(isOpen ? 300 : 0, {",
          "  duration: 400,",
          "  easing: 'easeOutCubic',",
          "});",
          "",
          "// Custom easing function",
          "const y = useTween(targetY, {",
          "  easing: (t) => t * t * (3 - 2 * t),  // smoothstep",
          "});",
          "",
          "// Apply to styles",
          "<div style={{ width, opacity: width / 300 }} />",
          "```",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const AnimatedBarDemo: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Drag the target slider or click preset buttons to animate the bar. Change the easing and duration to see different animation curves. The bar color also interpolates based on the value via HSL.",
      },
      source: {
        code: `const [target, setTarget] = useState(50);
const [easing, setEasing] = useState("easeOut");
const [duration, setDuration] = useState(300);

// value smoothly animates toward target
const value = useTween(target, { duration, easing });

// Apply to any numeric style
<div style={{ width: \`\${value}%\` }} />

// Jump to preset values
<button onClick={() => setTarget(0)}>0</button>
<button onClick={() => setTarget(100)}>100</button>`,
      },
    },
  },
  render: () => <AnimatedBar />,
};

export const AnimatedCounterDemo: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "A large number display that smoothly tweens between values using the `spring` easing. Click +1, +10, or Random to see the counter animate. The spring easing overshoots slightly before settling, creating a natural feel.",
      },
      source: {
        code: `const [count, setCount] = useState(0);

// Spring easing for a bouncy feel
const animated = useTween(count, { duration: 500, easing: "spring" });

// Display rounded value
<div style={{ fontSize: 64 }}>{Math.round(animated)}</div>

<button onClick={() => setCount(c => c + 1)}>+1</button>
<button onClick={() => setCount(c => c + 10)}>+10</button>
<button onClick={() => setCount(Math.floor(Math.random() * 1000))}>
  Random
</button>`,
      },
    },
  },
  render: () => <AnimatedCounter />,
};
