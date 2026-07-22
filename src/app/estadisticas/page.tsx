import { prisma } from "@/lib/prisma";
import { DEMO_PLAYER_STATS } from "@/lib/demo-data";

export const metadata = { title: "Estadísticas — Zona Roja" };

const STAT_COLUMNS = [
  { key: "passingYards", label: "Yds pase" },
  { key: "rushingYards", label: "Yds tierra" },
  { key: "receivingYards", label: "Yds recepción" },
  { key: "receptions", label: "Recepciones" },
  { key: "tackles", label: "Tacleadas" },
] as const;

export default async function EstadisticasPage() {
  const dbStats = await prisma.playerGameStat.findMany({
    include: { player: { include: { team: true } }, game: true },
    orderBy: { game: { startTime: "desc" } },
    take: 50,
  });

  const rows =
    dbStats.length > 0
      ? dbStats.map((s) => ({
          player: s.player.name,
          team: s.player.team?.abbreviation ?? "—",
          position: s.player.position,
          week: s.game.week,
          passingYards: s.passingYards ?? undefined,
          rushingYards: s.rushingYards ?? undefined,
          receivingYards: s.receivingYards ?? undefined,
          receptions: s.receptions ?? undefined,
          tackles: s.tackles ?? undefined,
        }))
      : DEMO_PLAYER_STATS;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl mb-2">Estadísticas de jugadores</h1>
      {dbStats.length === 0 && (
        <p className="text-xs text-ink/50 mb-6">
          datos de muestra — sincroniza el calendario desde el panel admin para ver datos reales
        </p>
      )}

      <div className="overflow-x-auto border border-ink/10">
        <table className="w-full text-sm">
          <thead className="bg-navy text-chalk font-display tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Jugador</th>
              <th className="text-left px-4 py-3">Equipo</th>
              <th className="text-left px-4 py-3">Pos</th>
              <th className="text-left px-4 py-3">Sem</th>
              {STAT_COLUMNS.map((c) => (
                <th key={c.key} className="text-right px-4 py-3">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-chalk" : "bg-cream-dim"}>
                <td className="px-4 py-2 font-semibold">{r.player}</td>
                <td className="px-4 py-2">{r.team}</td>
                <td className="px-4 py-2">{r.position}</td>
                <td className="px-4 py-2 stat-num">{r.week}</td>
                {STAT_COLUMNS.map((c) => (
                  <td key={c.key} className="px-4 py-2 text-right stat-num">
                    {(r as unknown as Record<string, number | undefined>)[c.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
