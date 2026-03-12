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
      <h3>useWhen — Conditional Effects</h3>
      <p>
        Effect fires on <code>false → true</code> transition. Cleanup fires on
        reverse.
      </p>
      <button onClick={() => setIsOnline((v) => !v)}>
        Toggle: {isOnline ? "🟢 Online" : "🔴 Offline"}
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
    setAlerts((a) => [...a, `⚠️ Value exceeded 80! (${value})`]);
  });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useWhen — Threshold Alert</h3>
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
};

export default meta;

export const ConditionalEffect: StoryObj = {
  render: () => <ModalOnCondition />,
};

export const ThresholdAlertDemo: StoryObj = {
  render: () => <ThresholdAlert />,
};
