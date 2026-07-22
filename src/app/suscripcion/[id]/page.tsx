import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BANK_CODES } from "@/lib/banxico/bank-codes";
import { submitPaymentClaim } from "../actions";

function formatMXN(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const CLAIM_STATUS_LABEL: Record<string, string> = {
  PENDING: "Revisando con Banxico…",
  VERIFIED: "Verificado ✓",
  REJECTED: "Rechazado",
  MANUAL_REVIEW: "En revisión manual por un admin",
};

export default async function SuscripcionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/ingresar");

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true, paymentClaims: { orderBy: { createdAt: "desc" } } },
  });

  if (!subscription || subscription.userId !== session.user.id) notFound();

  const bankName = process.env.PAYOUT_BANK_NAME ?? "";
  const clabe = process.env.PAYOUT_CLABE ?? "";
  const beneficiary = process.env.PAYOUT_BENEFICIARY ?? "";

  const hasPendingOrVerified = subscription.paymentClaims.some(
    (c) => c.status === "VERIFIED" || c.status === "PENDING" || c.status === "MANUAL_REVIEW"
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl mb-2">Plan {subscription.plan.name}</h1>
      <p className="text-fg/60 mb-8">
        {formatMXN(subscription.plan.priceMXN)} · Estado de suscripción:{" "}
        <span className="font-semibold">{subscription.status}</span>
      </p>

      <div className="bg-navy text-chalk p-6 mb-8">
        <h2 className="font-display text-xl mb-4">1. Haz tu transferencia SPEI</h2>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-chalk/60">Banco</dt>
            <dd className="stat-num text-lg">{bankName}</dd>
          </div>
          <div>
            <dt className="text-chalk/60">CLABE</dt>
            <dd className="stat-num text-lg">{clabe}</dd>
          </div>
          <div>
            <dt className="text-chalk/60">Beneficiario</dt>
            <dd className="text-lg">{beneficiary}</dd>
          </div>
          <div>
            <dt className="text-chalk/60">Monto exacto</dt>
            <dd className="stat-num text-lg">{formatMXN(subscription.plan.priceMXN)}</dd>
          </div>
        </dl>
        <p className="text-xs text-chalk/60 mt-4">
          Usa el monto exacto — lo usamos para confirmar tu pago automáticamente contra Banxico.
        </p>
      </div>

      <div className="border border-fg/10 p-6 mb-8">
        <h2 className="font-display text-xl mb-4">2. Reporta tu transferencia</h2>
        <form
          action={async (formData) => {
            "use server";
            await submitPaymentClaim(subscription.id, formData);
          }}
          className="grid sm:grid-cols-2 gap-4"
        >
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Clave de rastreo (folio SPEI)
            <input
              name="claveRastreo"
              required
              minLength={6}
              className="border border-fg/20 px-3 py-2 bg-surface"
              placeholder="MBAN01001..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fecha de la transferencia
            <input name="fechaOperacion" type="date" required className="border border-fg/20 px-3 py-2 bg-surface" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Banco desde donde transferiste
            <select name="bancoEmisor" required className="border border-fg/20 px-3 py-2 bg-surface">
              {BANK_CODES.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Tu CLABE o cuenta de origen
            <input name="cuentaOrdenante" required minLength={4} className="border border-fg/20 px-3 py-2 bg-surface" />
          </label>

          <button
            type="submit"
            disabled={hasPendingOrVerified}
            className="btn btn-primary sm:col-span-2 disabled:opacity-40"
          >
            {hasPendingOrVerified ? "Ya reportaste esta transferencia" : "Confirmar transferencia"}
          </button>
        </form>
      </div>

      {subscription.paymentClaims.length > 0 && (
        <div>
          <h2 className="font-display text-xl mb-4">Historial</h2>
          <ul className="space-y-2 text-sm">
            {subscription.paymentClaims.map((c) => (
              <li key={c.id} className="border border-fg/10 px-4 py-3 flex justify-between">
                <span>Folio {c.claveRastreo}</span>
                <span className="font-semibold">{CLAIM_STATUS_LABEL[c.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
