import { prisma } from "@/lib/prisma";
import { syncTeamsAction, syncScoreboardAction, updateGameLines, generateRecsAction } from "../actions";

export default async function AdminJuegosPage() {
  const games = await prisma.game.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { startTime: "desc" },
    take: 30,
  });
  const teamCount = await prisma.team.count();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <form action={async () => { "use server"; await syncTeamsAction(); }}>
          <button className="bg-navy text-chalk px-4 py-2 text-sm font-display tracking-wide">
            Sincronizar equipos ({teamCount} en BD)
          </button>
        </form>
        <form action={async () => { "use server"; await syncScoreboardAction(); }}>
          <button className="bg-navy text-chalk px-4 py-2 text-sm font-display tracking-wide">
            Sincronizar calendario (semana actual)
          </button>
        </form>
        <p className="text-xs text-fg/50 max-w-md">
          Trae datos de ESPN. Requiere que el entorno donde corre la app tenga salida a internet
          (no siempre disponible en sandboxes de desarrollo).
        </p>
      </div>

      <h2 className="text-xl mb-4">Juegos ({games.length})</h2>
      <div className="space-y-3">
        {games.map((g) => (
          <div key={g.id} className="border border-fg/10 bg-surface p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[160px]">
              <p className="font-display">
                {g.awayTeam.abbreviation} @ {g.homeTeam.abbreviation}
              </p>
              <p className="text-xs text-fg/50">
                Semana {g.week} · {g.status} · {g.startTime.toLocaleDateString("es-MX")}
              </p>
            </div>

            <form
              action={async (formData) => {
                "use server";
                const spread = formData.get("spread");
                const total = formData.get("total");
                await updateGameLines(
                  g.id,
                  spread ? Number(spread) : null,
                  total ? Number(total) : null
                );
              }}
              className="flex items-center gap-2 text-sm"
            >
              <input
                name="spread"
                type="number"
                step="0.5"
                defaultValue={g.marketSpread ?? ""}
                placeholder="Spread"
                className="w-24 border border-fg/20 px-2 py-1 bg-surface"
              />
              <input
                name="total"
                type="number"
                step="0.5"
                defaultValue={g.marketTotal ?? ""}
                placeholder="Total"
                className="w-24 border border-fg/20 px-2 py-1 bg-surface"
              />
              <button className="border border-fg/20 px-3 py-1.5 hover:border-navy">Guardar líneas</button>
            </form>

            <form action={async () => { "use server"; await generateRecsAction(g.id); }}>
              <button className="bg-red text-chalk px-3 py-1.5 text-sm font-display tracking-wide">
                Generar picks
              </button>
            </form>
          </div>
        ))}
        {games.length === 0 && (
          <p className="text-fg/60">
            No hay juegos en la base de datos. Sincroniza equipos y calendario primero.
          </p>
        )}
      </div>
    </div>
  );
}
