import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useReactive } from "../hooks/useReactive";

function ReactiveCounter() {
  const state = useReactive({ count: 0, label: "Clicks" });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useReactive — Counter</h3>
      <p>
        Direct mutation triggers re-render. No <code>setState</code> needed.
      </p>
      <p style={{ fontSize: 24 }}>
        {state.label}: <strong>{state.count}</strong>
      </p>
      <button onClick={() => state.count++}>Increment</button>{" "}
      <button onClick={() => state.count--}>Decrement</button>{" "}
      <button onClick={() => (state.count = 0)}>Reset</button>
      <div style={{ marginTop: 12 }}>
        <label>
          Label:{" "}
          <input
            value={state.label}
            onChange={(e) => (state.label = e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

function ReactiveNested() {
  const state = useReactive({
    user: { name: "John", address: { city: "NYC" } },
    tags: ["react", "hooks"],
  });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useReactive — Nested Objects</h3>
      <p>Deep mutations are automatically tracked.</p>
      <div>
        <label>
          Name:{" "}
          <input
            value={state.user.name}
            onChange={(e) => (state.user.name = e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          City:{" "}
          <input
            value={state.user.address.city}
            onChange={(e) => (state.user.address.city = e.target.value)}
          />
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        Tags: {state.tags.join(", ")}
        <button
          style={{ marginLeft: 8 }}
          onClick={() => state.tags.push(`tag-${state.tags.length}`)}
        >
          Add tag
        </button>
      </div>
      <pre style={{ background: "#f5f5f5", padding: 8, borderRadius: 4 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}

const meta: Meta = {
  title: "Reactive & State/useReactive",
};

export default meta;

export const Counter: StoryObj = {
  render: () => <ReactiveCounter />,
};

export const NestedObjects: StoryObj = {
  render: () => <ReactiveNested />,
};
