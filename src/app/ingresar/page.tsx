import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { loginWithProvider, loginWithCredentials } from "./actions";

export const metadata = { title: "Ingresar — Zona Roja" };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5c-2 1.5-4.6 2.6-7.6 2.6-5.2 0-9.6-3.3-11.2-8L6 32.6C9.3 39.4 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5C40.9 36.6 44 30.9 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.475 2.235-1.22 3.02-.81.865-2.13 1.53-3.19 1.44-.13-1.08.43-2.24 1.19-3.02.83-.87 2.29-1.51 3.22-1.44zM20.5 17.32c-.53 1.22-.78 1.76-1.46 2.84-.95 1.5-2.28 3.37-3.94 3.38-1.47.02-1.85-.96-3.85-.95-2 .01-2.42.97-3.9.96-1.65-.02-2.92-1.71-3.87-3.2C1 16.62.55 12.1 2.36 9.35c1.16-1.76 2.98-2.79 4.7-2.79 1.75 0 2.86.97 4.32.97 1.4 0 2.27-.97 4.31-.97 1.5 0 3.1.82 4.24 2.24-3.73 2.05-3.12 7.4.57 8.52z" />
    </svg>
  );
}

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID);
  const hasApple = Boolean(process.env.AUTH_APPLE_ID);

  return (
    <AuthShell>
      <h1 className="text-3xl mb-8">Ingresar</h1>

      {error && (
        <p className="bg-red/10 text-red text-sm px-4 py-3 mb-6 border border-red/30">
          Correo o contraseña incorrectos.
        </p>
      )}

      {(hasGoogle || hasApple) && (
        <div className="flex flex-col gap-3 mb-6">
          {hasGoogle && (
            <form action={async () => { "use server"; await loginWithProvider("google"); }}>
              <button className="flex w-full items-center justify-center gap-3 border border-fg/20 py-3 font-semibold hover:border-navy hover:bg-fg/[0.03] transition-colors">
                <GoogleIcon /> Continuar con Google
              </button>
            </form>
          )}
          {hasApple && (
            <form action={async () => { "use server"; await loginWithProvider("apple"); }}>
              <button className="flex w-full items-center justify-center gap-3 bg-ink text-chalk py-3 font-semibold hover:bg-black transition-colors">
                <AppleIcon /> Continuar con Apple
              </button>
            </form>
          )}
        </div>
      )}

      {(hasGoogle || hasApple) && (
        <div className="flex items-center gap-3 my-6 text-xs text-fg/40">
          <div className="flex-1 h-px bg-fg/10" />O<div className="flex-1 h-px bg-fg/10" />
        </div>
      )}

      <form action={loginWithCredentials} className="flex flex-col gap-3">
        <input name="email" type="email" required placeholder="Correo" className="border border-fg/20 px-3 py-2.5 bg-surface" />
        <input name="password" type="password" required placeholder="Contraseña" className="border border-fg/20 px-3 py-2.5 bg-surface" />
        <button type="submit" className="btn btn-dark w-full">
          Entrar
        </button>
      </form>

      <p className="text-sm text-fg/60 mt-8 text-center">¿No tienes cuenta?</p>
      <Link href="/registro" className="btn btn-outline-dark w-full mt-2">
        Regístrate
      </Link>
    </AuthShell>
  );
}
