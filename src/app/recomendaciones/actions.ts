"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function toggleSavedPick(recommendationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const existing = await prisma.savedPick.findUnique({
    where: { userId_recommendationId: { userId: session.user.id, recommendationId } },
  });

  if (existing) {
    await prisma.savedPick.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedPick.create({ data: { userId: session.user.id, recommendationId } });
  }

  revalidatePath("/recomendaciones");
  revalidatePath("/cuenta");
}
