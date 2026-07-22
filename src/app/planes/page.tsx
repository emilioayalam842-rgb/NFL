import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Planes — Zona Roja" };

function formatMXN(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function PlanesPage() {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceMXN: "asc" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl mb-2">Planes</h1>
      <p className="text-ink/60 mb-10 max-w-xl">
        Pago único por transferencia SPEI — sin tarjeta guardada, sin cargos automáticos. Tú
        transfieres, nos avisas el folio y activamos tu acceso en minutos.
      </p>

      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((plan, i) => {
          const features: string[] = JSON.parse(plan.features);
          const highlight = i === 1;
          return (
            <div
              key={plan.id}
              className={`p-6 border flex flex-col ${
                highlight ? "bg-navy text-chalk border-navy" : "bg-chalk border-ink/10"
              }`}
            >
              {highlight && (
                <span className="text-[11px] font-display tracking-widest text-red mb-2">MÁS POPULAR</span>
              )}
              <h2 className="font-display text-2xl mb-1">{plan.name}</h2>
              <p className={`text-sm mb-4 ${highlight ? "text-chalk/70" : "text-ink/60"}`}>{plan.description}</p>
              <p className="stat-num text-3xl font-semibold mb-6">{formatMXN(plan.priceMXN)}</p>
              <ul className="space-y-2 mb-8 text-sm flex-1">
                {features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className={highlight ? "text-red" : "text-red"}>▸</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={`/suscripcion/nueva?plan=${plan.slug}`}
                className={`text-center py-3 font-display tracking-wide transition-colors ${
                  highlight ? "bg-red hover:bg-red-dark" : "bg-navy text-chalk hover:bg-navy-dark"
                }`}
              >
                Elegir {plan.name}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
