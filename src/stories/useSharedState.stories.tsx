import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useSharedState } from "../hooks/useSharedState";

function ComponentA() {
  const [count, setCount] = useSharedState("shared-counter", 0);
  return (
    <div style={{ padding: 16, border: "2px solid #3498db", borderRadius: 8 }}>
      <h4 style={{ margin: 0, color: "#3498db" }}>Component A</h4>
      <p>Count: <strong>{count}</strong></p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}

function ComponentB() {
  const [count, setCount] = useSharedState("shared-counter", 0);
  return (
    <div style={{ padding: 16, border: "2px solid #e74c3c", borderRadius: 8 }}>
      <h4 style={{ margin: 0, color: "#e74c3c" }}>Component B</h4>
      <p>Count: <strong>{count}</strong></p>
      <button onClick={() => setCount((c) => c + 10)}>+10</button>
    </div>
  );
}

function SharedStateDemo() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useSharedState — Cross-Component Sync</h3>
      <p>
        Both components share the same <code>"shared-counter"</code> key. Also
        syncs across browser tabs via BroadcastChannel + localStorage.
      </p>
      <div style={{ display: "flex", gap: 16 }}>
        <ComponentA />
        <ComponentB />
      </div>
      <p style={{ color: "#888", marginTop: 12 }}>
        Open this page in another tab to see cross-tab sync!
      </p>
    </div>
  );
}

const meta: Meta = {
  title: "Reactive & State/useSharedState",
};

export default meta;

export const CrossComponentSync: StoryObj = {
  render: () => <SharedStateDemo />,
};
