"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyPaymentClaim, resolveClaimManually } from "@/lib/banxico/verify-claim";
import { syncTeams, syncScoreboard } from "@/lib/espn/sync";
import { generateRecommendationsForGame } from "@/lib/recommendations/generate";

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("No autorizado.");
  return session;
}

export async function rerunAutoVerify(claimId: string) {
  await requireAdmin();
  await verifyPaymentClaim(claimId);
  revalidatePath("/admin/pagos");
}

export async function manualResolveClaim(claimId: string, approve: boolean, note: string) {
  await requireAdmin();
  await resolveClaimManually(claimId, approve, note || undefined);
  revalidatePath("/admin/pagos");
}

export async function toggleUserRole(userId: string) {
  await requireAdmin();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === "ADMIN" ? "USER" : "ADMIN" },
  });
  revalidatePath("/admin/usuarios");
}

export async function syncTeamsAction() {
  await requireAdmin();
  const result = await syncTeams();
  revalidatePath("/admin/juegos");
  return result;
}

export async function syncScoreboardAction(week?: number) {
  await requireAdmin();
  const result = await syncScoreboard({ week });
  revalidatePath("/admin/juegos");
  return result;
}

export async function updateGameLines(gameId: string, marketSpread: number | null, marketTotal: number | null) {
  await requireAdmin();
  await prisma.game.update({
    where: { id: gameId },
    data: { marketSpread, marketTotal },
  });
  revalidatePath("/admin/juegos");
}

export async function generateRecsAction(gameId: string) {
  await requireAdmin();
  await generateRecommendationsForGame(gameId);
  revalidatePath("/admin/recomendaciones");
}

export async function togglePublished(recId: string) {
  await requireAdmin();
  const rec = await prisma.recommendation.findUniqueOrThrow({ where: { id: recId } });
  await prisma.recommendation.update({ where: { id: recId }, data: { published: !rec.published } });
  revalidatePath("/admin/recomendaciones");
}

function parseOdds(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseLine(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function updateGameOdds(gameId: string, formData: FormData) {
  await requireAdmin();
  await prisma.game.update({
    where: { id: gameId },
    data: {
      marketSpread: parseLine(formData.get("marketSpread")),
      marketTotal: parseLine(formData.get("marketTotal")),
      spreadHomeOdds: parseOdds(formData.get("spreadHomeOdds")),
      spreadAwayOdds: parseOdds(formData.get("spreadAwayOdds")),
      totalOverOdds: parseOdds(formData.get("totalOverOdds")),
      totalUnderOdds: parseOdds(formData.get("totalUnderOdds")),
      moneylineHomeOdds: parseOdds(formData.get("moneylineHomeOdds")),
      moneylineAwayOdds: parseOdds(formData.get("moneylineAwayOdds")),
      oddsSource: (formData.get("oddsSource") as string) || null,
      oddsUpdatedAt: new Date(),
    },
  });
  revalidatePath("/admin/momios");
  revalidatePath("/momios");
}

export async function addPlayerProp(gameId: string, formData: FormData) {
  await requireAdmin();
  const playerName = String(formData.get("playerName") ?? "").trim();
  const statLabel = String(formData.get("statLabel") ?? "").trim();
  const line = parseLine(formData.get("line"));
  if (!playerName || !statLabel || line == null) {
    throw new Error("Falta jugador, estadística o línea.");
  }

  await prisma.playerPropLine.create({
    data: {
      gameId,
      playerName,
      statLabel,
      line,
      overOdds: parseOdds(formData.get("overOdds")),
      underOdds: parseOdds(formData.get("underOdds")),
      oddsSource: (formData.get("oddsSource") as string) || null,
    },
  });
  revalidatePath("/admin/momios");
  revalidatePath("/momios");
}

export async function deletePlayerProp(propId: string) {
  await requireAdmin();
  await prisma.playerPropLine.delete({ where: { id: propId } });
  revalidatePath("/admin/momios");
  revalidatePath("/momios");
}
