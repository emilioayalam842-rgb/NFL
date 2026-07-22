import { getScoreboard } from "@/lib/espn/queries";
import { toDisplayGame, type DisplayGame } from "@/lib/espn/format";
import { DEMO_GAMES, demoGameToDisplay } from "@/lib/demo-data";
import { GameCard } from "@/components/game-card";
import { LiveRefresher } from "@/components/live-refresher";

export const metadata = { title: "Calendario — Zona Roja" };

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const selectedWeek = Number(week) || undefined;

  const data = await getScoreboard({ week: selectedWeek });
  let games: DisplayGame[];
  let live = true;

  if (data?.events?.length) {
    games = data.events.map(toDisplayGame).filter((g): g is DisplayGame => g !== null);
  } else {
    live = false;
    games = DEMO_GAMES.filter((g) => !selectedWeek || g.week === selectedWeek).map(demoGameToDisplay);
  }

  const hasLiveGame = games.some((g) => g.status === "IN_PROGRESS");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {hasLiveGame && <LiveRefresher intervalSeconds={20} />}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl">Calendario</h1>
        <form className="flex items-center gap-2">
          <label htmlFor="week" className="font-display text-sm text-ink/60 tracking-wide">
            SEMANA
          </label>
          <select
            id="week"
            name="week"
            defaultValue={selectedWeek ?? ""}
            className="border border-ink/20 bg-chalk px-3 py-1.5 font-display"
          >
            <option value="">Actual</option>
            {WEEKS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <button className="bg-navy text-chalk px-4 py-1.5 font-display tracking-wide">Ver</button>
        </form>
      </div>

      {!live && (
        <p className="text-xs text-ink/50 mb-6">datos de muestra — sin conexión a ESPN en este entorno</p>
      )}

      {games.length === 0 ? (
        <p className="text-ink/60">No hay juegos para esa semana.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
