import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useAsyncState } from "../hooks/useAsyncState";

// ---------------------------------------------------------------------------
// Story 1: Full-featured data fetching
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
          <div>
            loading: <code>{String(loading)}</code>
          </div>
          <div>
            error: <code>{error ? error.message : "null"}</code>
          </div>
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
// Story 2: Retry with exponential backoff visualization
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
      <p>
        Configure how many times the request fails and watch the retry timing.
        Delay doubles each attempt:{" "}
        <code>
          {retryDelay}ms \u2192 {retryDelay * 2}ms \u2192 {retryDelay * 4}ms
        </code>
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

      <div
        style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, marginBottom: 12 }}
      >
        <strong>Attempt timeline:</strong>
        {attempts.length === 0 && (
          <div style={{ color: "#888" }}>Click "Run experiment"</div>
        )}
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
// Story 3: Deferred execution (immediate: false) + cancel
// ---------------------------------------------------------------------------
function DeferredAndCancel() {
  const [query, setQuery] = useState("");
  const [trigger, setTrigger] = useState(0);

  const { data, loading, error, retry, cancel } = useAsyncState(
    async (signal) => {
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
      <p>
        With <code>immediate: false</code>, the async function does not run on mount.
        You trigger it manually. This search simulates a 2s delay — try cancelling mid-flight.
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
  parameters: {
    docs: {
      description: {
        component: [
          "## `useAsyncState<T>(asyncFn, deps, options?): AsyncStateReturn<T>`",
          "",
          "**Async-native state primitive** with built-in loading/error tracking,",
          "cancellation, retry with exponential backoff, and lifecycle callbacks.",
          "",
          "### How it works internally",
          "1. Wraps the async function in an `AbortController` — passes `signal` to your function.",
          "2. When `deps` change, the previous in-flight request is **auto-cancelled** (race condition protection).",
          "3. On unmount, the current request is auto-cancelled (no state updates after unmount).",
          "4. On error, retries up to `retryCount` times with exponential backoff (`retryDelay * 2^attempt`).",
          "5. State machine: `idle \u2192 loading \u2192 success | error`.",
          "",
          "### API",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `asyncFn` | `(signal: AbortSignal) => Promise<T>` | Your async function |",
          "| `deps` | `DependencyList` | Re-executes when these change |",
          "| `options.immediate` | `boolean` (`true`) | Run on mount? |",
          "| `options.retryCount` | `number` (`0`) | Max retry attempts |",
          "| `options.retryDelay` | `number` (`1000`) | Base delay (ms), doubles each retry |",
          "| `options.onSuccess` | `(data) => void` | Called on success |",
          "| `options.onError` | `(error) => void` | Called on final failure |",
          "",
          "**Returns:**",
          "| Field | Type | Description |",
          "|---|---|---|",
          "| `data` | `T \\| undefined` | Resolved data |",
          "| `loading` | `boolean` | Is the request in flight? |",
          "| `error` | `Error \\| undefined` | Last error |",
          "| `retry()` | `() => void` | Re-execute the async function |",
          "| `cancel()` | `() => void` | Abort the current request |",
          "| `setData(data)` | `(data: T) => void` | Manually set data (optimistic updates) |",
          "",
          "```tsx",
          "const { data, loading, error, retry, cancel, setData } = useAsyncState(",
          "  async (signal) => {",
          "    const res = await fetch('/api/users', { signal });",
          "    return res.json();",
          "  },",
          "  [page],",
          "  { retryCount: 3, retryDelay: 500, onError: (e) => toast.error(e.message) }",
          ");",
          "```",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const FullFeatured: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Fetches user data from JSONPlaceholder with `retryCount: 2` and `retryDelay: 500ms`. Demonstrates all returned fields: `data`, `loading`, `error`, `retry()`, `cancel()`, `setData()`. The event log panel shows `onSuccess`/`onError` callbacks firing in real-time. Switch user IDs rapidly to see auto-cancellation of previous requests.",
      },
      source: {
        code: `const { data, loading, error, retry, cancel, setData } = useAsyncState(
  async (signal) => {
    const res = await fetch(\`/api/users/\${userId}\`, { signal });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json();
  },
  [userId],  // re-fetches when userId changes, cancels previous
  {
    retryCount: 2,         // retry up to 2 times on failure
    retryDelay: 500,       // 500ms -> 1000ms exponential backoff
    onSuccess: (d) => console.log('Fetched:', d),
    onError: (e) => console.error('Failed:', e),
  }
);

// Manual controls
<button onClick={retry}>Retry</button>
<button onClick={cancel}>Cancel</button>
<button onClick={() => setData(optimisticValue)}>setData</button>`,
      },
    },
  },
  render: () => <FullFeaturedFetch />,
};

export const RetryWithBackoff: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Simulates a flaky API that fails N times before succeeding. Configure `retryCount` and `retryDelay` to see exponential backoff in action. The timeline visualizes each attempt with its timestamp — notice how delays double: 800ms, 1600ms, 3200ms. If failures exceed retryCount, the final error is surfaced.",
      },
      source: {
        code: `// Simulated flaky API
const { data, loading, error, retry } = useAsyncState(
  async () => {
    attemptCount++;
    if (attemptCount <= failTimes) {
      throw new Error(\`Simulated failure #\${attemptCount}\`);
    }
    return { message: 'Success!' };
  },
  [trigger],
  {
    retryCount: 3,    // max 3 retries after initial failure
    retryDelay: 800,  // 800ms -> 1600ms -> 3200ms (exponential)
  }
);

// Backoff formula: retryDelay * 2^attempt
// Attempt 0: immediate
// Attempt 1: 800ms wait
// Attempt 2: 1600ms wait
// Attempt 3: 3200ms wait`,
      },
    },
  },
  render: () => <RetryDemo />,
};

export const DeferredExecution: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "With `immediate: false`, the async function does NOT run on mount — you trigger it manually. This is useful for search forms, form submissions, or any user-initiated async action. The 2-second simulated delay lets you test mid-flight cancellation via `cancel()` and re-execution via `retry()`.",
      },
      source: {
        code: `const { data, loading, error, retry, cancel } = useAsyncState(
  async (signal) => {
    // Use signal for cancellation support
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 2000);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
    return { results: ['...'] };
  },
  [trigger],
  { immediate: false }  // does NOT run on mount
);

// Manually trigger execution
const search = () => setTrigger(t => t + 1);

// Cancel mid-flight
<button onClick={cancel} disabled={!loading}>Cancel</button>

// Re-run last query
<button onClick={retry}>Retry</button>`,
      },
    },
  },
  render: () => <DeferredAndCancel />,
};
