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
      <h3>useChannel — Pub/Sub Event Bus</h3>
      <p>
        Cross-component communication without prop drilling. Both components
        subscribe to the <code>"chat"</code> channel.
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
};

export default meta;

export const PubSubChat: StoryObj = {
  render: () => <ChannelDemo />,
};
