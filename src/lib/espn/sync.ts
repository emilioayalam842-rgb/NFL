import { prisma } from "@/lib/prisma";
import { getScoreboard, getTeams } from "./queries";

/** Upserts every current NFL team from ESPN into the local Team table. */
export async function syncTeams() {
  const data = await getTeams();
  if (!data) return { synced: 0, ok: false as const };

  const teams = data.sports.flatMap((s) => s.leagues.flatMap((l) => l.teams));

  let synced = 0;
  for (const { team } of teams) {
    await prisma.team.upsert({
      where: { espnId: team.id },
      update: {
        name: team.displayName,
        abbreviation: team.abbreviation,
        city: team.location ?? team.shortDisplayName,
        colorPrimary: team.color ? `#${team.color}` : "#013369",
        colorSecondary: team.alternateColor ? `#${team.alternateColor}` : "#D50A0A",
        logoUrl: team.logos?.[0]?.href,
      },
      create: {
        espnId: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        city: team.location ?? team.shortDisplayName,
        conference: "",
        division: "",
        colorPrimary: team.color ? `#${team.color}` : "#013369",
        colorSecondary: team.alternateColor ? `#${team.alternateColor}` : "#D50A0A",
        logoUrl: team.logos?.[0]?.href,
      },
    });
    synced += 1;
  }

  return { synced, ok: true as const };
}

/** Upserts games for a given week/season into the local Game table. */
export async function syncScoreboard(opts: { week?: number; seasonType?: number; year?: number } = {}) {
  const data = await getScoreboard(opts);
  if (!data) return { synced: 0, ok: false as const };

  let synced = 0;
  for (const event of data.events) {
    const competition = event.competitions[0];
    if (!competition) continue;

    const home = competition.competitors.find((c) => c.homeAway === "home");
    const away = competition.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const homeTeam = await prisma.team.findUnique({ where: { espnId: home.team.id } });
    const awayTeam = await prisma.team.findUnique({ where: { espnId: away.team.id } });
    if (!homeTeam || !awayTeam) continue; // run syncTeams() first

    const status =
      competition.status.type.state === "post"
        ? "FINAL"
        : competition.status.type.state === "in"
        ? "IN_PROGRESS"
        : "SCHEDULED";

    const odds = competition.odds?.[0];

    await prisma.game.upsert({
      where: { espnId: event.id },
      update: {
        homeScore: home.score ? Number(home.score) : null,
        awayScore: away.score ? Number(away.score) : null,
        status,
        marketSpread: odds?.spread ?? undefined,
        marketTotal: odds?.overUnder ?? undefined,
      },
      create: {
        espnId: event.id,
        season: event.season?.year ?? new Date().getFullYear(),
        week: event.week?.number ?? 1,
        seasonType: event.season?.type ?? 2,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: home.score ? Number(home.score) : null,
        awayScore: away.score ? Number(away.score) : null,
        status,
        startTime: new Date(event.date),
        venue: competition.venue?.fullName,
        marketSpread: odds?.spread,
        marketTotal: odds?.overUnder,
      },
    });
    synced += 1;
  }

  return { synced, ok: true as const };
}
