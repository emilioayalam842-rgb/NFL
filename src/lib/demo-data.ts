// Fallback content shown when ESPN's public feed is unreachable (offline dev,
// firewalled sandboxes, ESPN downtime). Keeps every page demoable without a
// live connection. Not used once real data comes back.

export interface DemoTeam {
  id: string;
  name: string;
  abbr: string;
  primary: string;
  secondary: string;
}

export const DEMO_TEAMS: DemoTeam[] = [
  { id: "dal", name: "Dallas Cowboys", abbr: "DAL", primary: "#041E42", secondary: "#869397" },
  { id: "phi", name: "Philadelphia Eagles", abbr: "PHI", primary: "#004C54", secondary: "#A5ACAF" },
  { id: "kc", name: "Kansas City Chiefs", abbr: "KC", primary: "#E31837", secondary: "#FFB81C" },
  { id: "buf", name: "Buffalo Bills", abbr: "BUF", primary: "#00338D", secondary: "#C60C30" },
  { id: "sf", name: "San Francisco 49ers", abbr: "SF", primary: "#AA0000", secondary: "#B3995D" },
  { id: "bal", name: "Baltimore Ravens", abbr: "BAL", primary: "#241773", secondary: "#9E7C0C" },
];

export interface DemoGame {
  id: string;
  week: number;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status: "SCHEDULED" | "FINAL";
  kickoff: string;
  spread: string;
  total: number;
}

export const DEMO_GAMES: DemoGame[] = [
  {
    id: "g1",
    week: 8,
    home: "kc",
    away: "buf",
    status: "SCHEDULED",
    kickoff: "2026-10-25T20:25:00-05:00",
    spread: "KC -2.5",
    total: 48.5,
  },
  {
    id: "g2",
    week: 8,
    home: "phi",
    away: "dal",
    status: "SCHEDULED",
    kickoff: "2026-10-26T17:00:00-05:00",
    spread: "PHI -3",
    total: 45,
  },
  {
    id: "g3",
    week: 7,
    home: "sf",
    away: "bal",
    homeScore: 27,
    awayScore: 24,
    status: "FINAL",
    kickoff: "2026-10-19T20:20:00-05:00",
    spread: "SF -1.5",
    total: 46.5,
  },
];

export interface DemoPlayerStat {
  player: string;
  team: string;
  position: string;
  week: number;
  passingYards?: number;
  rushingYards?: number;
  receivingYards?: number;
  receptions?: number;
  tackles?: number;
}

export const DEMO_PLAYER_STATS: DemoPlayerStat[] = [
  { player: "P. Mahomes", team: "KC", position: "QB", week: 7, passingYards: 291 },
  { player: "J. Allen", team: "BUF", position: "QB", week: 7, passingYards: 264, rushingYards: 41 },
  { player: "C. Lamb", team: "DAL", position: "WR", week: 7, receivingYards: 103, receptions: 7 },
  { player: "S. Barkley", team: "PHI", position: "RB", week: 7, rushingYards: 122 },
  { player: "F. Warner", team: "SF", position: "LB", week: 7, tackles: 11 },
];

export interface DemoRecommendation {
  gameId: string;
  type: "SPREAD" | "MONEYLINE" | "TOTAL" | "PLAYER_PROP";
  pick: string;
  confidence: number;
  rationale: string;
}

export function demoGameToDisplay(g: DemoGame) {
  const home = DEMO_TEAMS.find((t) => t.id === g.home)!;
  const away = DEMO_TEAMS.find((t) => t.id === g.away)!;
  return {
    id: g.id,
    week: g.week,
    kickoff: g.kickoff,
    status: g.status,
    statusText: g.status === "FINAL" ? "Final" : "Programado",
    home: { name: home.name, abbr: home.abbr, score: g.homeScore },
    away: { name: away.name, abbr: away.abbr, score: g.awayScore },
    odds: `${g.spread} · O/U ${g.total}`,
  };
}

export const DEMO_RECOMMENDATIONS: DemoRecommendation[] = [
  {
    gameId: "g1",
    type: "SPREAD",
    pick: "KC -2.5",
    confidence: 0.64,
    rationale:
      "KC ha cubierto el spread en 6 de sus últimos 8 juegos en casa; BUF llega con la línea ofensiva golpeada.",
  },
  {
    gameId: "g1",
    type: "TOTAL",
    pick: "Under 48.5",
    confidence: 0.58,
    rationale: "Ambas defensas top-10 en yardas permitidas en las últimas 4 semanas.",
  },
  {
    gameId: "g2",
    type: "PLAYER_PROP",
    pick: "C. Lamb Over 79.5 yardas de recepción",
    confidence: 0.61,
    rationale: "Promedio de 91 yardas en sus últimos 5 juegos vs. defensivas top-15.",
  },
];
