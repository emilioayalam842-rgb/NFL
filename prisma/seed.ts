import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLANS = [
  {
    slug: "semanal",
    name: "Semanal",
    priceMXN: 9900,
    intervalDays: 7,
    description: "Ideal para probar — picks de una semana de la NFL.",
    features: JSON.stringify(["Picks de spread, ML y total", "Props de jugador", "Acceso 7 días"]),
  },
  {
    slug: "mensual",
    name: "Mensual",
    priceMXN: 29900,
    intervalDays: 30,
    description: "El plan más popular — todo el mes cubierto.",
    features: JSON.stringify([
      "Picks de spread, ML y total",
      "Props de jugador",
      "Estadísticas históricas",
      "Acceso 30 días",
    ]),
  },
  {
    slug: "temporada",
    name: "Temporada",
    priceMXN: 199900,
    intervalDays: 180,
    description: "Toda la temporada regular + playoffs a precio de mayoreo.",
    features: JSON.stringify([
      "Todo lo del plan mensual",
      "Precio preferente por 6 meses",
      "Soporte prioritario",
    ]),
  },
];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log(`Seed listo: ${PLANS.length} planes.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
