import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useWorker } from "../hooks/useWorker";

function FibonacciWorker() {
  const [n, setN] = useState(35);

  const { result, loading, error, retry } = useWorker(
    (input: number) => {
      function fib(n: number): number {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
      }
      return fib(input);
    },
    n
  );

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <label>
        Fibonacci N:{" "}
        <input
          type="range"
          min={1}
          max={42}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
        />
        <strong>{n}</strong>
      </label>
      <div style={{ marginTop: 12 }}>
        {loading && <p>Computing fib({n})...</p>}
        {error && (
          <p style={{ color: "red" }}>
            Error: {error.message} <button onClick={retry}>Retry</button>
          </p>
        )}
        {result !== undefined && !loading && (
          <p style={{ fontSize: 24 }}>
            fib({n}) = <strong>{result}</strong>
          </p>
        )}
      </div>
      <p style={{ color: "#888", fontSize: 13 }}>
        Try typing in the input below while computing — the UI stays responsive
        because the work runs in a Web Worker off the main thread.
      </p>
      <input placeholder="Type here to test UI responsiveness..." style={{ width: 300 }} />
    </div>
  );
}

const meta: Meta = {
  title: "Workers & Communication/useWorker",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useWorker<TInput, TResult>(workerFn, input): { result, loading, error, retry }`",
          "",
          "Runs a **pure function in a Web Worker** — heavy computation off the main thread",
          "so the UI stays responsive.",
          "",
          "### How it works internally",
          "1. Serializes `workerFn` to a string via `.toString()`.",
          "2. Creates an inline Web Worker from a `Blob` URL (no separate worker file needed).",
          "3. Posts `input` to the worker, receives the result via `onmessage`.",
          "4. Automatically re-runs when `input` changes (deep comparison).",
          "5. Cleans up (terminates worker) on unmount.",
          "",
          "### API",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `workerFn` | `(input: TInput) => TResult \\| Promise<TResult>` | **Self-contained** function (no closures!) |",
          "| `input` | `TInput` | Data to pass to the worker |",
          "",
          "**Returns:**",
          "| Field | Type | Description |",
          "|---|---|---|",
          "| `result` | `TResult \\| undefined` | Computation result |",
          "| `loading` | `boolean` | Is the worker running? |",
          "| `error` | `Error \\| undefined` | Error from the worker |",
          "| `retry` | `() => void` | Re-run the worker with current input |",
          "",
          "```tsx",
          "const { result, loading } = useWorker(",
          "  (data: number[]) => {",
          "    // This runs in a Web Worker — no access to DOM or closures!",
          "    return data.reduce((sum, n) => sum + n, 0);",
          "  },",
          "  largeDataSet",
          ");",
          "```",
          "",
          "### Constraints",
          "- `workerFn` must be **self-contained** — it cannot reference closures, imports, or DOM APIs.",
          "- `input` must be serializable (transferred via `postMessage`).",
          "- Supports both sync and async worker functions.",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const FibonacciDemo: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Computes Fibonacci numbers using naive recursion — intentionally slow for large N. The computation runs in a Web Worker, so the main thread stays free. Try typing in the text input while `fib(42)` computes — no jank! The `retry` button re-runs the computation.",
      },
      source: {
        code: `const [n, setN] = useState(35);

const { result, loading, error, retry } = useWorker(
  // Self-contained function — runs in a Web Worker
  (input: number) => {
    function fib(n: number): number {
      if (n <= 1) return n;
      return fib(n - 1) + fib(n - 2);
    }
    return fib(input);
  },
  n  // re-runs when n changes
);

// UI stays responsive while worker computes!
{loading && <p>Computing...</p>}
{result !== undefined && <p>fib({n}) = {result}</p>}
{error && <button onClick={retry}>Retry</button>}`,
      },
    },
  },
  render: () => <FibonacciWorker />,
};
