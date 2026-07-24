import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Jugador — Zona Roja" };

const STAT_COLUMNS_BY_POSITION: Record<
  string,
  { key: "passingYards" | "passingTDs" | "interceptions" | "rushingYards" | "rushingTDs" | "receptions" | "receivingYards" | "receivingTDs" | "tackles" | "sacks"; label: string }[]
> = {
  QB: [
    { key: "passingYards", label: "Yds pase" },
    { key: "passingTDs", label: "TD pase" },
    { key: "interceptions", label: "INT" },
    { key: "rushingYards", label: "Yds tierra" },
  ],
  RB: [
    { key: "rushingYards", label: "Yds tierra" },
    { key: "rushingTDs", label: "TD tierra" },
    { key: "receptions", label: "Rec" },
    { key: "receivingYards", label: "Yds recep" },
  ],
  WR: [
    { key: "receptions", label: "Rec" },
    { key: "receivingYards", label: "Yds recep" },
    { key: "receivingTDs", label: "TD recep" },
  ],
  TE: [
    { key: "receptions", label: "Rec" },
    { key: "receivingYards", label: "Yds recep" },
    { key: "receivingTDs", label: "TD recep" },
  ],
};

const DEFAULT_COLUMNS: (typeof STAT_COLUMNS_BY_POSITION)["QB"] = [
  { key: "tackles", label: "Tacleadas" },
  { key: "sacks", label: "Capturas" },
];

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      team: true,
      stats: {
        include: { game: { include: { homeTeam: true, awayTeam: true } } },
        orderBy: { game: { startTime: "desc" } },
      },
    },
  });
  if (!player) notFound();

  const columns = STAT_COLUMNS_BY_POSITION[player.position] ?? DEFAULT_COLUMNS;
  const finishedGames = player.stats.filter((s) => s.game.status === "FINAL");

  const averages = columns.map((col) => {
    const values = finishedGames.map((s) => s[col.key]).filter((v): v is number => v != null);
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return { ...col, avg };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="bg-navy text-chalk p-6 mb-8">
        <p className="text-xs font-display tracking-widest text-chalk/60">{player.position}</p>
        <h1 className="text-3xl font-display mb-1">{player.name}</h1>
        {player.team && (
          <Link href={`/equipo/${player.team.id}`} className="text-sm text-chalk/70 hover:text-red transition-colors">
            {player.team.city} {player.team.name}
          </Link>
        )}
      </div>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-4">Promedios de temporada ({finishedGames.length} juegos)</h2>
        {finishedGames.length === 0 ? (
          <p className="text-fg/60">Sin juegos terminados con estadísticas todavía.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {averages.map((a) => (
              <div key={a.key} className="border border-fg/10 bg-surface p-4">
                <p className="stat-num text-3xl font-semibold">{a.avg != null ? a.avg.toFixed(1) : "—"}</p>
                <p className="text-xs text-fg/50 mt-1">{a.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl mb-4">Bitácora de juegos</h2>
        {player.stats.length === 0 ? (
          <p className="text-fg/60">Sin juegos registrados todavía para este jugador.</p>
        ) : (
          <div className="overflow-x-auto border border-fg/10">
            <table className="w-full text-sm">
              <thead className="bg-navy text-chalk font-display tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Sem</th>
                  <th className="text-left px-4 py-3">Rival</th>
                  {columns.map((c) => (
                    <th key={c.key} className="text-right px-4 py-3">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {player.stats.map((s, i) => {
                  const isHome = player.team && s.game.homeTeamId === player.team.id;
                  const opponent = isHome ? s.game.awayTeam : s.game.homeTeam;
                  return (
                    <tr key={s.id} className={i % 2 ? "bg-surface" : "bg-surface-alt"}>
                      <td className="px-4 py-2 stat-num">{s.game.week}</td>
                      <td className="px-4 py-2">
                        <Link href={`/partido/${s.game.espnId}`} className="hover:text-red transition-colors">
                          {isHome ? "vs" : "@"} {opponent.abbreviation}
                        </Link>
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} className="text-right px-4 py-2 stat-num">
                          {s[c.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
