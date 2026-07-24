import { prisma } from "@/lib/prisma";
import { formatAmericanOdds } from "@/lib/odds-format";
import { LiveRefresher } from "@/components/live-refresher";

export const metadata = { title: "Momios — Zona Roja" };

export default async function MomiosPage() {
  const games = await prisma.game.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      OR: [
        { marketSpread: { not: null } },
        { marketTotal: { not: null } },
        { moneylineHomeOdds: { not: null } },
        { playerProps: { some: {} } },
      ],
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      playerProps: true,
      oddsQuotes: { orderBy: { capturedAt: "desc" } },
    },
    orderBy: { startTime: "asc" },
    take: 30,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <LiveRefresher intervalSeconds={15} />

      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-3xl">Momios</h1>
        <span className="flex items-center gap-1.5 text-xs font-display tracking-wide text-fg/50">
          <span className="h-1.5 w-1.5 rounded-full bg-red animate-pulse" />
          EN VIVO
        </span>
      </div>
      <p className="text-fg/60 mb-8 max-w-2xl">
        Líneas y precios de casas de apuestas mexicanas, capturados y actualizados a mano por
        nuestro equipo, y refrescados en esta página automáticamente. Los momios pueden cambiar en
        la casa real antes de que apuestes — confírmalos ahí antes de tirar tu dinero.
      </p>

      {games.length === 0 ? (
        <p className="text-fg/60">Todavía no hay momios capturados para esta semana.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {games.map((g) => (
            <div key={g.id} className="border border-fg/10 bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-display text-xl">
                  {g.awayTeam.abbreviation} @ {g.homeTeam.abbreviation}
                </p>
                <p className="text-xs text-fg/50">
                  {g.startTime.toLocaleString("es-MX", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-left text-fg/50">
                    <th className="py-1 font-normal">Equipo</th>
                    <th className="py-1 font-normal text-right">Spread</th>
                    <th className="py-1 font-normal text-right">Total</th>
                    <th className="py-1 font-normal text-right">ML</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-fg/10">
                    <td className="py-2 font-semibold">{g.awayTeam.abbreviation}</td>
                    <td className="py-2 text-right stat-num">
                      {g.marketSpread != null ? `+${g.marketSpread}` : "—"} {formatAmericanOdds(g.spreadAwayOdds)}
                    </td>
                    <td className="py-2 text-right stat-num">
                      {g.marketTotal != null ? `O ${g.marketTotal}` : "—"} {formatAmericanOdds(g.totalOverOdds)}
                    </td>
                    <td className="py-2 text-right stat-num">{formatAmericanOdds(g.moneylineAwayOdds)}</td>
                  </tr>
                  <tr className="border-t border-fg/10">
                    <td className="py-2 font-semibold">{g.homeTeam.abbreviation}</td>
                    <td className="py-2 text-right stat-num">
                      {g.marketSpread != null ? `${-g.marketSpread}` : "—"} {formatAmericanOdds(g.spreadHomeOdds)}
                    </td>
                    <td className="py-2 text-right stat-num">
                      {g.marketTotal != null ? `U ${g.marketTotal}` : "—"} {formatAmericanOdds(g.totalUnderOdds)}
                    </td>
                    <td className="py-2 text-right stat-num">{formatAmericanOdds(g.moneylineHomeOdds)}</td>
                  </tr>
                </tbody>
              </table>

              {g.playerProps.length > 0 && (
                <div>
                  <p className="text-xs font-display tracking-wide text-fg/50 mb-2">PROPS DE JUGADOR</p>
                  <ul className="space-y-1 text-sm">
                    {g.playerProps.map((p) => (
                      <li key={p.id} className="flex justify-between border-t border-fg/10 py-1.5">
                        <span>
                          {p.playerName} · {p.statLabel} {p.line}
                        </span>
                        <span className="stat-num">
                          O {formatAmericanOdds(p.overOdds)} / U {formatAmericanOdds(p.underOdds)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {g.oddsSource && (
                <p className="text-xs text-fg/40 mt-3">
                  Fuente: {g.oddsSource}
                  {g.oddsUpdatedAt && ` · actualizado ${g.oddsUpdatedAt.toLocaleString("es-MX")}`}
                </p>
              )}

              {g.oddsQuotes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-fg/10">
                  <p className="text-xs font-display tracking-wide text-fg/50 mb-2">COMPARA OTRAS CASAS</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-fg/50">
                        <th className="py-1 font-normal">Casa</th>
                        <th className="py-1 font-normal text-right">Spread</th>
                        <th className="py-1 font-normal text-right">Total</th>
                        <th className="py-1 font-normal text-right">ML vis/local</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.oddsQuotes.map((q) => (
                        <tr key={q.id} className="border-t border-fg/10">
                          <td className="py-1.5 font-semibold">{q.source}</td>
                          <td className="py-1.5 text-right stat-num">{q.marketSpread ?? "—"}</td>
                          <td className="py-1.5 text-right stat-num">{q.marketTotal ?? "—"}</td>
                          <td className="py-1.5 text-right stat-num">
                            {formatAmericanOdds(q.moneylineAwayOdds)}/{formatAmericanOdds(q.moneylineHomeOdds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
