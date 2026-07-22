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
