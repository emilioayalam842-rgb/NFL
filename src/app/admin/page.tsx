import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [users, activeSubs, pendingClaims, manualReview, publishedRecs] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.paymentClaim.count({ where: { status: "PENDING" } }),
    prisma.paymentClaim.count({ where: { status: "MANUAL_REVIEW" } }),
    prisma.recommendation.count({ where: { published: true } }),
  ]);

  const cards = [
    { label: "Usuarios", value: users },
    { label: "Suscripciones activas", value: activeSubs },
    { label: "Pagos pendientes", value: pendingClaims },
    { label: "En revisión manual", value: manualReview },
    { label: "Picks publicados", value: publishedRecs },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="border border-ink/10 bg-chalk p-5">
          <p className="stat-num text-4xl font-semibold">{c.value}</p>
          <p className="text-sm text-ink/60 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
