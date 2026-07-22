import { notFound } from "next/navigation";
import { getGameSummary } from "@/lib/espn/queries";
import { toDisplayGame } from "@/lib/espn/format";
import { toDisplayBoxscore, categoryLabel } from "@/lib/espn/boxscore-format";
import { LiveRefresher } from "@/components/live-refresher";

export const metadata = { title: "Partido — Zona Roja" };

export default async function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = await getGameSummary(id);

  if (!summary?.header?.competitions?.[0]) notFound();

  const event = {
    id,
    date: summary.header.competitions[0].date,
    name: "",
    shortName: "",
    competitions: summary.header.competitions,
  };
  const game = toDisplayGame(event);
  if (!game) notFound();

  const boxscore = toDisplayBoxscore(summary);
  const isLive = game.status === "IN_PROGRESS";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {isLive && <LiveRefresher intervalSeconds={20} />}

      <div className="bg-navy text-chalk p-6 mb-8">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-display tracking-widest text-chalk/60">
            {isLive ? "EN VIVO" : game.statusText}
          </span>
          {isLive && <span className="h-2 w-2 rounded-full bg-red animate-pulse" />}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="font-display text-2xl">{game.away.abbr}</p>
            <p className="text-sm text-chalk/60">{game.away.name}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl">{game.home.abbr}</p>
            <p className="text-sm text-chalk/60">{game.home.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <p className="stat-num text-4xl font-semibold">{game.away.score ?? "-"}</p>
          <p className="stat-num text-4xl font-semibold text-right">{game.home.score ?? "-"}</p>
        </div>
      </div>

      {!boxscore ? (
        <p className="text-fg/60">Sin estadísticas detalladas todavía para este partido.</p>
      ) : (
        <>
          {boxscore.teamStats.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl mb-4">Estadísticas de equipo</h2>
              <table className="w-full text-sm border border-fg/10">
                <thead className="bg-navy text-chalk font-display tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2">{game.away.abbr}</th>
                    <th className="text-center px-4 py-2"></th>
                    <th className="text-right px-4 py-2">{game.home.abbr}</th>
                  </tr>
                </thead>
                <tbody>
                  {boxscore.teamStats.map((row, i) => (
                    <tr key={row.label} className={i % 2 ? "bg-surface" : "bg-surface-alt"}>
                      <td className="px-4 py-2 stat-num">{row.away}</td>
                      <td className="px-4 py-2 text-center text-fg/50">{row.label}</td>
                      <td className="px-4 py-2 text-right stat-num">{row.home}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {boxscore.leaders.length > 0 && (
            <div>
              <h2 className="text-xl mb-4">Líderes del partido</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {boxscore.leaders.map((cat) => (
                  <div key={cat.category}>
                    <p className="font-display text-sm tracking-wide text-red mb-2">
                      {categoryLabel(cat.category).toUpperCase()}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-fg/50 mb-1">{game.away.abbr}</p>
                        {cat.away.map((p) => (
                          <p key={p.name}>
                            {p.name} <span className="text-fg/50">{p.stats[0]}</span>
                          </p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs text-fg/50 mb-1">{game.home.abbr}</p>
                        {cat.home.map((p) => (
                          <p key={p.name}>
                            {p.name} <span className="text-fg/50">{p.stats[0]}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
