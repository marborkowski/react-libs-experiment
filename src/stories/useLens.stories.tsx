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

function CityEditor({ user, setUser }: { user: UserProfile; setUser: React.Dispatch<React.SetStateAction<UserProfile>> }) {
  const [city, setCity] = useLens(user, setUser, "profile.address.city");
  return (
    <label>
      City: <input value={city} onChange={(e) => setCity(e.target.value)} />
    </label>
  );
}

function BioEditor({ user, setUser }: { user: UserProfile; setUser: React.Dispatch<React.SetStateAction<UserProfile>> }) {
  const [bio, setBio] = useLens(user, setUser, "profile.bio");
  return (
    <label>
      Bio: <input value={bio} onChange={(e) => setBio(e.target.value)} />
    </label>
  );
}

function LensDemo() {
  const [user, setUser] = useState<UserProfile>(initialUser);

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>useLens — Focus on Nested State</h3>
      <p>
        Each editor focuses on a specific path in state and updates it
        immutably.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
        <label>
          Name:{" "}
          <input
            value={user.name}
            onChange={(e) => setUser((u) => ({ ...u, name: e.target.value }))}
          />
        </label>
        <CityEditor user={user} setUser={setUser} />
        <BioEditor user={user} setUser={setUser} />
      </div>
      <pre style={{ background: "#f5f5f5", padding: 8, borderRadius: 4, marginTop: 12 }}>
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}

const meta: Meta = {
  title: "Reactive & State/useLens",
};

export default meta;

export const NestedFormEditor: StoryObj = {
  render: () => <LensDemo />,
};
