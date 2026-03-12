import React, { useState, memo } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useStaticCallback } from "../hooks/useStaticCallback";

let normalRenderCount = 0;
let staticRenderCount = 0;

const ChildWithNormal = memo(({ onClick }: { onClick: () => void }) => {
  normalRenderCount++;
  return (
    <div style={{ padding: 12, border: "2px solid #e74c3c", borderRadius: 8 }}>
      <strong style={{ color: "#e74c3c" }}>Normal callback child</strong>
      <p>Render count: {normalRenderCount}</p>
      <button onClick={onClick}>Click me</button>
    </div>
  );
});

const ChildWithStatic = memo(({ onClick }: { onClick: () => void }) => {
  staticRenderCount++;
  return (
    <div style={{ padding: 12, border: "2px solid #27ae60", borderRadius: 8 }}>
      <strong style={{ color: "#27ae60" }}>useStaticCallback child</strong>
      <p>Render count: {staticRenderCount}</p>
      <button onClick={onClick}>Click me</button>
    </div>
  );
});

function StaticCallbackDemo() {
  const [count, setCount] = useState(0);

  const normalHandler = () => setCount((c) => c + 1);
  const staticHandler = useStaticCallback(() => setCount((c) => c + 1));

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p>
        Parent count: <strong>{count}</strong>{" "}
        <button onClick={() => setCount((c) => c + 1)}>
          Force parent re-render
        </button>
      </p>
      <p style={{ color: "#888", fontSize: 13 }}>
        Click "Force parent re-render" and compare the render counts below.
        The normal callback creates a new function identity each render, breaking <code>React.memo</code>.
        The static callback keeps a stable identity forever.
      </p>
      <div style={{ display: "flex", gap: 16 }}>
        <ChildWithNormal onClick={normalHandler} />
        <ChildWithStatic onClick={staticHandler} />
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Performance & Memoization/useStaticCallback",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useStaticCallback<Args, R>(fn: (...args: Args) => R): (...args: Args) => R`",
          "",
          "Returns a function with a **permanently stable identity** that always calls the latest version of your callback.",
          "Like `useCallback` but without a dependency array — and the reference **never** changes.",
          "",
          "### How it works internally",
          "1. Stores the latest `fn` in a ref (updated synchronously via `useInsertionEffect`).",
          "2. Returns a stable wrapper function (created once, stored in a ref).",
          "3. When the wrapper is called, it reads the ref and invokes the latest `fn`.",
          "4. The wrapper reference never changes \u2014 `React.memo` children never re-render due to this prop.",
          "",
          "### API",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `fn` | `(...args: Args) => R` | The callback to stabilize |",
          "",
          "**Returns** `(...args: Args) => R` \u2014 same signature, stable identity forever.",
          "",
          "```tsx",
          "const handler = useStaticCallback((id: string) => {",
          "  // Always sees latest state/props via closure",
          "  console.log(currentUser, id);",
          "});",
          "",
          "// Safe to pass to memo'd children \u2014 identity never changes",
          "<MemoizedList onItemClick={handler} />",
          "",
          "// Safe in effect deps \u2014 won't trigger re-runs",
          "useEffect(() => { handler('init'); }, [handler]);",
          "```",
          "",
          "### `useStaticCallback` vs `useCallback`",
          "| | `useCallback` | `useStaticCallback` |",
          "|---|---|---|",
          "| Dependency array | Required | None |",
          "| Identity changes | When deps change | Never |",
          "| Stale closures | Possible if deps wrong | Impossible |",
          "| Use case | Conditional memoization | Always-stable identity |",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const StableIdentity: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Two `React.memo` children receive callbacks. The left child gets a normal inline function (new identity every render), the right gets a `useStaticCallback` wrapper (stable identity). Click \"Force parent re-render\" and watch the render counts diverge.",
      },
      source: {
        code: `const [count, setCount] = useState(0);

// Normal: new function identity every render
const normalHandler = () => setCount(c => c + 1);

// Static: same function identity forever
const staticHandler = useStaticCallback(() => setCount(c => c + 1));

// memo'd child with normal callback — re-renders on parent re-render!
<MemoChild onClick={normalHandler} />

// memo'd child with static callback — never re-renders from parent
<MemoChild onClick={staticHandler} />`,
      },
    },
  },
  render: () => <StaticCallbackDemo />,
};
