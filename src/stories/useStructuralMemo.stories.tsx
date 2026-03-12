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
              {memoChanged ? "YES (new ref)" : "Same ref"}
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
  parameters: {
    docs: {
      description: {
        component: [
          "## `useStructuralMemo<T>(factory: () => T, deps: DependencyList): T`",
          "",
          "Like `useMemo`, but with **structural equality** — if the factory produces a value",
          "that is deeply equal to the previous one, the old reference is returned.",
          "",
          "### How it works internally",
          "1. Runs `factory()` whenever `deps` change (same as `useMemo`).",
          "2. Compares the new result with the previously cached result using `deepEqual`.",
          "3. If structurally identical \u2192 returns the **old** reference (no new object).",
          "4. If different \u2192 caches and returns the **new** reference.",
          "",
          "### API",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `factory` | `() => T` | Computation function (same as useMemo) |",
          "| `deps` | `DependencyList` | Dependency array (same as useMemo) |",
          "",
          "**Returns** `T` \u2014 memoized value with reference stability guarantee.",
          "",
          "```tsx",
          "// Without useStructuralMemo:",
          "const config = useMemo(() => ({ theme, locale }), [theme, locale]);",
          "// config is a NEW object every time deps change, even if values are same",
          "",
          "// With useStructuralMemo:",
          "const config = useStructuralMemo(() => ({ theme, locale }), [theme, locale]);",
          "// config keeps the SAME reference if { theme, locale } hasn't changed",
          "",
          "// This prevents cascading re-renders in children that use config as a prop",
          "<MemoizedChild config={config} />",
          "```",
          "",
          "### When to use",
          "- Derived objects/arrays passed as props to `React.memo` children",
          "- Preventing re-renders when the computed shape hasn't really changed",
          "- API response transforms where the shape is stable but the reference isn't",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const StructuralEquality: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Compare a regular `{ width, height }` object (new reference every render) vs `useStructuralMemo(() => ({ width, height }), [width, height])`. Click \"Force re-render\" without changing width/height — the regular object creates a new reference, but `useStructuralMemo` returns the same one since the values are deeply equal.",
      },
      source: {
        code: `const [width, setWidth] = useState(100);
const [height, setHeight] = useState(50);

// Regular object: NEW reference on every render
const regularObj = { width, height };

// Structural memo: SAME reference if values unchanged
const memoizedObj = useStructuralMemo(
  () => ({ width, height }),
  [width, height]
);

// regularObj !== previousRegularObj  (always true, even if values same)
// memoizedObj === previousMemoizedObj (true when values unchanged!)

// Pass to memo'd child — avoids unnecessary re-renders
<MemoizedCanvas dimensions={memoizedObj} />`,
      },
    },
  },
  render: () => <StructuralMemoDemo />,
};
