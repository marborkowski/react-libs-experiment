import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useHistory } from "../hooks/useHistory";

function TextEditor() {
  const [text, setText, { undo, redo, canUndo, canRedo, clear, history, pointer }] =
    useHistory("Hello world");

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <textarea
        rows={4}
        cols={50}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ display: "block", marginBottom: 8 }}
      />
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>{" "}
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>{" "}
      <button onClick={clear}>Clear history</button>
      <div style={{ marginTop: 12 }}>
        <strong>
          History ({history.length} entries, pointer: {pointer}):
        </strong>
        <ul>
          {history.map((entry, i) => (
            <li key={i} style={{ fontWeight: i === pointer ? "bold" : "normal" }}>
              {i === pointer ? "\u2192 " : ""}
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
          Undo
        </button>{" "}
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <span style={{ marginLeft: 12 }}>Points: {points.length}</span>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Reactive & State/useHistory",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useHistory<T>(initialValue: T, options?): [state, setState, controls]`",
          "",
          "Drop-in replacement for `useState` that **tracks full edit history** with undo/redo.",
          "",
          "### How it works internally",
          "1. Maintains an internal array of past states and a `pointer` index.",
          "2. Every `setState` call pushes a new entry and advances the pointer.",
          "3. `undo()` / `redo()` move the pointer without modifying the history array.",
          "4. Calling `setState` after undoing discards forward history (standard undo behavior).",
          "5. When `history.length > maxSize`, the oldest entry is dropped.",
          "",
          "### API",
          "| Param | Type | Default | Description |",
          "|---|---|---|---|",
          "| `initialValue` | `T` | — | Starting value |",
          "| `options.maxSize` | `number` | `100` | Max history entries (oldest dropped first) |",
          "",
          "**Returns** `[state, setState, controls]`:",
          "",
          "| Control | Type | Description |",
          "|---|---|---|",
          "| `undo()` | `() => void` | Move pointer back one step |",
          "| `redo()` | `() => void` | Move pointer forward one step |",
          "| `canUndo` | `boolean` | Is there history to undo? |",
          "| `canRedo` | `boolean` | Is there forward history to redo? |",
          "| `clear()` | `() => void` | Reset history, keep only current value |",
          "| `history` | `readonly T[]` | Full history array (read-only) |",
          "| `pointer` | `number` | Current position in history |",
          "",
          "```tsx",
          "const [text, setText, { undo, redo, canUndo, canRedo, clear }] =",
          "  useHistory('initial');",
          "",
          "setText('new value');              // push to history",
          "setText(prev => prev + '!');       // functional update",
          "undo();                            // go back",
          "redo();                            // go forward",
          "clear();                           // keep current, drop history",
          "```",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const TextEditorDemo: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "A textarea where each keystroke creates a new history entry. Use Undo/Redo to navigate through the edit history. The list below shows all entries with the current pointer position highlighted.",
      },
      source: {
        code: `const [text, setText, { undo, redo, canUndo, canRedo, clear, history, pointer }] =
  useHistory("Hello world");

// Each change adds to history
<textarea value={text} onChange={(e) => setText(e.target.value)} />

// Navigate history
<button onClick={undo} disabled={!canUndo}>Undo</button>
<button onClick={redo} disabled={!canRedo}>Redo</button>
<button onClick={clear}>Clear history</button>

// Inspect history
history.length   // total entries
pointer          // current position (0-indexed)`,
      },
    },
  },
  render: () => <TextEditor />,
};

export const DrawingPointsDemo: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Click on the canvas to place points — each click creates a new history entry. Undo removes the last point, redo restores it. Uses `maxSize: 20` to limit memory — the oldest entries are automatically dropped when the limit is exceeded.",
      },
      source: {
        code: `const [points, setPoints, { undo, redo }] = useHistory<
  Array<{ x: number; y: number }>
>([], { maxSize: 20 });

// Each click adds all points + the new one (immutable update)
const handleClick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  setPoints([
    ...points,
    { x: e.clientX - rect.left, y: e.clientY - rect.top },
  ]);
};

// Undo/redo entire point sets
<button onClick={undo}>Undo</button>
<button onClick={redo}>Redo</button>`,
      },
    },
  },
  render: () => <DrawingPoints />,
};
