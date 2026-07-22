import type { EspnEvent } from "./types";

export interface DisplayGame {
  id: string;
  week: number;
  kickoff: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "FINAL";
  statusText: string;
  home: { name: string; abbr: string; score?: number; logo?: string };
  away: { name: string; abbr: string; score?: number; logo?: string };
  odds?: string;
  venue?: string;
}

export function toDisplayGame(event: EspnEvent): DisplayGame | null {
  const competition = event.competitions[0];
  if (!competition) return null;

  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const state = competition.status.type.state;
  const status = state === "post" ? "FINAL" : state === "in" ? "IN_PROGRESS" : "SCHEDULED";

  return {
    id: event.id,
    week: event.week?.number ?? 0,
    kickoff: event.date,
    status,
    statusText: competition.status.type.description,
    home: {
      name: home.team.displayName,
      abbr: home.team.abbreviation,
      score: home.score ? Number(home.score) : undefined,
      logo: home.team.logos?.[0]?.href,
    },
    away: {
      name: away.team.displayName,
      abbr: away.team.abbreviation,
      score: away.score ? Number(away.score) : undefined,
      logo: away.team.logos?.[0]?.href,
    },
    odds: competition.odds?.[0]?.details,
    venue: competition.venue?.fullName,
  };
}
