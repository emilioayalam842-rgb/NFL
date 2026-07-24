import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Líderes — Zona Roja" };

interface LeaderRow {
  playerId: string;
  playerName: string;
  teamAbbr: string;
  teamId?: string;
  value: number;
  games: number;
}

const CATEGORIES = [
  { key: "passingYards" as const, label: "Yardas de pase" },
  { key: "rushingYards" as const, label: "Yardas por tierra" },
  { key: "receivingYards" as const, label: "Yardas de recepción" },
  { key: "passingTDs" as const, label: "Touchdowns de pase" },
  { key: "rushingTDs" as const, label: "Touchdowns por tierra" },
  { key: "receivingTDs" as const, label: "Touchdowns de recepción" },
  { key: "tackles" as const, label: "Tacleadas" },
  { key: "sacks" as const, label: "Capturas" },
];

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

export default async function LideresPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const selectedWeek = Number(week) || undefined;

  const stats = await prisma.playerGameStat.findMany({
    where: {
      game: {
        status: "FINAL",
        ...(selectedWeek ? { week: selectedWeek } : {}),
      },
    },
    include: { player: { include: { team: true } } },
  });

  const leaderboards = CATEGORIES.map((cat) => {
    const byPlayer = new Map<string, LeaderRow>();
    for (const s of stats) {
      const value = s[cat.key];
      if (value == null) continue;
      const existing = byPlayer.get(s.playerId);
      if (existing) {
        existing.value += value;
        existing.games += 1;
      } else {
        byPlayer.set(s.playerId, {
          playerId: s.playerId,
          playerName: s.player.name,
          teamAbbr: s.player.team?.abbreviation ?? "—",
          teamId: s.player.team?.id,
          value,
          games: 1,
        });
      }
    }
    const rows = [...byPlayer.values()].sort((a, b) => b.value - a.value).slice(0, 10);
    return { ...cat, rows };
  }).filter((cat) => cat.rows.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl mb-2">Líderes de la liga</h1>
          <p className="text-fg/60 max-w-2xl">
            Top 10 acumulado {selectedWeek ? `de la semana ${selectedWeek}` : "de temporada"}, con base
            en las estadísticas importadas de cada juego finalizado.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <label htmlFor="week" className="font-display text-sm text-fg/60 tracking-wide">
            SEMANA
          </label>
          <select
            id="week"
            name="week"
            defaultValue={selectedWeek ?? ""}
            className="border border-fg/20 bg-surface px-3 py-1.5 font-display"
          >
            <option value="">Temporada</option>
            {WEEKS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <button className="bg-navy text-chalk px-4 py-1.5 font-display tracking-wide">Ver</button>
        </form>
      </div>

      {leaderboards.length === 0 ? (
        <p className="text-fg/60">
          Sin estadísticas de jugadores todavía. Importa stats desde el panel admin (Juegos).
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leaderboards.map((cat) => (
            <div key={cat.key} className="border border-fg/10 bg-surface p-5">
              <p className="font-display text-sm tracking-wide text-red mb-3">{cat.label.toUpperCase()}</p>
              <ol className="space-y-1.5 text-sm">
                {cat.rows.map((r, i) => (
                  <li key={r.playerId} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-fg/40 w-4 shrink-0">{i + 1}</span>
                      <Link href={`/jugador/${r.playerId}`} className="font-semibold truncate hover:text-red transition-colors">
                        {r.playerName}
                      </Link>
                      {r.teamId && (
                        <Link href={`/equipo/${r.teamId}`} className="text-xs text-fg/50 shrink-0 hover:text-red transition-colors">
                          {r.teamAbbr}
                        </Link>
                      )}
                    </span>
                    <span className="stat-num font-semibold shrink-0">{r.value}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
