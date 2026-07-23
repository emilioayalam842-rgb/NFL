import { prisma } from "@/lib/prisma";
import { getGameSummary } from "./queries";
import type { EspnBoxscorePlayerCategory, EspnBoxscoreTeamPlayers } from "./types";

function statValue(
  category: EspnBoxscorePlayerCategory | undefined,
  stats: string[],
  labelMatch: string
): number | null {
  if (!category) return null;
  const idx = category.labels.findIndex((l) => l.toUpperCase() === labelMatch);
  if (idx === -1) return null;
  const raw = stats[idx];
  if (raw == null) return null;
  const n = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

interface StatFields {
  passingYards?: number | null;
  passingTDs?: number | null;
  interceptions?: number | null;
  rushingYards?: number | null;
  rushingTDs?: number | null;
  receptions?: number | null;
  receivingYards?: number | null;
  receivingTDs?: number | null;
  tackles?: number | null;
  sacks?: number | null;
}

interface AthleteEntry {
  name: string;
  position?: string;
  fields: StatFields;
}

/** Merges passing/rushing/receiving/defensive categories into one row per athlete. */
function buildPlayerStatMap(team: EspnBoxscoreTeamPlayers): Map<string, AthleteEntry> {
  const byAthlete = new Map<string, AthleteEntry>();

  const passing = team.statistics.find((c) => c.name === "passing");
  const rushing = team.statistics.find((c) => c.name === "rushing");
  const receiving = team.statistics.find((c) => c.name === "receiving");
  const defensive = team.statistics.find((c) => c.name === "defensive");

  function entryFor(athleteId: string, name: string, position?: string) {
    let entry = byAthlete.get(athleteId);
    if (!entry) {
      entry = { name, position, fields: {} };
      byAthlete.set(athleteId, entry);
    }
    return entry;
  }

  for (const a of passing?.athletes ?? []) {
    const entry = entryFor(a.athlete.id, a.athlete.displayName, a.athlete.position?.abbreviation);
    entry.fields.passingYards = statValue(passing, a.stats, "YDS");
    entry.fields.passingTDs = statValue(passing, a.stats, "TD");
    entry.fields.interceptions = statValue(passing, a.stats, "INT");
  }

  for (const a of rushing?.athletes ?? []) {
    const entry = entryFor(a.athlete.id, a.athlete.displayName, a.athlete.position?.abbreviation);
    entry.fields.rushingYards = statValue(rushing, a.stats, "YDS");
    entry.fields.rushingTDs = statValue(rushing, a.stats, "TD");
  }

  for (const a of receiving?.athletes ?? []) {
    const entry = entryFor(a.athlete.id, a.athlete.displayName, a.athlete.position?.abbreviation);
    entry.fields.receptions = statValue(receiving, a.stats, "REC");
    entry.fields.receivingYards = statValue(receiving, a.stats, "YDS");
    entry.fields.receivingTDs = statValue(receiving, a.stats, "TD");
  }

  for (const a of defensive?.athletes ?? []) {
    const entry = entryFor(a.athlete.id, a.athlete.displayName, a.athlete.position?.abbreviation);
    entry.fields.tackles = statValue(defensive, a.stats, "TOT");
    entry.fields.sacks = statValue(defensive, a.stats, "SACKS");
  }

  return byAthlete;
}

/**
 * Pulls the full player boxscore for one game from ESPN and upserts it into
 * Player/PlayerGameStat, so the recommendation engine (player props) and any
 * stats pages have real historical numbers instead of an empty table.
 */
export async function syncPlayerStatsForGame(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new Error("Juego no encontrado");

  const summary = await getGameSummary(game.espnId);
  const teams = summary?.boxscore?.players;
  if (!teams || teams.length !== 2) return { synced: 0, ok: false as const };

  let synced = 0;
  for (const team of teams) {
    const dbTeam = await prisma.team.findUnique({ where: { espnId: team.team.id } });
    if (!dbTeam) continue; // run syncTeams() first

    const statMap = buildPlayerStatMap(team);
    for (const [athleteId, { name, position, fields }] of statMap) {
      const player = await prisma.player.upsert({
        where: { espnId: athleteId },
        update: { name, position: position ?? "N/A", teamId: dbTeam.id },
        create: { espnId: athleteId, name, position: position ?? "N/A", teamId: dbTeam.id },
      });

      await prisma.playerGameStat.upsert({
        where: { playerId_gameId: { playerId: player.id, gameId: game.id } },
        update: fields,
        create: { playerId: player.id, gameId: game.id, ...fields },
      });
      synced += 1;
    }
  }

  return { synced, ok: true as const };
}

/** Runs the importer for every FINAL game that doesn't have player stats yet. */
export async function syncPlayerStatsForFinishedGames() {
  const games = await prisma.game.findMany({
    where: { status: "FINAL", stats: { none: {} } },
    select: { id: true },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  let gamesProcessed = 0;
  let totalSynced = 0;
  for (const g of games) {
    const result = await syncPlayerStatsForGame(g.id);
    if (result.ok) {
      gamesProcessed += 1;
      totalSynced += result.synced;
    }
  }

  return { gamesProcessed, totalSynced };
}
