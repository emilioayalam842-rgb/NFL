import Link from "next/link";
import { getScoreboard } from "@/lib/espn/queries";
import { toDisplayGame, type DisplayGame } from "@/lib/espn/format";
import { DEMO_GAMES, DEMO_RECOMMENDATIONS, demoGameToDisplay } from "@/lib/demo-data";
import { GameCard } from "@/components/game-card";
import { RECOMMENDATION_TYPE_LABEL } from "@/lib/recommendations/labels";

async function getThisWeek(): Promise<{ games: DisplayGame[]; live: boolean }> {
  const data = await getScoreboard();
  if (data?.events?.length) {
    const games = data.events.map(toDisplayGame).filter((g): g is DisplayGame => g !== null);
    return { games, live: true };
  }
  return { games: DEMO_GAMES.map(demoGameToDisplay), live: false };
}

export default async function Home() {
  const { games, live } = await getThisWeek();

  return (
    <div>
      <section className="bg-navy text-chalk relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "repeating-linear-gradient(90deg, white 0 2px, transparent 2px 120px)",
        }} />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 relative">
          <p className="font-display tracking-[0.3em] text-red text-sm mb-4">TEMPORADA REGULAR</p>
          <h1 className="font-display text-5xl sm:text-7xl leading-[0.95] mb-6 max-w-2xl">
            Picks con datos,
            <br />
            no con corazonadas.
          </h1>
          <p className="max-w-lg text-chalk/80 mb-8 text-lg">
            Estadísticas de jugadores, resultados, calendario completo y recomendaciones de apuesta
            (spread, moneyline, over/under y props) generadas con un modelo estadístico — semana
            tras semana de la NFL.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/planes" className="bg-red px-6 py-3 font-display tracking-wide hover:bg-red-dark transition-colors">
              Ver planes
            </Link>
            <Link href="/calendario" className="border border-chalk/40 px-6 py-3 font-display tracking-wide hover:border-red hover:text-red transition-colors">
              Calendario completo
            </Link>
          </div>
        </div>
      </section>

      <div className="hash-divider" />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl">Esta semana</h2>
          {!live && (
            <span className="text-xs text-ink/50">
              (datos de muestra — sin conexión a ESPN en este entorno)
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.slice(0, 6).map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>

      <div className="hash-divider" />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl mb-6">Picks destacados</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {DEMO_RECOMMENDATIONS.map((r, i) => (
            <div key={i} className="border border-ink/10 bg-chalk p-5">
              <span className="text-[11px] font-display tracking-widest text-red">
                {RECOMMENDATION_TYPE_LABEL[r.type]}
              </span>
              <p className="font-display text-xl mt-1 mb-2">{r.pick}</p>
              <div className="h-1.5 bg-ink/10 mb-2">
                <div className="h-full bg-red" style={{ width: `${r.confidence * 100}%` }} />
              </div>
              <p className="text-sm text-ink/70">{r.rationale}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink/50 mt-6 max-w-2xl">
          Los picks completos y actualizados cada semana son para suscriptores. Esto es un análisis
          estadístico informativo, no una garantía de resultado — apostar implica riesgo real de
          perder dinero.
        </p>
        <Link href="/planes" className="inline-block mt-4 bg-navy text-chalk px-6 py-3 font-display tracking-wide hover:bg-navy-dark transition-colors">
          Quiero ver todos los picks
        </Link>
      </section>
    </div>
  );
}
