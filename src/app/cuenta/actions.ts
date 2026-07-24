"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function setSelfExclusion(days: number) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const until = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { selfExcludedUntil: until },
  });

  revalidatePath("/cuenta");
}

export async function toggleFavoriteTeam(teamId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const existing = await prisma.favoriteTeam.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId } },
  });

  if (existing) {
    await prisma.favoriteTeam.delete({ where: { id: existing.id } });
  } else {
    await prisma.favoriteTeam.create({ data: { userId: session.user.id, teamId } });
  }

  revalidatePath("/cuenta");
  revalidatePath(`/equipo/${teamId}`);
}

export async function removeSavedPick(recommendationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  await prisma.savedPick.deleteMany({
    where: { userId: session.user.id, recommendationId },
  });

  revalidatePath("/cuenta");
  revalidatePath("/recomendaciones");
}
