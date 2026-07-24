import { prisma } from "@/lib/prisma";
import { togglePublished, generateRecsForWeekAction } from "../actions";
import { RECOMMENDATION_TYPE_LABEL } from "@/lib/recommendations/labels";

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

export default async function AdminRecomendacionesPage() {
  const recs = await prisma.recommendation.findMany({
    include: { game: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <form
        action={async (formData) => {
          "use server";
          await generateRecsForWeekAction(Number(formData.get("week")));
        }}
        className="flex flex-wrap items-center gap-2 mb-6"
      >
        <label htmlFor="week" className="font-display text-sm text-fg/60 tracking-wide">
          GENERAR PICKS DE TODA LA SEMANA
        </label>
        <select id="week" name="week" defaultValue="1" className="border border-fg/20 bg-surface px-3 py-1.5 font-display">
          {WEEKS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <button className="bg-red text-chalk px-4 py-1.5 text-sm font-display tracking-wide">Generar</button>
        <p className="text-xs text-fg/50 w-full sm:w-auto">
          Solo genera para juegos de esa semana que todavía no tengan picks.
        </p>
      </form>

      <h2 className="text-xl mb-6">Picks generados</h2>
      <div className="space-y-3">
        {recs.map((r) => (
          <div key={r.id} className="border border-fg/10 bg-surface p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <span className="text-[11px] font-display tracking-widest text-red">
                {RECOMMENDATION_TYPE_LABEL[r.type]}
              </span>
              <p className="font-display">
                {r.pick} <span className="text-fg/40 text-sm">— {r.game.awayTeam.abbreviation} @ {r.game.homeTeam.abbreviation}</span>
              </p>
              <p className="text-xs text-fg/50">
                Confianza {(r.confidence * 100).toFixed(0)}% · {r.rationale}
              </p>
            </div>
            <form action={async () => { "use server"; await togglePublished(r.id); }}>
              <button
                className={`px-3 py-1.5 text-sm font-display tracking-wide ${
                  r.published ? "bg-ink text-chalk" : "bg-navy text-chalk"
                }`}
              >
                {r.published ? "Despublicar" : "Publicar"}
              </button>
            </form>
          </div>
        ))}
        {recs.length === 0 && (
          <p className="text-fg/60">
            No hay picks generados. Ve a &ldquo;Juegos&rdquo; y usa &ldquo;Generar picks&rdquo; en un juego.
          </p>
        )}
      </div>
    </div>
  );
}
