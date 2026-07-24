import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    users,
    activeSubs,
    pendingClaims,
    manualReview,
    publishedRecs,
    publishedThisWeek,
    revenueThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.paymentClaim.count({ where: { status: "PENDING" } }),
    prisma.paymentClaim.count({ where: { status: "MANUAL_REVIEW" } }),
    prisma.recommendation.count({ where: { published: true } }),
    prisma.recommendation.count({ where: { published: true, createdAt: { gte: startOfWeek } } }),
    prisma.paymentClaim.aggregate({
      where: { status: "VERIFIED", verifiedAt: { gte: startOfMonth } },
      _sum: { amountMXN: true },
    }),
  ]);

  const revenueMXN = (revenueThisMonth._sum.amountMXN ?? 0) / 100;

  const cards = [
    { label: "Usuarios", value: users },
    { label: "Suscripciones activas", value: activeSubs },
    { label: "Pagos pendientes", value: pendingClaims },
    { label: "En revisión manual", value: manualReview },
    { label: "Picks publicados", value: publishedRecs },
    { label: "Picks publicados esta semana", value: publishedThisWeek },
    {
      label: "Ingresos este mes",
      value: revenueMXN.toLocaleString("es-MX", { style: "currency", currency: "MXN" }),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="border border-fg/10 bg-surface p-5">
          <p className="stat-num text-3xl font-semibold">{c.value}</p>
          <p className="text-sm text-fg/60 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
