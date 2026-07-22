import type { EspnSummaryResponse } from "./types";

export interface TeamStatRow {
  label: string;
  home: string;
  away: string;
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
      teamStats.push({ label: stat.label || stat.name, home: other?.displayValue ?? "—", away: stat.displayValue });
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
