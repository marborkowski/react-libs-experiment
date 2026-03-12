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
      <h3>useTween — Smooth Animations</h3>
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
        <button onClick={() => setTarget(0)}>→ 0</button>
        <button onClick={() => setTarget(25)}>→ 25</button>
        <button onClick={() => setTarget(50)}>→ 50</button>
        <button onClick={() => setTarget(75)}>→ 75</button>
        <button onClick={() => setTarget(100)}>→ 100</button>
      </div>
    </div>
  );
}

function AnimatedCounter() {
  const [count, setCount] = useState(0);
  const animated = useTween(count, { duration: 500, easing: "spring" });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useTween — Animated Counter</h3>
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
};

export default meta;

export const AnimatedBarDemo: StoryObj = {
  render: () => <AnimatedBar />,
};

export const AnimatedCounterDemo: StoryObj = {
  render: () => <AnimatedCounter />,
};
