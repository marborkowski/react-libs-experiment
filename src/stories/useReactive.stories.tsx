import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useReactive } from "../hooks/useReactive";

function ReactiveCounter() {
  const state = useReactive({ count: 0, label: "Clicks" });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
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
  parameters: {
    docs: {
      description: {
        component: [
          "## `useReactive<T>(initialState: T | (() => T)): T`",
          "",
          "Proxy-based reactive state that lets you **mutate state directly** — no `setState` needed.",
          "Every property assignment (including deeply nested ones) automatically triggers a re-render.",
          "",
          "### How it works internally",
          "1. Wraps `initialState` in a recursive `Proxy`.",
          "2. On any `set` / `deleteProperty` trap, batches updates via `queueMicrotask` and triggers a single re-render.",
          "3. Nested objects and arrays are lazily wrapped on first access — no deep-clone on init.",
          "",
          "### API",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `initialState` | `T \\| (() => T)` | Plain object/array, or a lazy initializer function |",
          "",
          "**Returns** `T` — the proxied state object. Mutate it directly:",
          "",
          "```tsx",
          "const state = useReactive({ count: 0, user: { name: 'Alice' } });",
          "",
          "state.count++;                    // triggers re-render",
          "state.user.name = 'Bob';          // deep mutation — also triggers re-render",
          "state.items.push('new item');      // array methods work",
          "state.items.splice(0, 1);          // splice works",
          "delete state.tempFlag;             // delete works",
          "```",
          "",
          "### When to use",
          "- Forms with many fields — no boilerplate `onChange` + `setState` per field",
          "- Complex nested state where immutable spread-updates (`{...obj, nested: {...}}`) are verbose",
          "- Rapid prototyping where you want Vue/MobX-style reactivity in React",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const Counter: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Basic counter showing direct property mutation. `state.count++` triggers a re-render — no `setState` callback needed. The label field shows two-way binding via direct string assignment.",
      },
      source: {
        code: `function ReactiveCounter() {
  const state = useReactive({ count: 0, label: "Clicks" });

  return (
    <>
      <p>{state.label}: {state.count}</p>

      {/* Direct mutation in event handlers */}
      <button onClick={() => state.count++}>Increment</button>
      <button onClick={() => state.count--}>Decrement</button>
      <button onClick={() => (state.count = 0)}>Reset</button>

      {/* Two-way binding on string property */}
      <input
        value={state.label}
        onChange={(e) => (state.label = e.target.value)}
      />
    </>
  );
}`,
      },
    },
  },
  render: () => <ReactiveCounter />,
};

export const NestedObjects: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates deep proxy tracking. Mutating `state.user.address.city` or calling `state.tags.push()` on a nested array both trigger re-renders automatically. The proxy is recursive — any depth works.",
      },
      source: {
        code: `function ReactiveNested() {
  const state = useReactive({
    user: { name: "John", address: { city: "NYC" } },
    tags: ["react", "hooks"],
  });

  // Deep nested mutation — triggers re-render
  state.user.address.city = "SF";

  // Array mutation — also tracked
  state.tags.push("new-tag");

  return (
    <>
      <input
        value={state.user.name}
        onChange={(e) => (state.user.name = e.target.value)}
      />
      <input
        value={state.user.address.city}
        onChange={(e) => (state.user.address.city = e.target.value)}
      />
    </>
  );
}`,
      },
    },
  },
  render: () => <ReactiveNested />,
};
