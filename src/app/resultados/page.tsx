import { getScoreboard } from "@/lib/espn/queries";
import { toDisplayGame, type DisplayGame } from "@/lib/espn/format";
import { DEMO_GAMES, demoGameToDisplay } from "@/lib/demo-data";
import { GameCard } from "@/components/game-card";

export const metadata = { title: "Resultados — Zona Roja" };

export default async function ResultadosPage({
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
    games = DEMO_GAMES.map(demoGameToDisplay);
  }

  const finals = games.filter((g) => g.status === "FINAL");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl mb-2">Resultados</h1>
      {!live && (
        <p className="text-xs text-fg/50 mb-6">datos de muestra — sin conexión a ESPN en este entorno</p>
      )}

      {finals.length === 0 ? (
        <p className="text-fg/60 mt-6">Todavía no hay resultados finales esta semana.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {finals.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
