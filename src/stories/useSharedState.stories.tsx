import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useSharedState } from "../hooks/useSharedState";

function ComponentA() {
  const [count, setCount] = useSharedState("shared-counter", 0);
  return (
    <div style={{ padding: 16, border: "2px solid #3498db", borderRadius: 8 }}>
      <h4 style={{ margin: 0, color: "#3498db" }}>Component A</h4>
      <p>
        Count: <strong>{count}</strong>
      </p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}

function ComponentB() {
  const [count, setCount] = useSharedState("shared-counter", 0);
  return (
    <div style={{ padding: 16, border: "2px solid #e74c3c", borderRadius: 8 }}>
      <h4 style={{ margin: 0, color: "#e74c3c" }}>Component B</h4>
      <p>
        Count: <strong>{count}</strong>
      </p>
      <button onClick={() => setCount((c) => c + 10)}>+10</button>
    </div>
  );
}

function ComponentC() {
  const [count, setCount] = useSharedState("shared-counter", 0);
  return (
    <div style={{ padding: 16, border: "2px solid #27ae60", borderRadius: 8 }}>
      <h4 style={{ margin: 0, color: "#27ae60" }}>Component C</h4>
      <p>
        Count: <strong>{count}</strong>
      </p>
      <button onClick={() => setCount(0)}>Reset to 0</button>
    </div>
  );
}

function SharedStateDemo() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p>
        All three components share the <code>"shared-counter"</code> key. Open
        this page in another browser tab to see cross-tab synchronization.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <ComponentA />
        <ComponentB />
        <ComponentC />
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Reactive & State/useSharedState",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useSharedState<T>(key: string, initialValue: T): [value, setValue]`",
          "",
          "**Global persistent state** that syncs across components AND browser tabs.",
          "A `useState` that survives page reloads and works everywhere.",
          "",
          "### How it works internally",
          "1. On first call with a given `key`, reads from `localStorage` (or falls back to `initialValue`).",
          "2. All components using the same `key` share a single in-memory store (module-level `Map`).",
          "3. When any component calls `setValue`, all subscribers re-render with the new value.",
          "4. State is persisted to `localStorage` on every change.",
          "5. Cross-tab sync uses `BroadcastChannel` (fast, modern) with `storage` event fallback.",
          "",
          "### API",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `key` | `string` | Unique identifier. All hooks with same key share state |",
          "| `initialValue` | `T` | Default value (used only if nothing in localStorage) |",
          "",
          "**Returns** `[value, setValue]` — same API as `useState` (supports functional updates).",
          "",
          "```tsx",
          "// Component A — anywhere in the tree",
          "const [theme, setTheme] = useSharedState('app-theme', 'light');",
          "",
          "// Component B — completely unrelated, same key",
          "const [theme, setTheme] = useSharedState('app-theme', 'light');",
          "",
          "// When A calls setTheme('dark'), B re-renders with 'dark'.",
          "// Also syncs to other browser tabs!",
          "```",
          "",
          "### Sync mechanisms",
          "| Layer | Mechanism | Speed |",
          "|---|---|---|",
          "| Same tab | In-memory subscriber `Set` | Instant |",
          "| Cross tab | `BroadcastChannel` | ~ms |",
          "| Cross tab (fallback) | `storage` event | ~ms |",
          "| Persistence | `localStorage` | Survives reload |",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const CrossComponentSync: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Three independent components (A, B, C) all use `useSharedState(\"shared-counter\", 0)`. Clicking any button instantly updates all three. Try duplicating this tab — changes propagate across tabs via `BroadcastChannel`.",
      },
      source: {
        code: `// No shared parent state, no context provider needed!
function ComponentA() {
  const [count, setCount] = useSharedState("shared-counter", 0);
  return <button onClick={() => setCount(c => c + 1)}>+1 ({count})</button>;
}

function ComponentB() {
  const [count, setCount] = useSharedState("shared-counter", 0);
  return <button onClick={() => setCount(c => c + 10)}>+10 ({count})</button>;
}

function ComponentC() {
  const [count, setCount] = useSharedState("shared-counter", 0);
  return <button onClick={() => setCount(0)}>Reset ({count})</button>;
}

// Same key = shared state. Different key = independent state.
// Data persists in localStorage across page reloads.`,
      },
    },
  },
  render: () => <SharedStateDemo />,
};
