import { prisma } from "@/lib/prisma";
import { toggleUserRole } from "../actions";

export default async function AdminUsuariosPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { subscriptions: { where: { status: "ACTIVE" } } },
  });

  return (
    <div>
      <h2 className="text-xl mb-6">Usuarios</h2>
      <div className="overflow-x-auto border border-ink/10">
        <table className="w-full text-sm">
          <thead className="bg-navy text-chalk font-display tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Correo</th>
              <th className="text-left px-4 py-3">Rol</th>
              <th className="text-left px-4 py-3">Suscripción activa</th>
              <th className="text-left px-4 py-3">Auto-exclusión</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={i % 2 ? "bg-chalk" : "bg-cream-dim"}>
                <td className="px-4 py-2">{u.name ?? "—"}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">{u.subscriptions.length > 0 ? "Sí" : "No"}</td>
                <td className="px-4 py-2">
                  {u.selfExcludedUntil && u.selfExcludedUntil > new Date()
                    ? `hasta ${u.selfExcludedUntil.toLocaleDateString("es-MX")}`
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  <form action={async () => { "use server"; await toggleUserRole(u.id); }}>
                    <button className="border border-ink/20 px-2 py-1 text-xs hover:border-navy">
                      {u.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
