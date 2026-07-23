"use client";

import { useState } from "react";
import { categoryLabel, type PlayerLeaderRow } from "@/lib/espn/boxscore-format";

export function TeamPlayerStats({
  homeAbbr,
  awayAbbr,
  leaders,
}: {
  homeAbbr: string;
  awayAbbr: string;
  leaders: PlayerLeaderRow[];
}) {
  const [side, setSide] = useState<"home" | "away">("away");

  const categories = leaders.filter((cat) => cat[side].length > 0);

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(["away", "home"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`px-4 py-1.5 text-sm font-display tracking-wide transition-colors ${
              side === s ? "bg-navy text-chalk" : "bg-surface-alt text-fg/60 hover:text-fg"
            }`}
          >
            {s === "away" ? awayAbbr : homeAbbr}
          </button>
        ))}
      </div>

      {categories.length === 0 ? (
        <p className="text-fg/60 text-sm">Sin estadísticas de jugadores para este equipo todavía.</p>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.category}>
              <p className="font-display text-sm tracking-wide text-red mb-3">
                {categoryLabel(cat.category).toUpperCase()}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-fg/50 text-xs">
                      <th className="text-left font-normal pb-2 pr-4">Jugador</th>
                      {cat.labels.map((l) => (
                        <th key={l} className="text-right font-normal pb-2 px-2 whitespace-nowrap">
                          {l}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cat[side].map((r) => (
                      <tr key={r.name} className="border-t border-fg/10">
                        <td className="py-2 pr-4 whitespace-nowrap">
                          <p className="font-semibold">{r.name}</p>
                          {r.position && <p className="text-xs text-fg/50">{r.position}</p>}
                        </td>
                        {r.stats.map((s, i) => (
                          <td key={i} className="text-right stat-num px-2">
                            {s}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
