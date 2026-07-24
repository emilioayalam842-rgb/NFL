"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Reading client-only theme state (set by the blocking init script) on
    // mount; rendering a neutral placeholder until then avoids a hydration
    // mismatch, which is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (!mounted) return <span className="inline-block h-5 w-5 p-1.5" aria-hidden />;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
      className="text-chalk/70 hover:text-chalk transition-colors p-1.5"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 4a1 1 0 011 1v1a1 1 0 11-2 0V5a1 1 0 011-1zm0 14a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm8-6a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM6 12a1 1 0 01-1 1H4a1 1 0 110-2h1a1 1 0 011 1zm11.31-5.31a1 1 0 010 1.41l-.7.7a1 1 0 11-1.42-1.41l.71-.7a1 1 0 011.41 0zM7.1 16.9a1 1 0 010 1.41l-.71.7a1 1 0 01-1.41-1.41l.7-.7a1 1 0 011.42 0zm10.21 1.41a1 1 0 01-1.41 0l-.71-.7a1 1 0 111.42-1.42l.7.71a1 1 0 010 1.41zM7.1 7.1a1 1 0 01-1.42 0l-.7-.71a1 1 0 011.41-1.41l.71.7a1 1 0 010 1.42zM12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}
