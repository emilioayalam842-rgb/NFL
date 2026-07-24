import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEMO_RECOMMENDATIONS } from "@/lib/demo-data";
import { RECOMMENDATION_TYPE_LABEL } from "@/lib/recommendations/labels";
import { gradeRecommendation, type GradeResult } from "@/lib/recommendations/grade";
import { toggleSavedPick } from "./actions";

export const metadata = { title: "Picks — Zona Roja" };

const GRADE_LABEL: Record<NonNullable<GradeResult>, string> = {
  WON: "ACERTÓ",
  LOST: "FALLÓ",
  PUSH: "EMPATE",
};

const GRADE_CLASS: Record<NonNullable<GradeResult>, string> = {
  WON: "bg-red text-chalk",
  LOST: "bg-fg/20 text-fg",
  PUSH: "bg-surface-alt text-fg/70",
};

export default async function RecomendacionesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const activeSub = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE", endDate: { gt: new Date() } },
  });
  const hasAccess = Boolean(activeSub);

  const dbRecs = await prisma.recommendation.findMany({
    where: { published: true },
    include: { game: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { game: { startTime: "asc" } },
    take: 30,
  });

  const savedIds = new Set(
    (await prisma.savedPick.findMany({ where: { userId }, select: { recommendationId: true } })).map(
      (s) => s.recommendationId
    )
  );

  // Overall track record, computed separately from the displayed cards so it
  // reflects every graded pick, not just the (up to 30) shown above.
  const gradedRecs = await prisma.recommendation.findMany({
    where: { published: true, game: { status: "FINAL" } },
    include: { game: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { game: { startTime: "desc" } },
    take: 200,
  });

  let wins = 0;
  let losses = 0;
  let pushes = 0;
  for (const r of gradedRecs) {
    const result = await gradeRecommendation(r, r.game);
    if (result === "WON") wins += 1;
    else if (result === "LOST") losses += 1;
    else if (result === "PUSH") pushes += 1;
  }
  const decided = wins + losses;
  const winRate = decided > 0 ? (wins / decided) * 100 : null;

  const recs =
    dbRecs.length > 0
      ? await Promise.all(
          dbRecs.map(async (r) => ({
            id: r.id as string | null,
            gameLabel: `${r.game.awayTeam.abbreviation} @ ${r.game.homeTeam.abbreviation}`,
            type: r.type,
            pick: r.pick,
            confidence: r.confidence,
            rationale: r.rationale,
            saved: savedIds.has(r.id),
            grade: await gradeRecommendation(r, r.game),
          }))
        )
      : DEMO_RECOMMENDATIONS.map((r) => ({
          id: null as string | null,
          gameLabel: r.gameId,
          type: r.type,
          pick: r.pick,
          confidence: r.confidence,
          rationale: r.rationale,
          saved: false,
          grade: null as GradeResult,
        }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl mb-2">Picks de la semana</h1>
      <p className="text-fg/60 mb-6 max-w-2xl">
        Spread, moneyline, over/under y props de jugador — generados con un modelo estadístico a
        partir de forma reciente de equipos y jugadores. Análisis informativo, no garantía de
        resultado.
      </p>

      {(wins > 0 || losses > 0 || pushes > 0) && (
        <div className="flex flex-wrap items-center gap-4 border border-fg/10 bg-surface px-5 py-3 mb-8">
          <p className="font-display text-sm tracking-wide">
            RÉCORD DEL MODELO:{" "}
            <span className="stat-num">
              {wins}-{losses}
              {pushes > 0 ? `-${pushes}` : ""}
            </span>
          </p>
          {winRate != null && <p className="text-sm text-fg/60">{winRate.toFixed(0)}% de aciertos</p>}
        </div>
      )}

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
          <div key={r.id ?? i} className="border border-fg/10 bg-surface p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-display tracking-widest text-red">
                {RECOMMENDATION_TYPE_LABEL[r.type]}
              </span>
              {r.grade && (
                <span className={`text-[10px] font-display tracking-wide px-1.5 py-0.5 ${GRADE_CLASS[r.grade]}`}>
                  {GRADE_LABEL[r.grade]}
                </span>
              )}
            </div>
            <p className="text-xs text-fg/50 mb-1">{r.gameLabel}</p>
            <p className={`font-display text-xl mt-1 mb-2 ${!hasAccess ? "blur-sm select-none" : ""}`}>
              {r.pick}
            </p>
            <div className="h-1.5 bg-fg/10 mb-2">
              <div className="h-full bg-red" style={{ width: `${r.confidence * 100}%` }} />
            </div>
            <p className={`text-sm text-fg/70 mb-3 ${!hasAccess ? "blur-sm select-none" : ""}`}>
              {r.rationale}
            </p>
            {r.id && hasAccess && (
              <form action={async () => { "use server"; await toggleSavedPick(r.id!); }}>
                <button className={`text-xs font-display tracking-wide ${r.saved ? "text-red" : "text-fg/50 hover:text-fg"}`}>
                  {r.saved ? "★ Guardado" : "☆ Guardar pick"}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
