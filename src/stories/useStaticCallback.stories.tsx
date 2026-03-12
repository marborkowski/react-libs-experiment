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
      <h3>useStaticCallback — Stable Function Identity</h3>
      <p>
        Parent count: <strong>{count}</strong>{" "}
        <button onClick={() => setCount((c) => c + 1)}>
          Force parent re-render
        </button>
      </p>
      <p>
        The normal callback changes identity on every render, causing the memo'd
        child to re-render. The static callback keeps the same identity.
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
};

export default meta;

export const StableIdentity: StoryObj = {
  render: () => <StaticCallbackDemo />,
};
