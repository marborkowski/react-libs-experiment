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
      <h3>useWorker — Off-Main-Thread Computation</h3>
      <p>
        Heavy computation runs in a Web Worker. The UI stays responsive.
      </p>
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
        because the work is off the main thread.
      </p>
      <input placeholder="Type here to test UI responsiveness..." style={{ width: 300 }} />
    </div>
  );
}

const meta: Meta = {
  title: "Workers & Communication/useWorker",
};

export default meta;

export const FibonacciDemo: StoryObj = {
  render: () => <FibonacciWorker />,
};
