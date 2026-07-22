import { prisma } from "@/lib/prisma";
import { togglePublished } from "../actions";
import { RECOMMENDATION_TYPE_LABEL } from "@/lib/recommendations/labels";

export default async function AdminRecomendacionesPage() {
  const recs = await prisma.recommendation.findMany({
    include: { game: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h2 className="text-xl mb-6">Picks generados</h2>
      <div className="space-y-3">
        {recs.map((r) => (
          <div key={r.id} className="border border-ink/10 bg-chalk p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <span className="text-[11px] font-display tracking-widest text-red">
                {RECOMMENDATION_TYPE_LABEL[r.type]}
              </span>
              <p className="font-display">
                {r.pick} <span className="text-ink/40 text-sm">— {r.game.awayTeam.abbreviation} @ {r.game.homeTeam.abbreviation}</span>
              </p>
              <p className="text-xs text-ink/50">
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
          <p className="text-ink/60">
            No hay picks generados. Ve a &ldquo;Juegos&rdquo; y usa &ldquo;Generar picks&rdquo; en un juego.
          </p>
        )}
      </div>
    </div>
  );
}
