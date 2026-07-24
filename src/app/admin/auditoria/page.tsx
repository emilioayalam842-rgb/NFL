import { prisma } from "@/lib/prisma";

const ACTION_LABEL: Record<string, string> = {
  update_game_odds: "Editó momios",
  add_player_prop: "Agregó prop",
  delete_player_prop: "Eliminó prop",
  add_odds_quote: "Agregó cotización",
  delete_odds_quote: "Eliminó cotización",
};

export default async function AdminAuditoriaPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h2 className="text-xl mb-2">Auditoría de momios</h2>
      <p className="text-sm text-fg/60 mb-6 max-w-2xl">
        Quién capturó o editó cada momio/prop y cuándo — útil si más de una persona tiene acceso al
        panel de admin.
      </p>

      {logs.length === 0 ? (
        <p className="text-fg/60">Sin actividad registrada todavía.</p>
      ) : (
        <div className="overflow-x-auto border border-fg/10">
          <table className="w-full text-sm">
            <thead className="bg-navy text-chalk font-display tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Admin</th>
                <th className="text-left px-4 py-3">Acción</th>
                <th className="text-left px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={l.id} className={i % 2 ? "bg-surface" : "bg-surface-alt"}>
                  <td className="px-4 py-2 text-xs text-fg/60 whitespace-nowrap">
                    {l.createdAt.toLocaleString("es-MX")}
                  </td>
                  <td className="px-4 py-2">{l.user.name ?? l.user.email}</td>
                  <td className="px-4 py-2">{ACTION_LABEL[l.action] ?? l.action}</td>
                  <td className="px-4 py-2 text-fg/70">{l.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
