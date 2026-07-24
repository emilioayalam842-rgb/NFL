"use client";

import { useEffect, useRef, useState } from "react";

/** Icon-triggered search box — keeps the header nav from having to make
 * permanent room for a full-width input alongside 7 nav links. */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 text-chalk hover:text-red transition-colors"
        aria-label="Buscar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label="Cerrar" />
          <form
            action="/buscar"
            className="absolute right-0 top-full mt-2 z-50 bg-surface border border-fg/10 shadow-lg p-2"
          >
            <input
              ref={inputRef}
              name="q"
              placeholder="Buscar equipo o jugador..."
              className="w-64 bg-surface text-fg text-sm px-3 py-2 border border-fg/20 outline-none focus:border-red"
            />
          </form>
        </>
      )}
    </div>
  );
}
