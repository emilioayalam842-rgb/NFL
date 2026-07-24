import type { EspnSummaryResponse } from "./types";

export interface LiveWinProbability {
  home: number; // 0-1
  away: number; // 0-1
}

/**
 * Reads ESPN's play-by-play win-probability series (updated every play while
 * a game is live) and returns the most recent home/away split. This is our
 * own live model, not a copy of any sportsbook's feed — there's no public API
 * for a specific book's live line, so this is the honest way to have numbers
 * that actually move play-by-play during the game.
 */
export function liveWinProbability(summary: EspnSummaryResponse): LiveWinProbability | null {
  const entries = summary.winprobability;
  if (!entries || entries.length === 0) return null;

  const last = entries[entries.length - 1];
  if (last.homeWinPercentage == null || Number.isNaN(last.homeWinPercentage)) return null;

  const home = Math.min(0.99, Math.max(0.01, last.homeWinPercentage));
  return { home, away: 1 - home };
}

/** Converts a win probability (0-1) into an equivalent American moneyline price. */
export function impliedMoneyline(prob: number): number | null {
  if (!(prob > 0 && prob < 1)) return null;
  if (prob >= 0.5) return Math.round(-100 * (prob / (1 - prob)));
  return Math.round(100 * ((1 - prob) / prob));
}
