import Link from "next/link";

const ADMIN_NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/juegos", label: "Juegos" },
  { href: "/admin/momios", label: "Momios" },
  { href: "/admin/recomendaciones", label: "Picks" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-2 mb-8">
        <span className="bg-red text-chalk text-[11px] font-display tracking-widest px-2 py-1">ADMIN</span>
        <h1 className="text-2xl">Panel de administración</h1>
      </div>
      <nav className="flex gap-6 border-b border-fg/10 mb-8 font-display text-sm tracking-wide">
        {ADMIN_NAV.map((link) => (
          <Link key={link.href} href={link.href} className="pb-3 hover:text-red transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
