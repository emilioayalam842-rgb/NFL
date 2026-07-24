"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyPaymentClaim, resolveClaimManually } from "@/lib/banxico/verify-claim";
import { syncTeams, syncScoreboard } from "@/lib/espn/sync";
import { syncPlayerStatsForGame, syncPlayerStatsForFinishedGames } from "@/lib/espn/sync-player-stats";
import { generateRecommendationsForGame, generateRecommendationsForWeek } from "@/lib/recommendations/generate";
import { notifyFavoriteTeamFollowers } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

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

export async function syncPlayerStatsAction(gameId: string) {
  await requireAdmin();
  const result = await syncPlayerStatsForGame(gameId);
  revalidatePath("/admin/juegos");
  return result;
}

export async function syncAllPlayerStatsAction() {
  await requireAdmin();
  const result = await syncPlayerStatsForFinishedGames();
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

export async function generateRecsForWeekAction(week: number) {
  await requireAdmin();
  const result = await generateRecommendationsForWeek(week);
  revalidatePath("/admin/recomendaciones");
  return result;
}

export async function togglePublished(recId: string) {
  await requireAdmin();
  const rec = await prisma.recommendation.findUniqueOrThrow({ where: { id: recId }, include: { game: true } });
  const nextPublished = !rec.published;
  await prisma.recommendation.update({ where: { id: recId }, data: { published: nextPublished } });

  if (nextPublished) {
    await notifyFavoriteTeamFollowers(
      [rec.game.homeTeamId, rec.game.awayTeamId],
      `Nuevo pick: ${rec.pick}`,
      `/partido/${rec.game.espnId}`
    );
  }

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
  const session = await requireAdmin();
  const marketSpread = parseLine(formData.get("marketSpread"));
  const marketTotal = parseLine(formData.get("marketTotal"));
  const moneylineHomeOdds = parseOdds(formData.get("moneylineHomeOdds"));
  const moneylineAwayOdds = parseOdds(formData.get("moneylineAwayOdds"));

  await prisma.game.update({
    where: { id: gameId },
    data: {
      marketSpread,
      marketTotal,
      spreadHomeOdds: parseOdds(formData.get("spreadHomeOdds")),
      spreadAwayOdds: parseOdds(formData.get("spreadAwayOdds")),
      totalOverOdds: parseOdds(formData.get("totalOverOdds")),
      totalUnderOdds: parseOdds(formData.get("totalUnderOdds")),
      moneylineHomeOdds,
      moneylineAwayOdds,
      oddsSource: (formData.get("oddsSource") as string) || null,
      oddsUpdatedAt: new Date(),
    },
  });

  await logAudit(
    session!.user.id,
    "update_game_odds",
    "Game",
    gameId,
    `spread ${marketSpread ?? "—"}, total ${marketTotal ?? "—"}, ML ${moneylineAwayOdds ?? "—"}/${moneylineHomeOdds ?? "—"}`
  );

  revalidatePath("/admin/momios");
  revalidatePath("/momios");
}

export async function addPlayerProp(gameId: string, formData: FormData) {
  const session = await requireAdmin();
  const playerName = String(formData.get("playerName") ?? "").trim();
  const statLabel = String(formData.get("statLabel") ?? "").trim();
  const line = parseLine(formData.get("line"));
  if (!playerName || !statLabel || line == null) {
    throw new Error("Falta jugador, estadística o línea.");
  }

  const prop = await prisma.playerPropLine.create({
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

  await logAudit(session!.user.id, "add_player_prop", "PlayerPropLine", prop.id, `${playerName} — ${statLabel} ${line}`);

  revalidatePath("/admin/momios");
  revalidatePath("/momios");
}

export async function deletePlayerProp(propId: string) {
  const session = await requireAdmin();
  await prisma.playerPropLine.delete({ where: { id: propId } });
  await logAudit(session!.user.id, "delete_player_prop", "PlayerPropLine", propId);
  revalidatePath("/admin/momios");
  revalidatePath("/momios");
}

export async function addGameOddsQuote(gameId: string, formData: FormData) {
  const session = await requireAdmin();
  const source = String(formData.get("source") ?? "").trim();
  if (!source) throw new Error("Falta la casa de apuestas.");

  const quote = await prisma.gameOddsQuote.create({
    data: {
      gameId,
      source,
      marketSpread: parseLine(formData.get("marketSpread")),
      marketTotal: parseLine(formData.get("marketTotal")),
      spreadHomeOdds: parseOdds(formData.get("spreadHomeOdds")),
      spreadAwayOdds: parseOdds(formData.get("spreadAwayOdds")),
      totalOverOdds: parseOdds(formData.get("totalOverOdds")),
      totalUnderOdds: parseOdds(formData.get("totalUnderOdds")),
      moneylineHomeOdds: parseOdds(formData.get("moneylineHomeOdds")),
      moneylineAwayOdds: parseOdds(formData.get("moneylineAwayOdds")),
    },
  });

  await logAudit(session!.user.id, "add_odds_quote", "GameOddsQuote", quote.id, source);

  revalidatePath("/admin/momios");
  revalidatePath("/momios");
}

export async function deleteGameOddsQuote(quoteId: string) {
  const session = await requireAdmin();
  await prisma.gameOddsQuote.delete({ where: { id: quoteId } });
  await logAudit(session!.user.id, "delete_odds_quote", "GameOddsQuote", quoteId);
  revalidatePath("/admin/momios");
  revalidatePath("/momios");
}
