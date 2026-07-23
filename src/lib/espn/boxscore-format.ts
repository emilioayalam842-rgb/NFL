import type { EspnSummaryResponse } from "./types";

export interface TeamStatRow {
  name: string;
  label: string;
  home: string;
  away: string;
  /** 0-100 share of the (home + away) numeric value that belongs to home,
   * used to size the comparison bar. 50 when the stat isn't a plain number
   * (e.g. "19/31") or both sides are 0. */
  homeShare: number;
}

function leadingNumber(displayValue: string): number {
  const match = displayValue.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export interface PlayerLeaderRow {
  category: string;
  labels: string[];
  home: { name: string; stats: string[] }[];
  away: { name: string; stats: string[] }[];
}

export interface DisplayBoxscore {
  teamStats: TeamStatRow[];
  leaders: PlayerLeaderRow[];
}

const TOP_CATEGORIES = ["passing", "rushing", "receiving", "defensive"];

export function toDisplayBoxscore(summary: EspnSummaryResponse): DisplayBoxscore | null {
  const teams = summary.boxscore?.teams;
  const players = summary.boxscore?.players;
  if (!teams && !players) return null;

  const teamStats: TeamStatRow[] = [];
  if (teams && teams.length === 2) {
    const [a, b] = teams;
    const byName = new Map(a.statistics.map((s) => [s.name, s]));
    for (const stat of b.statistics) {
      const other = byName.get(stat.name);
      if (!other) continue; // only show stats present for both teams

      const homeNum = leadingNumber(other.displayValue);
      const awayNum = leadingNumber(stat.displayValue);
      const total = homeNum + awayNum;

      teamStats.push({
        name: stat.name,
        label: STAT_LABEL[stat.name] ?? stat.label ?? stat.name,
        home: other.displayValue,
        away: stat.displayValue,
        homeShare: total > 0 ? (homeNum / total) * 100 : 50,
      });
    }
  }

  const leaders: PlayerLeaderRow[] = [];
  if (players && players.length === 2) {
    const [away, home] = players; // ESPN lists away first, home second
    for (const category of TOP_CATEGORIES) {
      const homeCat = home.statistics.find((c) => c.name === category);
      const awayCat = away.statistics.find((c) => c.name === category);
      if (!homeCat && !awayCat) continue;

      leaders.push({
        category,
        labels: homeCat?.labels ?? awayCat?.labels ?? [],
        home: (homeCat?.athletes ?? []).slice(0, 3).map((a) => ({ name: a.athlete.displayName, stats: a.stats })),
        away: (awayCat?.athletes ?? []).slice(0, 3).map((a) => ({ name: a.athlete.displayName, stats: a.stats })),
      });
    }
  }

  return { teamStats, leaders };
}

const CATEGORY_LABEL: Record<string, string> = {
  passing: "Pase",
  rushing: "Carrera",
  receiving: "Recepción",
  defensive: "Defensiva",
};

export function categoryLabel(name: string) {
  return CATEGORY_LABEL[name] ?? name;
}

// ESPN's boxscore team-stat `name` keys are stable machine identifiers —
// translate the common ones instead of showing their (English) `label`.
const STAT_LABEL: Record<string, string> = {
  firstDowns: "1ras oportunidades",
  firstDownsPassing: "1ras por pase",
  firstDownsRushing: "1ras por carrera",
  firstDownsPenalty: "1ras por penalización",
  thirdDownEff: "3ra oportunidad",
  fourthDownEff: "4ta oportunidad",
  totalOffensivePlays: "Jugadas totales",
  totalYards: "Yardas totales",
  yardsPerPlay: "Yardas por jugada",
  totalDrives: "Series ofensivas",
  netPassingYards: "Yardas de pase",
  completionAttempts: "Pases comp/int",
  yardsPerPass: "Yardas por pase",
  interceptions: "Intercepciones",
  sacksYardsLost: "Capturas-yardas",
  rushingYards: "Yardas por tierra",
  rushingAttempts: "Acarreos",
  yardsPerRushAttempt: "Yardas por acarreo",
  redZoneAttempts: "Zona roja",
  penalties: "Penalizaciones-yardas",
  turnovers: "Pérdidas de balón",
  fumblesLost: "Balones sueltos perdidos",
  defensiveTouchdowns: "TDs defensivos",
  possessionTime: "Tiempo de posesión",
};

// Section grouping for the stats tab, 365Scores-style ("Ofensiva" vs the rest).
const OFFENSIVE_STATS = new Set([
  "firstDowns",
  "firstDownsPassing",
  "firstDownsRushing",
  "firstDownsPenalty",
  "thirdDownEff",
  "fourthDownEff",
  "totalOffensivePlays",
  "totalYards",
  "yardsPerPlay",
  "totalDrives",
  "netPassingYards",
  "completionAttempts",
  "yardsPerPass",
  "rushingYards",
  "rushingAttempts",
  "yardsPerRushAttempt",
  "redZoneAttempts",
]);

export function statSection(name: string): "ofensiva" | "otras" {
  return OFFENSIVE_STATS.has(name) ? "ofensiva" : "otras";
}
