import Link from "next/link";
import type { DisplayGame } from "@/lib/espn/format";

function statusBadge(game: DisplayGame) {
  if (game.status === "FINAL") return { text: "FINAL", cls: "bg-ink text-chalk" };
  if (game.status === "IN_PROGRESS") return { text: "EN VIVO", cls: "bg-red text-chalk animate-pulse" };
  return { text: new Date(game.kickoff).toLocaleString("es-MX", { weekday: "short", hour: "numeric", minute: "2-digit" }), cls: "bg-surface-alt text-fg" };
}

export function GameCard({ game }: { game: DisplayGame }) {
  const badge = statusBadge(game);
  const isRealEvent = /^\d+$/.test(game.id);

  const content = (
    <div className="relative bg-navy text-chalk border border-navy-dark overflow-hidden h-full">
      <div className="absolute top-0 right-0 h-full w-2 bg-red" />
      <div className="p-4 pr-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-display tracking-widest text-chalk/60">
            SEMANA {game.week || "—"}
          </span>
          <span className={`text-[11px] font-display tracking-wider px-2 py-0.5 ${badge.cls}`}>
            {badge.text}
          </span>
        </div>

        <TeamRow name={game.away.abbr} score={game.away.score} />
        <TeamRow name={game.home.abbr} score={game.home.score} />

        {game.odds && (
          <p className="mt-3 text-xs text-chalk/60 font-display tracking-wide">{game.odds}</p>
        )}
      </div>
    </div>
  );

  if (!isRealEvent) return content;

  return (
    <Link href={`/partido/${game.id}`} className="block hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
}

function TeamRow({ name, score }: { name: string; score?: number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-display text-xl tracking-wide">{name}</span>
      <span className="stat-num text-xl font-semibold">{score ?? "-"}</span>
    </div>
  );
}
