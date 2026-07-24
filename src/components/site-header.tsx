import Link from "next/link";
import Image from "next/image";
import type { Session } from "next-auth";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

const NAV_LINKS = [
  { href: "/calendario", label: "Calendario" },
  { href: "/resultados", label: "Resultados" },
  { href: "/estadisticas", label: "Estadísticas" },
  { href: "/lideres", label: "Líderes" },
  { href: "/momios", label: "Momios" },
  { href: "/recomendaciones", label: "Picks" },
  { href: "/planes", label: "Planes" },
];

export async function SiteHeader({ session }: { session: Session | null }) {
  const notifications = session?.user
    ? (
        await prisma.notification.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      ).map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))
    : [];

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-navy text-chalk">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo-light-v2.png"
              alt="Zona Roja"
              width={222}
              height={32}
              priority
              className="h-8 w-auto"
              style={{ width: "auto", height: "2rem" }}
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-display text-sm tracking-wider">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-red transition-colors">
                {link.label}
              </Link>
            ))}
            {session?.user.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-red transition-colors text-yellow-400">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <form action="/buscar" className="hidden lg:block">
              <input
                name="q"
                placeholder="Buscar equipo o jugador..."
                className="bg-navy-dark text-chalk placeholder:text-chalk/40 text-sm px-3 py-1.5 w-48 focus:w-64 transition-all border border-chalk/10 focus:border-red outline-none"
              />
            </form>
            <ThemeToggle />
            {session?.user && <NotificationBell notifications={notifications} />}
            {session?.user ? (
              <>
                <Link
                  href="/cuenta"
                  className="hidden sm:inline text-sm font-semibold hover:text-red transition-colors"
                >
                  {session.user.name ?? session.user.email}
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button className="btn btn-outline btn-sm">Salir</button>
                </form>
              </>
            ) : (
              <Link href="/ingresar" className="btn btn-primary btn-sm">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
      <nav className="md:hidden flex items-center gap-4 overflow-x-auto bg-navy-dark text-chalk px-4 py-2 font-display text-xs tracking-wider">
        <Link href="/buscar" className="whitespace-nowrap hover:text-red transition-colors">
          Buscar
        </Link>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-red transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="hash-divider" />
    </header>
  );
}
