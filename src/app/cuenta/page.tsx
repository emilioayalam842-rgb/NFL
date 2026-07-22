import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setSelfExclusion } from "./actions";

export const metadata = { title: "Mi cuenta — Zona Roja" };

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ excluido?: string }>;
}) {
  const { excluido } = await searchParams;
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session!.user.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const isExcluded = Boolean(user?.selfExcludedUntil && user.selfExcludedUntil > new Date());

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl mb-2">Mi cuenta</h1>
      <p className="text-ink/60 mb-8">{user?.email}</p>

      {excluido && (
        <p className="bg-red/10 text-red text-sm px-4 py-3 mb-6 border border-red/30">
          Tienes la auto-exclusión activada: no puedes iniciar nuevas suscripciones por ahora.
        </p>
      )}

      <section className="mb-10">
        <h2 className="font-display text-xl mb-4">Suscripciones</h2>
        {subscriptions.length === 0 ? (
          <p className="text-ink/60">Aún no tienes ninguna suscripción.</p>
        ) : (
          <ul className="space-y-2">
            {subscriptions.map((s) => (
              <li key={s.id} className="border border-ink/10 px-4 py-3 flex items-center justify-between text-sm">
                <span>{s.plan.name}</span>
                <span className="font-semibold">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-ink/10 p-6">
        <h2 className="font-display text-xl mb-2">Juego responsable</h2>
        <p className="text-sm text-ink/60 mb-4">
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
            <select name="days" className="border border-ink/20 px-3 py-2 bg-chalk text-sm">
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
