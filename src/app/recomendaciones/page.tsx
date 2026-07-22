import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEMO_RECOMMENDATIONS } from "@/lib/demo-data";
import { RECOMMENDATION_TYPE_LABEL } from "@/lib/recommendations/labels";

export const metadata = { title: "Picks — Zona Roja" };

export default async function RecomendacionesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const activeSub = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE", endDate: { gt: new Date() } },
  });

  const dbRecs = await prisma.recommendation.findMany({
    where: { published: true },
    include: { game: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { game: { startTime: "asc" } },
    take: 30,
  });

  const hasAccess = Boolean(activeSub);

  const recs =
    dbRecs.length > 0
      ? dbRecs.map((r) => ({
          gameLabel: `${r.game.awayTeam.abbreviation} @ ${r.game.homeTeam.abbreviation}`,
          type: r.type,
          pick: r.pick,
          confidence: r.confidence,
          rationale: r.rationale,
        }))
      : DEMO_RECOMMENDATIONS.map((r) => ({
          gameLabel: r.gameId,
          type: r.type,
          pick: r.pick,
          confidence: r.confidence,
          rationale: r.rationale,
        }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl mb-2">Picks de la semana</h1>
      <p className="text-ink/60 mb-8 max-w-2xl">
        Spread, moneyline, over/under y props de jugador — generados con un modelo estadístico a
        partir de forma reciente de equipos y jugadores. Análisis informativo, no garantía de
        resultado.
      </p>

      {!hasAccess && (
        <div className="bg-navy text-chalk p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md">
            Necesitas una suscripción activa para ver los picks completos con confianza y
            justificación.
          </p>
          <Link href="/planes" className="bg-red px-5 py-2.5 font-display tracking-wide hover:bg-red-dark transition-colors">
            Ver planes
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recs.map((r, i) => (
          <div key={i} className="border border-ink/10 bg-chalk p-5 relative overflow-hidden">
            <span className="text-[11px] font-display tracking-widest text-red">
              {RECOMMENDATION_TYPE_LABEL[r.type]}
            </span>
            <p className="text-xs text-ink/50 mb-1">{r.gameLabel}</p>
            <p className={`font-display text-xl mt-1 mb-2 ${!hasAccess ? "blur-sm select-none" : ""}`}>
              {r.pick}
            </p>
            <div className="h-1.5 bg-ink/10 mb-2">
              <div className="h-full bg-red" style={{ width: `${r.confidence * 100}%` }} />
            </div>
            <p className={`text-sm text-ink/70 ${!hasAccess ? "blur-sm select-none" : ""}`}>
              {r.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
