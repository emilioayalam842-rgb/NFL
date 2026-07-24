import { prisma } from "@/lib/prisma";
import {
  updateGameOdds,
  addPlayerProp,
  deletePlayerProp,
  addGameOddsQuote,
  deleteGameOddsQuote,
} from "../actions";
import { formatAmericanOdds } from "@/lib/odds-format";

export default async function AdminMomiosPage() {
  const games = await prisma.game.findMany({
    where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
    include: {
      homeTeam: true,
      awayTeam: true,
      playerProps: { orderBy: { createdAt: "desc" } },
      oddsQuotes: { orderBy: { capturedAt: "desc" } },
    },
    orderBy: { startTime: "asc" },
    take: 30,
  });

  return (
    <div>
      <div className="mb-6 max-w-2xl">
        <h2 className="text-xl mb-2">Momios</h2>
        <p className="text-sm text-fg/60">
          Captura a mano lo que veas en cualquier casa (PlayDoit, Caliente, etc.): línea de spread,
          total y los momios (precio americano, ej. -110) de cada mercado. Se guarda con fecha/hora
          y la fuente que anotes, para que tus suscriptores sepan de cuándo es.
        </p>
      </div>

      <div className="space-y-8">
        {games.map((g) => (
          <div key={g.id} className="border border-fg/10 bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="font-display text-lg">
                {g.awayTeam.abbreviation} @ {g.homeTeam.abbreviation}
              </p>
              <p className="text-xs text-fg/50">
                Semana {g.week} · {g.startTime.toLocaleString("es-MX")}
                {g.oddsUpdatedAt && (
                  <> · momios actualizados {g.oddsUpdatedAt.toLocaleString("es-MX")}</>
                )}
                {g.oddsSource && <> · fuente: {g.oddsSource}</>}
              </p>
            </div>

            <form
              action={async (formData) => {
                "use server";
                await updateGameOdds(g.id, formData);
              }}
              className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm mb-2"
            >
              <label className="flex flex-col gap-1">
                Línea spread ({g.homeTeam.abbreviation})
                <input name="marketSpread" type="number" step="0.5" defaultValue={g.marketSpread ?? ""} className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <label className="flex flex-col gap-1">
                Momio spread local
                <input name="spreadHomeOdds" type="number" step="1" defaultValue={g.spreadHomeOdds ?? ""} placeholder="-110" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <label className="flex flex-col gap-1">
                Momio spread visitante
                <input name="spreadAwayOdds" type="number" step="1" defaultValue={g.spreadAwayOdds ?? ""} placeholder="-110" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <div />

              <label className="flex flex-col gap-1">
                Línea total (O/U)
                <input name="marketTotal" type="number" step="0.5" defaultValue={g.marketTotal ?? ""} className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <label className="flex flex-col gap-1">
                Momio Over
                <input name="totalOverOdds" type="number" step="1" defaultValue={g.totalOverOdds ?? ""} placeholder="-110" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <label className="flex flex-col gap-1">
                Momio Under
                <input name="totalUnderOdds" type="number" step="1" defaultValue={g.totalUnderOdds ?? ""} placeholder="-110" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <div />

              <label className="flex flex-col gap-1">
                Moneyline local
                <input name="moneylineHomeOdds" type="number" step="1" defaultValue={g.moneylineHomeOdds ?? ""} placeholder="-150" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <label className="flex flex-col gap-1">
                Moneyline visitante
                <input name="moneylineAwayOdds" type="number" step="1" defaultValue={g.moneylineAwayOdds ?? ""} placeholder="+130" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <label className="flex flex-col gap-1">
                Fuente
                <input name="oddsSource" defaultValue={g.oddsSource ?? ""} placeholder="PlayDoit" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              </label>
              <button className="btn btn-dark btn-sm self-end">Guardar momios</button>
            </form>

            <div className="hash-divider my-4" />

            <p className="font-display text-sm tracking-wide mb-3">Props de jugador</p>
            {g.playerProps.length > 0 && (
              <ul className="space-y-1 mb-3 text-sm">
                {g.playerProps.map((p) => (
                  <li key={p.id} className="flex items-center justify-between border border-fg/10 px-3 py-2">
                    <span>
                      {p.playerName} — {p.statLabel} {p.line} (Over {formatAmericanOdds(p.overOdds)} / Under{" "}
                      {formatAmericanOdds(p.underOdds)})
                    </span>
                    <form action={async () => { "use server"; await deletePlayerProp(p.id); }}>
                      <button className="text-red text-xs">Eliminar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form
              action={async (formData) => {
                "use server";
                await addPlayerProp(g.id, formData);
              }}
              className="grid sm:grid-cols-6 gap-2 text-sm"
            >
              <input name="playerName" placeholder="Jugador" required className="border border-fg/20 px-2 py-1.5 bg-surface sm:col-span-2" />
              <input name="statLabel" placeholder="Estadística (ej. Yardas de pase)" required className="border border-fg/20 px-2 py-1.5 bg-surface sm:col-span-2" />
              <input name="line" type="number" step="0.5" placeholder="Línea" required className="border border-fg/20 px-2 py-1.5 bg-surface" />
              <div />
              <input name="overOdds" type="number" step="1" placeholder="Momio Over" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              <input name="underOdds" type="number" step="1" placeholder="Momio Under" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              <input name="oddsSource" placeholder="Fuente" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              <button className="btn btn-outline-dark btn-sm sm:col-span-3">Agregar prop</button>
            </form>

            <div className="hash-divider my-4" />

            <p className="font-display text-sm tracking-wide mb-3">Comparar con otras casas</p>
            {g.oddsQuotes.length > 0 && (
              <ul className="space-y-1 mb-3 text-sm">
                {g.oddsQuotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between border border-fg/10 px-3 py-2">
                    <span>
                      <span className="font-semibold">{q.source}</span> — spread {q.marketSpread ?? "—"}, total{" "}
                      {q.marketTotal ?? "—"}, ML {formatAmericanOdds(q.moneylineAwayOdds)}/
                      {formatAmericanOdds(q.moneylineHomeOdds)}
                    </span>
                    <form action={async () => { "use server"; await deleteGameOddsQuote(q.id); }}>
                      <button className="text-red text-xs">Eliminar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form
              action={async (formData) => {
                "use server";
                await addGameOddsQuote(g.id, formData);
              }}
              className="grid sm:grid-cols-6 gap-2 text-sm"
            >
              <input name="source" placeholder="Casa (ej. Caliente)" required className="border border-fg/20 px-2 py-1.5 bg-surface sm:col-span-2" />
              <input name="marketSpread" type="number" step="0.5" placeholder="Spread" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              <input name="marketTotal" type="number" step="0.5" placeholder="Total" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              <input name="moneylineAwayOdds" type="number" step="1" placeholder="ML visitante" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              <input name="moneylineHomeOdds" type="number" step="1" placeholder="ML local" className="border border-fg/20 px-2 py-1.5 bg-surface" />
              <button className="btn btn-outline-dark btn-sm sm:col-span-2">Agregar cotización</button>
            </form>
          </div>
        ))}
        {games.length === 0 && (
          <p className="text-fg/60">
            No hay juegos programados en la base de datos. Sincroniza el calendario primero en
            &ldquo;Juegos&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
