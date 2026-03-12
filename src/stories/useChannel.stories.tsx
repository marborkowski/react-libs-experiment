import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useChannel } from "../hooks/useChannel";

function ChatSender() {
  const [input, setInput] = useState("");
  const send = useChannel<{ user: string; text: string }>("chat");

  return (
    <div style={{ padding: 16, border: "2px solid #3498db", borderRadius: 8 }}>
      <h4 style={{ margin: 0, color: "#3498db" }}>Sender</h4>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              send({ user: "Alice", text: input });
              setInput("");
            }
          }}
        />
        <button
          onClick={() => {
            if (input.trim()) {
              send({ user: "Alice", text: input });
              setInput("");
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ChatReceiver() {
  const [messages, setMessages] = useState<Array<{ user: string; text: string }>>([]);

  useChannel<{ user: string; text: string }>("chat", (msg) => {
    setMessages((m) => [...m, msg]);
  });

  return (
    <div style={{ padding: 16, border: "2px solid #e74c3c", borderRadius: 8 }}>
      <h4 style={{ margin: 0, color: "#e74c3c" }}>Receiver</h4>
      <div style={{ marginTop: 8, minHeight: 100 }}>
        {messages.length === 0 && (
          <span style={{ color: "#888" }}>Waiting for messages...</span>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelDemo() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p>
        The Sender uses <code>useChannel("chat")</code> (send-only). The Receiver
        uses <code>useChannel("chat", listener)</code> (subscribe + send).
        No shared parent state or context needed.
      </p>
      <div style={{ display: "flex", gap: 16 }}>
        <ChatSender />
        <ChatReceiver />
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Workers & Communication/useChannel",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useChannel<T>(channel: string, listener?: (msg: T) => void): (msg: T) => void`",
          "",
          "Lightweight **pub/sub event bus** for cross-component communication without prop drilling or context.",
          "",
          "### How it works internally",
          "1. Uses a global singleton `Map<string, Set<listener>>` as the event bus.",
          "2. `useChannel(name)` returns a `send` function that emits to all subscribers on that channel.",
          "3. `useChannel(name, listener)` also subscribes — the listener receives all messages.",
          "4. Automatically unsubscribes on unmount (no memory leaks).",
          "5. Multiple components can subscribe to the same channel \u2014 all receive all messages.",
          "",
          "### API",
          "",
          "**Overload 1 (send only):**",
          "```tsx",
          "const send = useChannel<{ type: string }>('notifications');",
          "send({ type: 'info' });  // emits to all listeners",
          "```",
          "",
          "**Overload 2 (send + receive):**",
          "```tsx",
          "const send = useChannel<{ type: string }>('notifications', (msg) => {",
          "  console.log('Received:', msg);",
          "});",
          "```",
          "",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `channel` | `string` | Channel name/identifier |",
          "| `listener` | `(msg: T) => void` | Optional message handler |",
          "",
          "**Returns** `(msg: T) => void` \u2014 send function.",
          "",
          "### Additional exports",
          "- `resetChannels()` \u2014 clears all subscriptions (useful for testing).",
          "",
          "### When to use",
          "- Decoupled components that need to communicate (e.g. sidebar \u2194 main panel)",
          "- Global notifications / toasts / alerts without a provider",
          "- Event-driven architectures within React",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const PubSubChat: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Type a message in the Sender and press Enter or click Send. The Receiver picks it up via the `\"chat\"` channel. These components have **no shared state** — communication is entirely through the channel event bus.",
      },
      source: {
        code: `// Sender: only sends, no listener
function ChatSender() {
  const send = useChannel<{ user: string; text: string }>("chat");

  return (
    <button onClick={() => send({ user: "Alice", text: "Hello!" })}>
      Send
    </button>
  );
}

// Receiver: subscribes + can also send
function ChatReceiver() {
  const [messages, setMessages] = useState([]);

  useChannel<{ user: string; text: string }>("chat", (msg) => {
    setMessages(m => [...m, msg]);
  });

  return messages.map(msg => <div>{msg.user}: {msg.text}</div>);
}

// No context provider needed — just use the same channel name!`,
      },
    },
  },
  render: () => <ChannelDemo />,
};
