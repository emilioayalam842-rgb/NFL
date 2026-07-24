import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Buscar — Zona Roja" };

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [teams, players] =
    query.length > 0
      ? await Promise.all([
          prisma.team.findMany({
            where: {
              OR: [
                { name: { contains: query } },
                { city: { contains: query } },
                { abbreviation: { contains: query } },
              ],
            },
            take: 20,
          }),
          prisma.player.findMany({
            where: { name: { contains: query } },
            include: { team: true },
            take: 20,
          }),
        ])
      : [[], []];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl mb-2">Buscar</h1>

      <form className="mb-8">
        <input
          name="q"
          defaultValue={query}
          placeholder="Equipo o jugador..."
          className="w-full border border-fg/20 bg-surface px-4 py-3 text-lg"
          autoFocus
        />
      </form>

      {query.length === 0 ? (
        <p className="text-fg/60">Escribe el nombre de un equipo o jugador.</p>
      ) : teams.length === 0 && players.length === 0 ? (
        <p className="text-fg/60">Sin resultados para &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="space-y-8">
          {teams.length > 0 && (
            <section>
              <p className="font-display text-sm tracking-wide text-red mb-3">EQUIPOS</p>
              <div className="space-y-2">
                {teams.map((t) => (
                  <Link
                    key={t.id}
                    href={`/equipo/${t.id}`}
                    className="flex items-center justify-between border border-fg/10 bg-surface px-4 py-3 hover:border-red transition-colors"
                  >
                    <span className="font-semibold">
                      {t.city} {t.name}
                    </span>
                    <span className="text-xs text-fg/50">{t.abbreviation}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {players.length > 0 && (
            <section>
              <p className="font-display text-sm tracking-wide text-red mb-3">JUGADORES</p>
              <div className="space-y-2">
                {players.map((p) => (
                  <Link
                    key={p.id}
                    href={`/jugador/${p.id}`}
                    className="flex items-center justify-between border border-fg/10 bg-surface px-4 py-3 hover:border-red transition-colors"
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-xs text-fg/50">
                      {p.position} {p.team ? `· ${p.team.abbreviation}` : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
