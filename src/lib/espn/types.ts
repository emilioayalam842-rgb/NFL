// Partial types for ESPN's public NFL JSON feeds. These are undocumented and
// can change without notice — only the fields we actually read are typed;
// everything else is left as unknown so a shape change doesn't silently lie.

export interface EspnTeamRef {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  color?: string;
  alternateColor?: string;
  logos?: { href: string }[];
}

export interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  score?: string;
  team: EspnTeamRef;
}

export interface EspnOdds {
  details?: string; // e.g. "DAL -3.5"
  overUnder?: number;
  spread?: number;
}

export interface EspnCompetition {
  id: string;
  date: string;
  venue?: { fullName?: string };
  status: {
    type: { state: "pre" | "in" | "post"; completed: boolean; description: string };
  };
  competitors: EspnCompetitor[];
  odds?: EspnOdds[];
}

export interface EspnEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  week?: { number: number };
  season?: { year: number; type: number };
  competitions: EspnCompetition[];
}

export interface EspnScoreboardResponse {
  events: EspnEvent[];
}

export interface EspnTeamsResponse {
  sports: {
    leagues: {
      teams: { team: EspnTeamRef & { location?: string } }[];
    }[];
  }[];
}

export interface EspnScheduleResponse {
  events: EspnEvent[];
}

export interface EspnAthleteStat {
  name: string; // e.g. "passingYards"
  displayValue: string;
}

export interface EspnBoxscorePlayerCategory {
  name: string; // "passing" | "rushing" | "receiving" | "defensive" ...
  labels: string[];
  athletes: {
    athlete: { id: string; displayName: string; position?: { abbreviation?: string } };
    stats: string[];
  }[];
}

export interface EspnBoxscoreTeamPlayers {
  team: EspnTeamRef;
  statistics: EspnBoxscorePlayerCategory[];
}

export interface EspnBoxscoreTeamStat {
  name: string;
  displayValue: string;
  label: string;
}

export interface EspnBoxscoreTeamStats {
  team: EspnTeamRef;
  statistics: EspnBoxscoreTeamStat[];
}

export interface EspnWinProbabilityEntry {
  homeWinPercentage: number; // 0-1
  secondsLeft?: number;
}

export interface EspnSummaryResponse {
  boxscore?: {
    teams?: EspnBoxscoreTeamStats[];
    players?: EspnBoxscoreTeamPlayers[];
  };
  header?: {
    competitions: EspnCompetition[];
  };
  // ESPN appends one entry per play as the game progresses — the last one is
  // the current in-game win probability.
  winprobability?: EspnWinProbabilityEntry[];
}
