import { prisma } from "@/lib/prisma";
import type { Game, Recommendation } from "@prisma/client";

export type GradeResult = "WON" | "LOST" | "PUSH" | null;

// Maps the Spanish stat label used inside a PLAYER_PROP pick string (see
// statByPosition in generate.ts) back to the PlayerGameStat field it came from.
const PROP_STAT_FIELD: Record<string, "passingYards" | "rushingYards" | "receivingYards"> = {
  "yardas de pase": "passingYards",
  "yardas por tierra": "rushingYards",
  "yardas de recepción": "receivingYards",
};

function gradeSpread(pick: string, game: Game, homeTeamName: string, awayTeamName: string): GradeResult {
  if (game.homeScore == null || game.awayScore == null) return null;

  let pickedIsHome: boolean;
  let lineText: string;
  if (pick.startsWith(homeTeamName)) {
    pickedIsHome = true;
    lineText = pick.slice(homeTeamName.length).trim();
  } else if (pick.startsWith(awayTeamName)) {
    pickedIsHome = false;
    lineText = pick.slice(awayTeamName.length).trim();
  } else {
    return null;
  }

  const line = parseFloat(lineText);
  if (Number.isNaN(line)) return null;

  const pickedScore = pickedIsHome ? game.homeScore : game.awayScore;
  const otherScore = pickedIsHome ? game.awayScore : game.homeScore;
  const margin = pickedScore - otherScore + line;

  if (margin > 0) return "WON";
  if (margin < 0) return "LOST";
  return "PUSH";
}

function gradeMoneyline(pick: string, game: Game, homeTeamName: string, awayTeamName: string): GradeResult {
  if (game.homeScore == null || game.awayScore == null) return null;

  let pickedIsHome: boolean;
  if (pick === homeTeamName) pickedIsHome = true;
  else if (pick === awayTeamName) pickedIsHome = false;
  else return null;

  const pickedScore = pickedIsHome ? game.homeScore : game.awayScore;
  const otherScore = pickedIsHome ? game.awayScore : game.homeScore;
  if (pickedScore > otherScore) return "WON";
  if (pickedScore < otherScore) return "LOST";
  return "PUSH";
}

function gradeTotal(pick: string, game: Game): GradeResult {
  if (game.homeScore == null || game.awayScore == null) return null;

  const match = pick.match(/^(Over|Under) (-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const total = game.homeScore + game.awayScore;
  const line = parseFloat(match[2]);
  const over = match[1] === "Over";

  if (total === line) return "PUSH";
  const wentOver = total > line;
  return wentOver === over ? "WON" : "LOST";
}

function gradePlayerPropValue(pick: string, line: number, statValue: number): GradeResult {
  const match = pick.match(/ (Over|Under) /);
  if (!match) return null;
  const over = match[1] === "Over";

  if (statValue === line) return "PUSH";
  const wentOver = statValue > line;
  return wentOver === over ? "WON" : "LOST";
}

/**
 * Compares a published recommendation against the game's final result (and,
 * for player props, the player's actual final stat line) to say whether it
 * hit. Returns null when the game hasn't finished yet or the pick can't be
 * matched (e.g. odds were edited after the pick was generated).
 */
export async function gradeRecommendation(
  rec: Recommendation,
  game: Game & { homeTeam: { name: string }; awayTeam: { name: string } }
): Promise<GradeResult> {
  if (game.status !== "FINAL") return null;

  switch (rec.type) {
    case "SPREAD":
      return gradeSpread(rec.pick, game, game.homeTeam.name, game.awayTeam.name);
    case "MONEYLINE":
      return gradeMoneyline(rec.pick, game, game.homeTeam.name, game.awayTeam.name);
    case "TOTAL":
      return gradeTotal(rec.pick, game);
    case "PLAYER_PROP": {
      if (rec.line == null) return null;
      const field = Object.entries(PROP_STAT_FIELD).find(([label]) => rec.pick.includes(label))?.[1];
      if (!field) return null;

      const player = await prisma.player.findFirst({
        where: { name: rec.subject, teamId: { in: [game.homeTeamId, game.awayTeamId] } },
      });
      if (!player) return null;

      const stat = await prisma.playerGameStat.findUnique({
        where: { playerId_gameId: { playerId: player.id, gameId: game.id } },
      });
      const statValue = stat?.[field];
      if (statValue == null) return null;

      return gradePlayerPropValue(rec.pick, rec.line, statValue);
    }
    default:
      return null;
  }
}
