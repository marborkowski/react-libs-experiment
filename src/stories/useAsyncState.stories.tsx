import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useAsyncState } from "../hooks/useAsyncState";

function FakeApiFetch() {
  const [userId, setUserId] = useState(1);

  const { data, loading, error, retry, cancel } = useAsyncState(
    async (signal) => {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/users/${userId}`,
        { signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [userId],
    { retryCount: 2, retryDelay: 500 }
  );

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useAsyncState — Data Fetching</h3>
      <p>Auto-cancels previous requests on dep change. Supports retry.</p>
      <div style={{ marginBottom: 12 }}>
        User ID:{" "}
        {[1, 2, 3, 4, 5].map((id) => (
          <button
            key={id}
            onClick={() => setUserId(id)}
            style={{
              fontWeight: id === userId ? "bold" : "normal",
              marginRight: 4,
            }}
          >
            {id}
          </button>
        ))}
      </div>
      {loading && <p>Loading...</p>}
      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}{" "}
          <button onClick={retry}>Retry</button>
        </p>
      )}
      {data && !loading && (
        <pre style={{ background: "#f5f5f5", padding: 8, borderRadius: 4 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      <button onClick={cancel} disabled={!loading}>
        Cancel
      </button>
    </div>
  );
}

function DelayedComputation() {
  const [delay, setDelay] = useState(1000);

  const { data, loading } = useAsyncState(
    async () => {
      await new Promise((r) => setTimeout(r, delay));
      return { result: Math.random(), computedAt: new Date().toISOString() };
    },
    [delay],
    { immediate: true }
  );

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useAsyncState — Delayed Computation</h3>
      <label>
        Delay (ms):{" "}
        <input
          type="range"
          min={200}
          max={3000}
          step={200}
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
        />
        {delay}ms
      </label>
      <p>{loading ? "Computing..." : `Result: ${JSON.stringify(data)}`}</p>
    </div>
  );
}

const meta: Meta = {
  title: "Effects & Lifecycle/useAsyncState",
};

export default meta;

export const DataFetching: StoryObj = {
  render: () => <FakeApiFetch />,
};

export const DelayedComputationDemo: StoryObj = {
  render: () => <DelayedComputation />,
};
