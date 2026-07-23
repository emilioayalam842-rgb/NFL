import Image from "next/image";
import { notFound } from "next/navigation";
import { getGameSummary } from "@/lib/espn/queries";
import { toDisplayGame } from "@/lib/espn/format";
import { toDisplayBoxscore, statSection, type TeamStatRow } from "@/lib/espn/boxscore-format";
import { formatAmericanOdds } from "@/lib/odds-format";
import { LiveRefresher } from "@/components/live-refresher";
import { MatchTabs } from "@/components/match-tabs";
import { TeamPlayerStats } from "@/components/team-player-stats";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Partido — Zona Roja" };

function StatBar({ row }: { row: TeamStatRow }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="stat-num font-semibold w-16">{row.away}</span>
        <span className="text-fg/50 text-xs text-center flex-1 px-2">{row.label}</span>
        <span className="stat-num font-semibold w-16 text-right">{row.home}</span>
      </div>
      <div className="flex h-1.5 gap-0.5 bg-surface-alt">
        <div className="flex justify-end" style={{ width: `${100 - row.homeShare}%` }}>
          <div className="h-full bg-red w-full" />
        </div>
        <div style={{ width: `${row.homeShare}%` }}>
          <div className="h-full bg-navy w-full" />
        </div>
      </div>
    </div>
  );
}

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

  const dbGame = await prisma.game.findUnique({
    where: { espnId: id },
    include: {
      homeTeam: true,
      awayTeam: true,
      playerProps: true,
      recommendations: { where: { published: true } },
    },
  });

  const oddsBadges: string[] = [];
  if (dbGame?.marketSpread != null) {
    oddsBadges.push(`${dbGame.homeTeam.abbreviation} ${dbGame.marketSpread > 0 ? "+" : ""}${dbGame.marketSpread}`);
  }
  if (dbGame?.marketTotal != null) oddsBadges.push(`O/U ${dbGame.marketTotal}`);
  if (dbGame?.moneylineHomeOdds != null && dbGame?.moneylineAwayOdds != null) {
    oddsBadges.push(
      `ML ${dbGame.awayTeam.abbreviation} ${formatAmericanOdds(dbGame.moneylineAwayOdds)} / ${dbGame.homeTeam.abbreviation} ${formatAmericanOdds(dbGame.moneylineHomeOdds)}`
    );
  }

  const resumenTab = (
    <div>
      {game.venue && <p className="text-sm text-fg/60 mb-4">{game.venue}</p>}

      {oddsBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {oddsBadges.map((b) => (
            <span key={b} className="bg-surface-alt border border-fg/10 text-xs font-display tracking-wide px-3 py-1.5">
              {b}
            </span>
          ))}
        </div>
      )}

      {dbGame && dbGame.recommendations.length > 0 && (
        <div>
          <p className="font-display text-sm tracking-wide text-red mb-3">PICKS DE ZONA ROJA</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {dbGame.recommendations.map((r) => (
              <div key={r.id} className="border border-fg/10 bg-surface p-4">
                <p className="font-display">{r.pick}</p>
                <p className="text-xs text-fg/60 mt-1">{r.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {dbGame && dbGame.playerProps.length > 0 && (
        <div className="mt-6">
          <p className="font-display text-sm tracking-wide text-red mb-3">PROPS DE JUGADOR</p>
          <ul className="space-y-1.5 text-sm">
            {dbGame.playerProps.map((p) => (
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

      {oddsBadges.length === 0 && !dbGame?.recommendations.length && !dbGame?.playerProps.length && (
        <p className="text-fg/60 text-sm">Sin momios ni picks capturados para este partido todavía.</p>
      )}
    </div>
  );

  const estadisticasTab = !boxscore || boxscore.teamStats.length === 0 ? (
    <p className="text-fg/60">Sin estadísticas de equipo todavía para este partido.</p>
  ) : (
    <div className="space-y-8">
      <div>
        <p className="font-display text-sm tracking-wide text-red mb-4">OFENSIVA</p>
        <div className="space-y-4">
          {boxscore.teamStats.filter((r) => statSection(r.name) === "ofensiva").map((row) => (
            <StatBar key={row.name} row={row} />
          ))}
        </div>
      </div>
      <div>
        <p className="font-display text-sm tracking-wide text-red mb-4">OTRAS</p>
        <div className="space-y-4">
          {boxscore.teamStats.filter((r) => statSection(r.name) === "otras").map((row) => (
            <StatBar key={row.name} row={row} />
          ))}
        </div>
      </div>
    </div>
  );

  const jugadoresTab = !boxscore || boxscore.leaders.length === 0 ? (
    <p className="text-fg/60">Sin estadísticas de jugadores todavía para este partido.</p>
  ) : (
    <TeamPlayerStats homeAbbr={game.home.abbr} awayAbbr={game.away.abbr} leaders={boxscore.leaders} />
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {isLive && <LiveRefresher intervalSeconds={1} />}

      <div className="bg-navy text-chalk p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-display tracking-widest text-chalk/60">
            {isLive ? "EN VIVO" : game.statusText}
          </span>
          {isLive && <span className="h-2 w-2 rounded-full bg-red animate-pulse" />}
        </div>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="flex items-center gap-3">
            {game.away.logo && <Image src={game.away.logo} alt="" width={40} height={40} unoptimized />}
            <div>
              <p className="font-display text-xl leading-none">{game.away.abbr}</p>
              <p className="text-xs text-chalk/60">{game.away.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end text-right">
            <div>
              <p className="font-display text-xl leading-none">{game.home.abbr}</p>
              <p className="text-xs text-chalk/60">{game.home.name}</p>
            </div>
            {game.home.logo && <Image src={game.home.logo} alt="" width={40} height={40} unoptimized />}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <p className="stat-num text-4xl font-semibold">{game.away.score ?? "-"}</p>
          <p className="stat-num text-4xl font-semibold text-right">{game.home.score ?? "-"}</p>
        </div>
      </div>

      <MatchTabs
        tabs={[
          { id: "resumen", label: "Resumen", content: resumenTab },
          { id: "estadisticas", label: "Estadísticas", content: estadisticasTab },
          { id: "jugadores", label: "Jugadores", content: jugadoresTab },
        ]}
      />
    </div>
  );
}
