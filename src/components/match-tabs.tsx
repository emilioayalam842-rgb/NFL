"use client";

import { useState, type ReactNode } from "react";

export function MatchTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="flex gap-6 border-b border-fg/10 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`whitespace-nowrap pb-3 font-display text-sm tracking-wide transition-colors ${
              active === tab.id ? "text-red border-b-2 border-red" : "text-fg/50 hover:text-fg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.find((t) => t.id === active)?.content}
    </div>
  );
}
