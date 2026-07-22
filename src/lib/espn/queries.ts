import { espnGet } from "./client";
import type {
  EspnScoreboardResponse,
  EspnTeamsResponse,
  EspnScheduleResponse,
  EspnSummaryResponse,
} from "./types";

export function getScoreboard(opts: { week?: number; seasonType?: number; year?: number } = {}) {
  return espnGet<EspnScoreboardResponse>("/scoreboard", {
    week: opts.week,
    seasontype: opts.seasonType,
    year: opts.year,
  });
}

export function getTeams() {
  return espnGet<EspnTeamsResponse>("/teams", {}, 60 * 60 * 6);
}

export function getTeamSchedule(teamId: string, year?: number) {
  return espnGet<EspnScheduleResponse>(`/teams/${teamId}/schedule`, { season: year });
}

export function getGameSummary(eventId: string) {
  return espnGet<EspnSummaryResponse>("/summary", { event: eventId }, 30);
}
