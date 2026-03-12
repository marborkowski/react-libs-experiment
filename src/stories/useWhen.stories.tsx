import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useWhen } from "../hooks/useWhen";

function ModalOnCondition() {
  const [isOnline, setIsOnline] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  useWhen(!isOnline, () => {
    setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] Went offline — effect fired`]);
    return () => {
      setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] Back online — cleanup fired`]);
    };
  });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <button onClick={() => setIsOnline((v) => !v)}>
        Toggle: {isOnline ? "Online" : "Offline"}
      </button>
      <div
        style={{
          marginTop: 12,
          background: "#f5f5f5",
          padding: 8,
          borderRadius: 4,
          maxHeight: 200,
          overflow: "auto",
        }}
      >
        <strong>Event log:</strong>
        {log.map((entry, i) => (
          <div key={i} style={{ fontFamily: "monospace", fontSize: 13 }}>
            {entry}
          </div>
        ))}
        {log.length === 0 && (
          <div style={{ color: "#888" }}>Toggle the button to see events...</div>
        )}
      </div>
    </div>
  );
}

function ThresholdAlert() {
  const [value, setValue] = useState(50);
  const [alerts, setAlerts] = useState<string[]>([]);

  useWhen(value > 80, () => {
    setAlerts((a) => [...a, `Value exceeded 80! (current: ${value})`]);
  });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <label>
        Value:{" "}
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <strong>{value}</strong>
      </label>
      <div style={{ marginTop: 8 }}>
        {alerts.map((a, i) => (
          <div key={i}>{a}</div>
        ))}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Effects & Lifecycle/useWhen",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useWhen(condition: boolean, effect: () => void | (() => void)): void`",
          "",
          "**Event-driven** effect hook that fires only on the `false \u2192 true` transition of a condition,",
          "not on every render where the condition is true.",
          "",
          "### How it works internally",
          "1. Tracks the previous value of `condition` via a ref.",
          "2. Runs `effect` only when `condition` transitions from `false` to `true`.",
          "3. If `effect` returns a cleanup function, it runs when condition goes back to `false` or on unmount.",
          "4. Does **not** fire on mount if `condition` starts as `true` (only on transitions).",
          "",
          "### API",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `condition` | `boolean` | When this transitions `false \u2192 true`, the effect fires |",
          "| `effect` | `() => void \\| (() => void)` | Effect function, can optionally return cleanup |",
          "",
          "**Returns** `void`",
          "",
          "```tsx",
          "// Fire a toast when user goes offline",
          "useWhen(!navigator.onLine, () => {",
          "  showToast('You are offline');",
          "  return () => showToast('Back online!');  // cleanup on reverse transition",
          "});",
          "",
          "// Fire once when count exceeds threshold",
          "useWhen(count > 100, () => {",
          "  analytics.track('milestone_reached');",
          "});",
          "```",
          "",
          "### `useWhen` vs `useEffect`",
          "| | `useEffect` | `useWhen` |",
          "|---|---|---|",
          "| Fires on | Every render where deps change | Only on `false\u2192true` transition |",
          "| Mental model | Synchronization | Event/trigger |",
          "| Cleanup | On deps change + unmount | On `true\u2192false` transition + unmount |",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const ConditionalEffect: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Toggle the online/offline button. The effect fires when the condition (`!isOnline`) transitions to `true` (going offline). The cleanup fires when transitioning back to `false` (going online). Watch the event log to see exact timings.",
      },
      source: {
        code: `const [isOnline, setIsOnline] = useState(true);

useWhen(!isOnline, () => {
  // Fires on false -> true transition (went offline)
  console.log('Went offline');

  return () => {
    // Cleanup fires on true -> false transition (back online)
    console.log('Back online');
  };
});

<button onClick={() => setIsOnline(v => !v)}>
  Toggle: {isOnline ? "Online" : "Offline"}
</button>`,
      },
    },
  },
  render: () => <ModalOnCondition />,
};

export const ThresholdAlertDemo: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Drag the slider above 80 to trigger the alert. The effect fires only on the transition (crossing the threshold), not on every render where `value > 80`. Moving back below 80 and then above again triggers a new alert.",
      },
      source: {
        code: `const [value, setValue] = useState(50);

// Fires ONLY when value crosses the 80 threshold (false -> true)
// Does NOT re-fire while dragging above 80
useWhen(value > 80, () => {
  alert('Value exceeded 80!');
});

<input
  type="range" min={0} max={100}
  value={value}
  onChange={(e) => setValue(Number(e.target.value))}
/>`,
      },
    },
  },
  render: () => <ThresholdAlert />,
};
