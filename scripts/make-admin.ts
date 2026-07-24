// Uso: npx tsx scripts/make-admin.ts correo@ejemplo.com
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npx tsx scripts/make-admin.ts correo@ejemplo.com");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`${user.email} ahora es ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
