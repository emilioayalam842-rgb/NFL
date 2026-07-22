import { prisma } from "@/lib/prisma";
import { rerunAutoVerify, manualResolveClaim } from "../actions";

function formatMXN(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function AdminPagosPage() {
  const claims = await prisma.paymentClaim.findMany({
    include: { user: true, subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h2 className="text-xl mb-6">Reportes de transferencia</h2>
      <div className="space-y-4">
        {claims.map((c) => (
          <div key={c.id} className="border border-ink/10 bg-chalk p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold">{c.user.email}</p>
                <p className="text-sm text-ink/60">
                  {c.subscription.plan.name} · {formatMXN(c.amountMXN)}
                </p>
              </div>
              <span
                className={`text-xs font-display tracking-wide px-2 py-1 ${
                  c.status === "VERIFIED"
                    ? "bg-green-700 text-chalk"
                    : c.status === "REJECTED"
                    ? "bg-ink text-chalk"
                    : c.status === "MANUAL_REVIEW"
                    ? "bg-yellow-600 text-chalk"
                    : "bg-cream-dim"
                }`}
              >
                {c.status}
              </span>
            </div>

            <dl className="grid sm:grid-cols-4 gap-3 text-sm mb-4">
              <div>
                <dt className="text-ink/50">Folio</dt>
                <dd className="stat-num">{c.claveRastreo}</dd>
              </div>
              <div>
                <dt className="text-ink/50">Fecha</dt>
                <dd>{c.fechaOperacion.toLocaleDateString("es-MX")}</dd>
              </div>
              <div>
                <dt className="text-ink/50">Banco emisor</dt>
                <dd>{c.bancoEmisor}</dd>
              </div>
              <div>
                <dt className="text-ink/50">Cuenta ordenante</dt>
                <dd>{c.cuentaOrdenante}</dd>
              </div>
            </dl>

            {c.banxicoResponse && (
              <p className="text-xs text-ink/50 mb-4">Última respuesta del bot: {c.banxicoResponse}</p>
            )}

            {(c.status === "PENDING" || c.status === "MANUAL_REVIEW") && (
              <div className="flex flex-wrap gap-3">
                <form action={async () => { "use server"; await rerunAutoVerify(c.id); }}>
                  <button className="border border-ink/20 px-3 py-1.5 text-sm hover:border-navy">
                    Reintentar verificación Banxico
                  </button>
                </form>
                <form action={async () => { "use server"; await manualResolveClaim(c.id, true, ""); }}>
                  <button className="bg-navy text-chalk px-3 py-1.5 text-sm">Aprobar manualmente</button>
                </form>
                <form action={async () => { "use server"; await manualResolveClaim(c.id, false, "Rechazado por admin"); }}>
                  <button className="bg-red text-chalk px-3 py-1.5 text-sm">Rechazar</button>
                </form>
              </div>
            )}
          </div>
        ))}
        {claims.length === 0 && <p className="text-ink/60">No hay reportes de pago todavía.</p>}
      </div>
    </div>
  );
}
