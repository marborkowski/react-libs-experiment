import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useLens } from "../hooks/useLens";

interface UserProfile {
  name: string;
  profile: {
    address: {
      city: string;
      zip: string;
    };
    bio: string;
  };
  settings: {
    theme: string;
  };
}

const initialUser: UserProfile = {
  name: "Alice",
  profile: {
    address: { city: "San Francisco", zip: "94102" },
    bio: "Full-stack developer",
  },
  settings: { theme: "dark" },
};

function CityEditor({
  user,
  setUser,
}: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}) {
  const [city, setCity] = useLens(user, setUser, "profile.address.city");
  return (
    <label>
      City: <input value={city} onChange={(e) => setCity(e.target.value)} />
    </label>
  );
}

function ZipEditor({
  user,
  setUser,
}: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}) {
  const [zip, setZip] = useLens(user, setUser, "profile.address.zip");
  return (
    <label>
      ZIP: <input value={zip} onChange={(e) => setZip(e.target.value)} />
    </label>
  );
}

function BioEditor({
  user,
  setUser,
}: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}) {
  const [bio, setBio] = useLens(user, setUser, "profile.bio");
  return (
    <label>
      Bio: <input value={bio} onChange={(e) => setBio(e.target.value)} />
    </label>
  );
}

function ThemeEditor({
  user,
  setUser,
}: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}) {
  const [theme, setTheme] = useLens(user, setUser, "settings.theme");
  return (
    <label>
      Theme:{" "}
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}

function LensDemo() {
  const [user, setUser] = useState<UserProfile>(initialUser);

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p>
        Each editor focuses on a specific path in state and updates it
        immutably. Siblings at other paths are preserved automatically.
      </p>
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}
      >
        <label>
          Name:{" "}
          <input
            value={user.name}
            onChange={(e) => setUser((u) => ({ ...u, name: e.target.value }))}
          />
        </label>
        <CityEditor user={user} setUser={setUser} />
        <ZipEditor user={user} setUser={setUser} />
        <BioEditor user={user} setUser={setUser} />
        <ThemeEditor user={user} setUser={setUser} />
      </div>
      <pre
        style={{
          background: "#f5f5f5",
          padding: 8,
          borderRadius: 4,
          marginTop: 12,
        }}
      >
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}

const meta: Meta = {
  title: "Reactive & State/useLens",
  parameters: {
    docs: {
      description: {
        component: [
          "## `useLens<T, P>(state, setState, path): [value, setValue]`",
          "",
          "**Optic-inspired** hook that focuses on a nested path inside a parent state object, ",
          "providing a local `[value, setValue]` pair that immutably updates the entire root.",
          "",
          "### How it works internally",
          "1. Takes a dot-notation `path` like `'profile.address.city'`.",
          "2. `value` is read by traversing the path on the parent state (using `getByPath` utility).",
          "3. `setValue` immutably reconstructs the full parent object with the updated leaf (using `setByPath` utility).",
          "4. The parent `setState` is called with the reconstructed object — **all siblings are preserved**.",
          "5. Supports functional updates: `setValue(prev => prev.toUpperCase())`.",
          "",
          "### API",
          "| Param | Type | Description |",
          "|---|---|---|",
          "| `state` | `T` | Parent state object |",
          "| `setState` | `SetState<T>` | Parent setState (from `useState` or similar) |",
          "| `path` | `P` | Dot-notation string path (e.g. `'a.b.c'`), fully type-safe |",
          "",
          "**Returns** `[value, setValue]` where:",
          "- `value` is the value at the given path (`PathValue<T, P>`)",
          "- `setValue` accepts direct values or `(prev) => next` functional updates",
          "",
          "```tsx",
          "const [user, setUser] = useState({",
          "  profile: { address: { city: 'NYC', zip: '10001' } }",
          "});",
          "",
          "// Focus on city — type-safe path",
          "const [city, setCity] = useLens(user, setUser, 'profile.address.city');",
          "// city: string (inferred!)",
          "",
          "setCity('San Francisco');           // immutably updates root",
          "setCity(prev => prev.toUpperCase()); // functional update",
          "```",
          "",
          "### When to use",
          "- Complex forms with deeply nested state passed to child components",
          "- Avoiding prop-drilling of individual setters for each nested field",
          "- Each child component focuses on its own data slice without knowing the full shape",
        ].join("\n"),
      },
    },
  },
};

export default meta;

export const NestedFormEditor: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          "Each field (`CityEditor`, `ZipEditor`, `BioEditor`, `ThemeEditor`) receives the full `user` state but uses `useLens` to read/write only its specific path. Editing city does not affect zip, bio, or theme — `setByPath` preserves all siblings. Watch the JSON preview to see immutable updates in action.",
      },
      source: {
        code: `// Parent owns the full state
const [user, setUser] = useState<UserProfile>(initialUser);

// Each child focuses on a single dot-notation path
function CityEditor({ user, setUser }) {
  const [city, setCity] = useLens(user, setUser, "profile.address.city");
  return <input value={city} onChange={(e) => setCity(e.target.value)} />;
}

function ZipEditor({ user, setUser }) {
  const [zip, setZip] = useLens(user, setUser, "profile.address.zip");
  return <input value={zip} onChange={(e) => setZip(e.target.value)} />;
}

function ThemeEditor({ user, setUser }) {
  const [theme, setTheme] = useLens(user, setUser, "settings.theme");
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
  );
}

// All children compose in the parent
<CityEditor user={user} setUser={setUser} />
<ZipEditor user={user} setUser={setUser} />
<ThemeEditor user={user} setUser={setUser} />`,
      },
    },
  },
  render: () => <LensDemo />,
};
