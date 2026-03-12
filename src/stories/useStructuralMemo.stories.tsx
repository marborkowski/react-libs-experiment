import React, { useState, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useStructuralMemo } from "../hooks/useStructuralMemo";

function StructuralMemoDemo() {
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(50);
  const [unrelated, setUnrelated] = useState(0);

  const regularObj = { width, height };

  const memoizedObj = useStructuralMemo(() => ({ width, height }), [
    width,
    height,
  ]);

  const regularRef = useRef(regularObj);
  const memoRef = useRef(memoizedObj);

  const regularChanged = regularRef.current !== regularObj;
  const memoChanged = memoRef.current !== memoizedObj;

  regularRef.current = regularObj;
  memoRef.current = memoizedObj;

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useStructuralMemo — Structural Equality</h3>
      <p>
        Returns the same reference if the computed value is structurally
        identical, preventing unnecessary downstream re-renders.
      </p>
      <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
        <label>
          Width:{" "}
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        <label>
          Height:{" "}
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        <button onClick={() => setUnrelated((n) => n + 1)}>
          Force re-render (unrelated: {unrelated})
        </button>
      </div>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: 8, borderBottom: "2px solid #ccc" }}></th>
            <th style={{ padding: 8, borderBottom: "2px solid #ccc" }}>
              Regular object
            </th>
            <th style={{ padding: 8, borderBottom: "2px solid #ccc" }}>
              useStructuralMemo
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: 8 }}>Reference changed?</td>
            <td
              style={{
                padding: 8,
                color: regularChanged ? "#e74c3c" : "#27ae60",
              }}
            >
              {regularChanged ? "YES (new ref)" : "Same ref"}
            </td>
            <td
              style={{
                padding: 8,
                color: memoChanged ? "#e74c3c" : "#27ae60",
              }}
            >
              {memoChanged ? "YES (new ref)" : "Same ref ✓"}
            </td>
          </tr>
        </tbody>
      </table>
      <p style={{ color: "#888", fontSize: 13 }}>
        Click "Force re-render" — the regular object gets a new reference every
        time, but useStructuralMemo keeps the same reference since the values
        haven't changed.
      </p>
    </div>
  );
}

const meta: Meta = {
  title: "Performance & Memoization/useStructuralMemo",
};

export default meta;

export const StructuralEquality: StoryObj = {
  render: () => <StructuralMemoDemo />,
};
