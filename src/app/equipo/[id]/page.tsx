import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toggleFavoriteTeam } from "@/app/cuenta/actions";

export const metadata = { title: "Equipo — Zona Roja" };

const POSITION_ORDER = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"];

function positionRank(pos: string) {
  const idx = POSITION_ORDER.indexOf(pos);
  return idx === -1 ? POSITION_ORDER.length : idx;
}

export default async function EquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: true,
      homeGames: { include: { awayTeam: true, homeTeam: true }, orderBy: { startTime: "asc" } },
      awayGames: { include: { awayTeam: true, homeTeam: true }, orderBy: { startTime: "asc" } },
    },
  });
  if (!team) notFound();

  const session = await auth();
  const isFavorite = session?.user
    ? Boolean(
        await prisma.favoriteTeam.findUnique({
          where: { userId_teamId: { userId: session.user.id, teamId: team.id } },
        })
      )
    : false;

  const games = [...team.homeGames, ...team.awayGames].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;
  let finalsPlayed = 0;

  for (const g of games) {
    if (g.status !== "FINAL" || g.homeScore == null || g.awayScore == null) continue;
    const isHome = g.homeTeamId === team.id;
    const forScore = isHome ? g.homeScore : g.awayScore;
    const againstScore = isHome ? g.awayScore : g.homeScore;
    pointsFor += forScore;
    pointsAgainst += againstScore;
    finalsPlayed += 1;
    if (forScore > againstScore) wins += 1;
    else if (forScore < againstScore) losses += 1;
    else ties += 1;
  }

  const roster = [...team.players].sort((a, b) => positionRank(a.position) - positionRank(b.position));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="bg-navy text-chalk p-6 mb-8 flex items-center gap-4">
        {team.logoUrl && <Image src={team.logoUrl} alt="" width={64} height={64} unoptimized />}
        <div className="flex-1">
          <p className="text-xs font-display tracking-widest text-chalk/60">
            {team.conference} {team.division}
          </p>
          <h1 className="text-3xl font-display">
            {team.city} {team.name}
          </h1>
        </div>
        {session?.user && (
          <form action={async () => { "use server"; await toggleFavoriteTeam(team.id); }}>
            <button
              className={`btn btn-sm ${isFavorite ? "btn-outline" : "btn-primary"}`}
            >
              {isFavorite ? "★ Siguiendo" : "☆ Seguir equipo"}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="border border-fg/10 bg-surface p-4">
          <p className="stat-num text-3xl font-semibold">
            {wins}-{losses}
            {ties > 0 ? `-${ties}` : ""}
          </p>
          <p className="text-xs text-fg/50 mt-1">Récord</p>
        </div>
        <div className="border border-fg/10 bg-surface p-4">
          <p className="stat-num text-3xl font-semibold">
            {finalsPlayed > 0 ? (pointsFor / finalsPlayed).toFixed(1) : "—"}
          </p>
          <p className="text-xs text-fg/50 mt-1">Puntos anotados / juego</p>
        </div>
        <div className="border border-fg/10 bg-surface p-4">
          <p className="stat-num text-3xl font-semibold">
            {finalsPlayed > 0 ? (pointsAgainst / finalsPlayed).toFixed(1) : "—"}
          </p>
          <p className="text-xs text-fg/50 mt-1">Puntos permitidos / juego</p>
        </div>
        <div className="border border-fg/10 bg-surface p-4">
          <p className="stat-num text-3xl font-semibold">
            {finalsPlayed > 0 ? (pointsFor - pointsAgainst > 0 ? "+" : "") + (pointsFor - pointsAgainst) : "—"}
          </p>
          <p className="text-xs text-fg/50 mt-1">Diferencial de puntos</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-4">Calendario</h2>
        {games.length === 0 ? (
          <p className="text-fg/60">Sin juegos sincronizados todavía para este equipo.</p>
        ) : (
          <div className="space-y-2">
            {games.map((g) => {
              const isHome = g.homeTeamId === team.id;
              const opponent = isHome ? g.awayTeam : g.homeTeam;
              const forScore = isHome ? g.homeScore : g.awayScore;
              const againstScore = isHome ? g.awayScore : g.homeScore;
              const isFinal = g.status === "FINAL" && forScore != null && againstScore != null;
              const result = isFinal ? (forScore! > againstScore! ? "W" : forScore! < againstScore! ? "L" : "T") : null;

              return (
                <Link
                  key={g.id}
                  href={`/partido/${g.espnId}`}
                  className="flex items-center justify-between border border-fg/10 bg-surface px-4 py-3 hover:border-red transition-colors"
                >
                  <span className="text-sm text-fg/50 w-16">Sem {g.week}</span>
                  <span className="font-display flex-1">
                    {isHome ? "vs" : "@"} {opponent.abbreviation}
                  </span>
                  {isFinal ? (
                    <span className="stat-num flex items-center gap-2">
                      <span
                        className={`text-xs font-display px-1.5 py-0.5 ${
                          result === "W" ? "bg-red text-chalk" : result === "L" ? "bg-fg/20" : "bg-surface-alt"
                        }`}
                      >
                        {result}
                      </span>
                      {forScore}-{againstScore}
                    </span>
                  ) : (
                    <span className="text-xs text-fg/50">{g.startTime.toLocaleDateString("es-MX")}</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl mb-4">Roster ({roster.length})</h2>
        {roster.length === 0 ? (
          <p className="text-fg/60">Sin roster sincronizado — se llena al importar stats de jugadores.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {roster.map((p) => (
              <Link
                key={p.id}
                href={`/jugador/${p.id}`}
                className="flex items-center justify-between border border-fg/10 bg-surface px-4 py-2.5 hover:border-red transition-colors"
              >
                <span className="font-semibold text-sm">{p.name}</span>
                <span className="text-xs text-fg/50">{p.position}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
