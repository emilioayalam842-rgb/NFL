import { prisma } from "@/lib/prisma";
import { teamForm, recommendSpread, recommendMoneyline, recommendTotal, recommendPlayerProp } from "./engine";

const RECENT_GAMES_WINDOW = 5;

async function recentForm(teamId: string, beforeDate: Date) {
  const games = await prisma.game.findMany({
    where: {
      status: "FINAL",
      startTime: { lt: beforeDate },
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    orderBy: { startTime: "desc" },
    take: RECENT_GAMES_WINDOW,
  });

  const points = games.map((g) => {
    const isHome = g.homeTeamId === teamId;
    const pointsFor = (isHome ? g.homeScore : g.awayScore) ?? 0;
    const pointsAgainst = (isHome ? g.awayScore : g.homeScore) ?? 0;
    return { pointsFor, pointsAgainst };
  });

  return teamForm(points);
}

/**
 * Builds SPREAD/MONEYLINE/TOTAL recommendations for one upcoming game from
 * recent team form in the local DB, plus PLAYER_PROP recs for its skill
 * players. Recommendations are created unpublished — an admin reviews and
 * publishes them before subscribers see them.
 */
export async function generateRecommendationsForGame(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!game) throw new Error("Juego no encontrado");

  const [homeForm, awayForm] = await Promise.all([
    recentForm(game.homeTeamId, game.startTime),
    recentForm(game.awayTeamId, game.startTime),
  ]);

  const created = [];

  if (game.marketSpread != null) {
    const spreadPick = recommendSpread(game.homeTeam.name, game.awayTeam.name, homeForm, awayForm, game.marketSpread);
    created.push(
      await prisma.recommendation.create({
        data: {
          gameId,
          type: "SPREAD",
          subject: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
          line: game.marketSpread,
          ...spreadPick,
        },
      })
    );
  }

  const mlPick = recommendMoneyline(game.homeTeam.name, game.awayTeam.name, homeForm, awayForm);
  created.push(
    await prisma.recommendation.create({
      data: {
        gameId,
        type: "MONEYLINE",
        subject: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
        ...mlPick,
      },
    })
  );

  if (game.marketTotal != null) {
    const totalPick = recommendTotal(homeForm, awayForm, game.marketTotal);
    created.push(
      await prisma.recommendation.create({
        data: {
          gameId,
          type: "TOTAL",
          subject: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
          line: game.marketTotal,
          ...totalPick,
        },
      })
    );
  }

  // Player props: skill players on both rosters with at least 2 recent stat lines.
  const players = await prisma.player.findMany({
    where: {
      teamId: { in: [game.homeTeamId, game.awayTeamId] },
      position: { in: ["QB", "RB", "WR", "TE"] },
    },
    include: {
      stats: {
        where: { game: { status: "FINAL", startTime: { lt: game.startTime } } },
        orderBy: { game: { startTime: "desc" } },
        take: RECENT_GAMES_WINDOW,
      },
    },
  });

  const statByPosition: Record<string, { field: keyof (typeof players)[number]["stats"][number]; label: string; line: number }> = {
    QB: { field: "passingYards", label: "yardas de pase", line: 249.5 },
    RB: { field: "rushingYards", label: "yardas por tierra", line: 59.5 },
    WR: { field: "receivingYards", label: "yardas de recepción", line: 54.5 },
    TE: { field: "receivingYards", label: "yardas de recepción", line: 34.5 },
  };

  for (const player of players) {
    const config = statByPosition[player.position];
    if (!config) continue;

    const values = player.stats
      .map((s) => s[config.field] as number | null)
      .filter((v): v is number => v != null);

    const propPick = recommendPlayerProp(player.name, config.label, values, config.line);
    if (!propPick) continue;

    created.push(
      await prisma.recommendation.create({
        data: {
          gameId,
          type: "PLAYER_PROP",
          subject: player.name,
          line: config.line,
          ...propPick,
        },
      })
    );
  }

  return created;
}

/**
 * Runs generateRecommendationsForGame for every game in a week that doesn't
 * already have any recommendations, so an admin doesn't have to click
 * "Generar picks" one game at a time.
 */
export async function generateRecommendationsForWeek(week: number) {
  const games = await prisma.game.findMany({
    where: { week, status: { not: "FINAL" }, recommendations: { none: {} } },
    select: { id: true },
  });

  let gamesProcessed = 0;
  let picksCreated = 0;
  for (const g of games) {
    const created = await generateRecommendationsForGame(g.id);
    gamesProcessed += 1;
    picksCreated += created.length;
  }

  return { gamesProcessed, picksCreated };
}
