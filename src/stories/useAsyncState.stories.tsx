import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useAsyncState } from "../hooks/useAsyncState";

// ---------------------------------------------------------------------------
// Story 1: Full-featured data fetching (retry, cancel, setData, callbacks)
// ---------------------------------------------------------------------------
function FullFeaturedFetch() {
  const [userId, setUserId] = useState(1);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const log = (msg: string) =>
    setEventLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 29),
    ]);

  const { data, loading, error, retry, cancel, setData } = useAsyncState(
    async (signal) => {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/users/${userId}`,
        { signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<{ name: string; email: string; phone: string }>;
    },
    [userId],
    {
      retryCount: 2,
      retryDelay: 500,
      onSuccess: (d) => log(`onSuccess — fetched: ${(d as any)?.name}`),
      onError: (e) => log(`onError — ${e.message}`),
    }
  );

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useAsyncState — Full-Featured Fetch</h3>
      <p>
        Demonstrates <strong>retry</strong> (2 attempts, 500ms exponential backoff),{" "}
        <strong>cancel</strong>, <strong>setData</strong>, and{" "}
        <strong>onSuccess / onError</strong> callbacks.
      </p>

      {/* User selector */}
      <div style={{ marginBottom: 12 }}>
        <strong>User ID: </strong>
        {[1, 2, 3, 4, 5].map((id) => (
          <button
            key={id}
            onClick={() => setUserId(id)}
            style={{
              fontWeight: id === userId ? "bold" : "normal",
              background: id === userId ? "#3498db" : "#eee",
              color: id === userId ? "#fff" : "#333",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              marginRight: 4,
              cursor: "pointer",
            }}
          >
            {id}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={retry} disabled={loading}>
          Retry manually
        </button>
        <button onClick={cancel} disabled={!loading}>
          Cancel
        </button>
        <button
          onClick={() =>
            setData({ name: "Overridden!", email: "manual@set.data", phone: "000" })
          }
        >
          setData (manual override)
        </button>
      </div>

      {/* State display */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 6 }}>
          <strong>State:</strong>
          <div>loading: <code>{String(loading)}</code></div>
          <div>error: <code>{error ? error.message : "null"}</code></div>
          {data && (
            <pre style={{ margin: "8px 0 0", fontSize: 13 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
          {!data && !loading && !error && (
            <div style={{ color: "#888", marginTop: 8 }}>No data yet</div>
          )}
        </div>

        <div
          style={{
            background: "#f9f9f9",
            padding: 12,
            borderRadius: 6,
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          <strong>Event log (onSuccess / onError):</strong>
          {eventLog.length === 0 && (
            <div style={{ color: "#888", marginTop: 4 }}>Waiting...</div>
          )}
          {eventLog.map((entry, i) => (
            <div key={i} style={{ fontFamily: "monospace", fontSize: 12 }}>
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story 2: Retry with simulated failures + exponential backoff visualization
// ---------------------------------------------------------------------------
let failCount = 0;

function RetryDemo() {
  const [failTimes, setFailTimes] = useState(2);
  const [retryCount, setRetryCount] = useState(3);
  const [retryDelay, setRetryDelay] = useState(800);
  const [attempts, setAttempts] = useState<Array<{ time: number; ok: boolean }>>([]);
  const [trigger, setTrigger] = useState(0);

  const startTime = React.useRef(Date.now());

  const { data, loading, error, retry } = useAsyncState(
    async () => {
      const elapsed = Date.now() - startTime.current;
      failCount++;
      if (failCount <= failTimes) {
        setAttempts((a) => [...a, { time: elapsed, ok: false }]);
        throw new Error(`Simulated failure #${failCount}`);
      }
      setAttempts((a) => [...a, { time: elapsed, ok: true }]);
      return { message: `Success after ${failCount} attempt(s)`, elapsed };
    },
    [trigger],
    { retryCount, retryDelay }
  );

  const reset = () => {
    failCount = 0;
    setAttempts([]);
    startTime.current = Date.now();
    setTrigger((t) => t + 1);
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useAsyncState — Retry with Exponential Backoff</h3>
      <p>
        Configure how many times the request fails and watch the retry timing.
        Delay doubles each attempt: {retryDelay}ms → {retryDelay * 2}ms → {retryDelay * 4}ms...
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        <label>
          Fail first N times:{" "}
          <input
            type="number"
            min={0}
            max={10}
            value={failTimes}
            onChange={(e) => setFailTimes(Number(e.target.value))}
            style={{ width: 50 }}
          />
        </label>
        <label>
          retryCount:{" "}
          <input
            type="number"
            min={0}
            max={10}
            value={retryCount}
            onChange={(e) => setRetryCount(Number(e.target.value))}
            style={{ width: 50 }}
          />
        </label>
        <label>
          retryDelay:{" "}
          <input
            type="number"
            min={100}
            max={5000}
            step={100}
            value={retryDelay}
            onChange={(e) => setRetryDelay(Number(e.target.value))}
            style={{ width: 70 }}
          />
          ms
        </label>
      </div>

      <button onClick={reset} style={{ marginBottom: 12 }}>
        Run experiment
      </button>{" "}
      <button onClick={retry} disabled={loading}>
        Retry
      </button>

      {/* Timeline */}
      <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <strong>Attempt timeline:</strong>
        {attempts.length === 0 && <div style={{ color: "#888" }}>Click "Run experiment"</div>}
        {attempts.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "monospace",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            <span style={{ width: 80, textAlign: "right" }}>{a.time}ms</span>
            <span
              style={{
                display: "inline-block",
                width: Math.max(a.time / 20, 4),
                height: 16,
                background: a.ok ? "#27ae60" : "#e74c3c",
                borderRadius: 3,
              }}
            />
            <span>
              Attempt #{i + 1} — {a.ok ? "SUCCESS" : "FAILED"}
            </span>
          </div>
        ))}
      </div>

      {/* Result */}
      {loading && <p>Loading (attempt in progress)...</p>}
      {error && <p style={{ color: "#e74c3c" }}>Final error: {error.message}</p>}
      {data && !loading && (
        <pre style={{ background: "#eafff0", padding: 8, borderRadius: 4 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story 3: Deferred execution (immediate: false) + cancel demo
// ---------------------------------------------------------------------------
function DeferredAndCancel() {
  const [query, setQuery] = useState("");
  const [trigger, setTrigger] = useState(0);

  const { data, loading, error, retry, cancel } = useAsyncState(
    async (signal) => {
      // Simulate a slow search
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 2000);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      return {
        query,
        results: Array.from({ length: 5 }, (_, i) => `${query} result #${i + 1}`),
        timestamp: new Date().toISOString(),
      };
    },
    [trigger],
    { immediate: false }
  );

  const search = () => {
    if (query.trim()) setTrigger((t) => t + 1);
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useAsyncState — Deferred (immediate: false) + Cancel</h3>
      <p>
        The async function does <strong>not</strong> run on mount. You trigger it
        manually. Takes 2s — try cancelling mid-flight.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a search query..."
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{ flex: 1, padding: "4px 8px" }}
        />
        <button onClick={search} disabled={loading}>
          Search (2s delay)
        </button>
        <button onClick={cancel} disabled={!loading} style={{ color: "#e74c3c" }}>
          Cancel
        </button>
        <button onClick={retry} disabled={loading}>
          Retry last
        </button>
      </div>

      {loading && (
        <div style={{ padding: 12, background: "#fff8e1", borderRadius: 6 }}>
          Searching for "{query}"... <em>(cancel to abort)</em>
        </div>
      )}
      {error && (
        <div style={{ padding: 12, background: "#fdecea", borderRadius: 6 }}>
          Error: {error.message}
        </div>
      )}
      {data && !loading && (
        <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 6 }}>
          <strong>Results for "{(data as any).query}":</strong>
          <ul>
            {(data as any).results.map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <div style={{ fontSize: 12, color: "#888" }}>
            Fetched at: {(data as any).timestamp}
          </div>
        </div>
      )}
      {!data && !loading && !error && (
        <div style={{ color: "#888" }}>Type a query and click Search.</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------
const meta: Meta = {
  title: "Effects & Lifecycle/useAsyncState",
};

export default meta;

export const FullFeatured: StoryObj = {
  render: () => <FullFeaturedFetch />,
};

export const RetryWithBackoff: StoryObj = {
  render: () => <RetryDemo />,
};

export const DeferredExecution: StoryObj = {
  render: () => <DeferredAndCancel />,
};
