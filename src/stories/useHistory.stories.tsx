import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useHistory } from "../hooks/useHistory";

function TextEditor() {
  const [text, setText, { undo, redo, canUndo, canRedo, clear, history, pointer }] =
    useHistory("Hello world");

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useHistory — Text Editor with Undo/Redo</h3>
      <textarea
        rows={4}
        cols={50}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ display: "block", marginBottom: 8 }}
      />
      <button onClick={undo} disabled={!canUndo}>
        ⟵ Undo
      </button>{" "}
      <button onClick={redo} disabled={!canRedo}>
        Redo ⟶
      </button>{" "}
      <button onClick={clear}>Clear history</button>
      <div style={{ marginTop: 12 }}>
        <strong>History ({history.length} entries, pointer: {pointer}):</strong>
        <ul>
          {history.map((entry, i) => (
            <li key={i} style={{ fontWeight: i === pointer ? "bold" : "normal" }}>
              {i === pointer ? "→ " : ""}
              {JSON.stringify(entry).slice(0, 50)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DrawingPoints() {
  const [points, setPoints, { undo, redo, canUndo, canRedo }] = useHistory<
    Array<{ x: number; y: number }>
  >([], { maxSize: 20 });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useHistory — Drawing Points (maxSize: 20)</h3>
      <div
        style={{
          width: 400,
          height: 300,
          background: "#f0f0f0",
          border: "1px solid #ccc",
          position: "relative",
          cursor: "crosshair",
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPoints([
            ...points,
            { x: e.clientX - rect.left, y: e.clientY - rect.top },
          ]);
        }}
      >
        {points.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x - 5,
              top: p.y - 5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#e74c3c",
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={undo} disabled={!canUndo}>
          ⟵ Undo
        </button>{" "}
        <button onClick={redo} disabled={!canRedo}>
          Redo ⟶
        </button>
        <span style={{ marginLeft: 12 }}>Points: {points.length}</span>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Reactive & State/useHistory",
};

export default meta;

export const TextEditorDemo: StoryObj = {
  render: () => <TextEditor />,
};

export const DrawingPointsDemo: StoryObj = {
  render: () => <DrawingPoints />,
};
