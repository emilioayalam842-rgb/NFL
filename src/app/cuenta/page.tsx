import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateReferralCode } from "@/lib/referral";
import { setSelfExclusion, toggleFavoriteTeam, removeSavedPick } from "./actions";

export const metadata = { title: "Mi cuenta — Zona Roja" };

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
  MANUAL_REVIEW: "En revisión manual",
};

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ excluido?: string }>;
}) {
  const { excluido } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const favoriteTeams = await prisma.favoriteTeam.findMany({
    where: { userId },
    include: { team: true },
    orderBy: { createdAt: "desc" },
  });

  const savedPicks = await prisma.savedPick.findMany({
    where: { userId },
    include: {
      recommendation: { include: { game: { include: { homeTeam: true, awayTeam: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const paymentClaims = await prisma.paymentClaim.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const referralCode = await getOrCreateReferralCode(userId);
  const referrals = await prisma.user.findMany({
    where: { referredById: userId },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const referralLink = `${proto}://${host}/registro?ref=${referralCode}`;

  const now = new Date();
  const isExcluded = Boolean(user?.selfExcludedUntil && user.selfExcludedUntil > now);

  const expiringSoon = subscriptions.find((s) => {
    if (s.status !== "ACTIVE" || !s.endDate) return false;
    const daysLeft = (s.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 5;
  });
  const daysUntilExpiry = expiringSoon?.endDate
    ? Math.ceil((expiringSoon.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl mb-2">Mi cuenta</h1>
      <p className="text-fg/60 mb-8">{user?.email}</p>

      {excluido && (
        <p className="bg-red/10 text-red text-sm px-4 py-3 mb-6 border border-red/30">
          Tienes la auto-exclusión activada: no puedes iniciar nuevas suscripciones por ahora.
        </p>
      )}

      {expiringSoon && (
        <div className="bg-navy text-chalk px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            Tu plan <span className="font-semibold">{expiringSoon.plan.name}</span> vence en{" "}
            <span className="font-semibold">
              {daysUntilExpiry} día{daysUntilExpiry === 1 ? "" : "s"}
            </span>
            .
          </p>
          <Link href="/planes" className="bg-red px-4 py-1.5 text-sm font-display tracking-wide hover:bg-red-dark transition-colors">
            Renovar
          </Link>
        </div>
      )}

      <section className="mb-10">
        <h2 className="font-display text-xl mb-4">Suscripciones</h2>
        {subscriptions.length === 0 ? (
          <p className="text-fg/60">Aún no tienes ninguna suscripción.</p>
        ) : (
          <ul className="space-y-2">
            {subscriptions.map((s) => (
              <li key={s.id} className="border border-fg/10 px-4 py-3 flex items-center justify-between text-sm">
                <span>{s.plan.name}</span>
                <span className="font-semibold">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-4">Historial de pagos</h2>
        {paymentClaims.length === 0 ? (
          <p className="text-fg/60">Aún no has registrado ningún pago.</p>
        ) : (
          <ul className="space-y-2">
            {paymentClaims.map((p) => (
              <li key={p.id} className="border border-fg/10 px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="stat-num font-semibold">
                    {(p.amountMXN / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                  </p>
                  <p className="text-xs text-fg/50">{p.createdAt.toLocaleDateString("es-MX")}</p>
                </div>
                <span className="text-xs font-display tracking-wide">
                  {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-2">Invita a un amigo</h2>
        <p className="text-sm text-fg/60 mb-4">
          Comparte tu link — cuando alguien se registre con él, queda ligado a tu cuenta.
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <code className="border border-fg/10 bg-surface px-3 py-2 text-sm break-all">{referralLink}</code>
        </div>
        {referrals.length === 0 ? (
          <p className="text-fg/60 text-sm">Todavía no has invitado a nadie.</p>
        ) : (
          <ul className="space-y-2">
            {referrals.map((r) => (
              <li key={r.id} className="border border-fg/10 px-4 py-3 flex items-center justify-between text-sm">
                <span>{r.name ?? r.email}</span>
                <span className="text-xs text-fg/50">{r.createdAt.toLocaleDateString("es-MX")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-4">Mis equipos</h2>
        {favoriteTeams.length === 0 ? (
          <p className="text-fg/60">
            No sigues ningún equipo todavía — visita la página de un equipo y dale &ldquo;Seguir
            equipo&rdquo;.
          </p>
        ) : (
          <ul className="space-y-2">
            {favoriteTeams.map((f) => (
              <li key={f.id} className="border border-fg/10 px-4 py-3 flex items-center justify-between text-sm">
                <Link href={`/equipo/${f.team.id}`} className="font-semibold hover:text-red transition-colors">
                  {f.team.city} {f.team.name}
                </Link>
                <form action={async () => { "use server"; await toggleFavoriteTeam(f.team.id); }}>
                  <button className="text-xs text-fg/50 hover:text-fg">Dejar de seguir</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-4">Picks guardados</h2>
        {savedPicks.length === 0 ? (
          <p className="text-fg/60">
            No has guardado ningún pick — desde &ldquo;Picks&rdquo; dale &ldquo;Guardar pick&rdquo; a
            los que quieras encontrar rápido después.
          </p>
        ) : (
          <ul className="space-y-2">
            {savedPicks.map((s) => (
              <li key={s.id} className="border border-fg/10 px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-display">{s.recommendation.pick}</p>
                  <p className="text-xs text-fg/50">
                    {s.recommendation.game.awayTeam.abbreviation} @ {s.recommendation.game.homeTeam.abbreviation}
                  </p>
                </div>
                <form action={async () => { "use server"; await removeSavedPick(s.recommendationId); }}>
                  <button className="text-xs text-fg/50 hover:text-fg shrink-0">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-fg/10 p-6">
        <h2 className="font-display text-xl mb-2">Juego responsable</h2>
        <p className="text-sm text-fg/60 mb-4">
          Si necesitas pausar tus apuestas, puedes bloquear temporalmente nuevas suscripciones en tu
          cuenta. Esto no cancela una suscripción activa, solo evita que compres una nueva.
        </p>
        {isExcluded ? (
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Auto-exclusión activa hasta{" "}
              <span className="font-semibold">{user!.selfExcludedUntil!.toLocaleDateString("es-MX")}</span>
            </p>
          </div>
        ) : (
          <form action={async (formData) => {
            "use server";
            await setSelfExclusion(Number(formData.get("days")));
          }} className="flex flex-wrap items-center gap-3">
            <select name="days" className="border border-fg/20 px-3 py-2 bg-surface text-sm">
              <option value="30">30 días</option>
              <option value="90">90 días</option>
              <option value="365">1 año</option>
            </select>
            <button className="bg-ink text-chalk px-4 py-2 text-sm font-display tracking-wide">
              Auto-excluirme
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
