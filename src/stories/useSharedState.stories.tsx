import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useSharedState } from "../hooks/useSharedState";

// ---------------------------------------------------------------------------
// Story 1: In-memory (default, no persistence)
// ---------------------------------------------------------------------------
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

function InMemoryDemo() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p>
        All three components share the <code>"shared-counter"</code> key.
        State is <strong>in-memory only</strong> (no localStorage). Cross-tab sync
        via BroadcastChannel.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <ComponentA />
        <ComponentB />
        <ComponentC />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story 2: With persistence adapter
// ---------------------------------------------------------------------------
function PersistedTheme() {
  const [theme, setTheme] = useSharedState("demo-theme", "light", {
    persist: "localStorage",
  });

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: 24,
        borderRadius: 8,
        background: theme === "dark" ? "#1a1a2e" : "#ffffff",
        color: theme === "dark" ? "#e0e0e0" : "#333",
        border: "1px solid #ccc",
      }}
    >
      <h4 style={{ margin: "0 0 12px" }}>
        Theme: <code>{theme}</code>
      </h4>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setTheme("light")}>Light</button>
        <button onClick={() => setTheme("dark")}>Dark</button>
        <button onClick={() => setTheme("system")}>System</button>
      </div>
      <p style={{ fontSize: 13, marginTop: 12, opacity: 0.7 }}>
        This state is persisted to localStorage. Reload the page — it remembers your choice.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story 3: Custom adapter
// ---------------------------------------------------------------------------
function CustomAdapterDemo() {
  const [adapterLog, setAdapterLog] = useState<string[]>([]);

  // A custom adapter that logs every read/write
  const loggingAdapter = React.useMemo(
    () => ({
      getItem: (key: string) => {
        const val = sessionStorage.getItem(key);
        setAdapterLog((l) => [
          ...l.slice(-9),
          `getItem("${key}") → ${val === null ? "null" : `"${val}"`}`,
        ]);
        return val;
      },
      setItem: (key: string, value: string) => {
        sessionStorage.setItem(key, value);
        setAdapterLog((l) => [
          ...l.slice(-9),
          `setItem("${key}", "${value}")`,
        ]);
      },
      removeItem: (key: string) => {
        sessionStorage.removeItem(key);
        setAdapterLog((l) => [...l.slice(-9), `removeItem("${key}")`]);
      },
    }),
    []
  );

  const [value, setValue] = useSharedState("custom-adapter-demo", 0, {
    persist: loggingAdapter,
  });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p>
        Value: <strong>{value}</strong>{" "}
        <button onClick={() => setValue((v) => v + 1)}>+1</button>{" "}
        <button onClick={() => setValue(0)}>Reset</button>
      </p>
      <div
        style={{
          background: "#f5f5f5",
          padding: 12,
          borderRadius: 6,
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        <strong>Custom adapter log:</strong>
        {adapterLog.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
        {adapterLog.length === 0 && (
          <div style={{ color: "#888" }}>Interact with the counter...</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------
const meta: Meta = {
  title: "Reactive & State/useSharedState",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useSharedState<T>(key, initialValue, options?): [value, setValue]`",
          "",
          "**Global shared state** that syncs across components and browser tabs.",
          "By default, state is **in-memory only** — no localStorage, no persistence, no security concerns.",
          "",
          "### How it works internally",
          "1. All components using the same `key` share a single in-memory store (module-level `Map`).",
          "2. When any component calls `setValue`, all subscribers re-render with the new value.",
          "3. Cross-tab sync via `BroadcastChannel` (works without any persistence adapter).",
          "4. **Optionally** persist via `persist` option — `'localStorage'`, `'sessionStorage'`, or a custom `StorageAdapter`.",
          "",
          "### API",
          "| Param | Type | Default | Description |",
          "|---|---|---|---|",
          "| `key` | `string` | — | Unique identifier. Same key = shared state |",
          "| `initialValue` | `T` | — | Default value |",
          "| `options.persist` | `'localStorage' \\| 'sessionStorage' \\| StorageAdapter` | `undefined` | Persistence layer (none by default) |",
          "| `options.serialize` | `(value: T) => string` | `JSON.stringify` | Custom serializer |",
          "| `options.deserialize` | `(raw: string) => T` | `JSON.parse` | Custom deserializer |",
          "",
          "**Returns** `[value, setValue]` — same API as `useState` (supports functional updates).",
          "",
          "```tsx",
          "// In-memory only (default) — safe, no localStorage",
          "const [count, setCount] = useSharedState('counter', 0);",
          "",
          "// With localStorage persistence (opt-in)",
          "const [theme, setTheme] = useSharedState('theme', 'light', {",
          "  persist: 'localStorage',",
          "});",
          "",
          "// With custom encrypted adapter",
          "const [data, setData] = useSharedState('sensitive', defaults, {",
          "  persist: encryptedStorageAdapter,",
          "  serialize: (v) => encrypt(JSON.stringify(v)),",
          "  deserialize: (s) => JSON.parse(decrypt(s)),",
          "});",
          "```",
          "",
          "### `StorageAdapter` interface",
          "```tsx",
          "interface StorageAdapter {",
          "  getItem(key: string): string | null;",
          "  setItem(key: string, value: string): void;",
          "  removeItem(key: string): void;",
          "}",
          "```",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const InMemoryDefault: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Default mode: **no persistence**. State lives in memory and syncs across tabs via `BroadcastChannel`. Nothing touches localStorage or sessionStorage. Refreshing the page resets the counter.",
      },
      source: {
        code: `// Default — in-memory only, no persistence
const [count, setCount] = useSharedState("shared-counter", 0);

// All components with key "shared-counter" share this value
// Cross-tab sync via BroadcastChannel — no storage needed`,
      },
    },
  },
  render: () => <InMemoryDemo />,
};

export const WithPersistence: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Opt-in persistence via `persist: 'localStorage'`. The theme survives page reloads. This is explicit — you choose when data should be persisted.",
      },
      source: {
        code: `// Opt-in to localStorage persistence
const [theme, setTheme] = useSharedState("demo-theme", "light", {
  persist: "localStorage",
});

// Also available: persist: "sessionStorage" (cleared on tab close)`,
      },
    },
  },
  render: () => <PersistedTheme />,
};

export const CustomAdapter: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Custom `StorageAdapter` that wraps `sessionStorage` with logging. Every `getItem`/`setItem` call is traced. Use this pattern for encrypted storage, IndexedDB wrappers, or remote sync adapters.",
      },
      source: {
        code: `const loggingAdapter: StorageAdapter = {
  getItem: (key) => {
    console.log('read', key);
    return sessionStorage.getItem(key);
  },
  setItem: (key, value) => {
    console.log('write', key, value);
    sessionStorage.setItem(key, value);
  },
  removeItem: (key) => sessionStorage.removeItem(key),
};

const [value, setValue] = useSharedState("key", 0, {
  persist: loggingAdapter,
});

// For encrypted storage:
// persist: encryptedAdapter,
// serialize: (v) => encrypt(JSON.stringify(v)),
// deserialize: (s) => JSON.parse(decrypt(s)),`,
      },
    },
  },
  render: () => <CustomAdapterDemo />,
};
