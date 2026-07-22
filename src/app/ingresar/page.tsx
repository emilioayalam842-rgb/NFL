import Link from "next/link";
import { loginWithProvider, loginWithCredentials } from "./actions";

export const metadata = { title: "Ingresar — Zona Roja" };

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID);
  const hasApple = Boolean(process.env.AUTH_APPLE_ID);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-3xl mb-8">Ingresar</h1>

      {error && (
        <p className="bg-red/10 text-red text-sm px-4 py-3 mb-6 border border-red/30">
          Correo o contraseña incorrectos.
        </p>
      )}

      <div className="flex flex-col gap-3 mb-8">
        {hasGoogle && (
          <form action={async () => { "use server"; await loginWithProvider("google"); }}>
            <button className="w-full border border-ink/20 py-3 font-semibold hover:border-navy transition-colors">
              Continuar con Google
            </button>
          </form>
        )}
        {hasApple && (
          <form action={async () => { "use server"; await loginWithProvider("apple"); }}>
            <button className="w-full border border-ink/20 py-3 font-semibold hover:border-navy transition-colors">
              Continuar con Apple
            </button>
          </form>
        )}
      </div>

      {(hasGoogle || hasApple) && (
        <div className="flex items-center gap-3 my-6 text-xs text-ink/40">
          <div className="flex-1 h-px bg-ink/10" />O<div className="flex-1 h-px bg-ink/10" />
        </div>
      )}

      <form action={loginWithCredentials} className="flex flex-col gap-3">
        <input name="email" type="email" required placeholder="Correo" className="border border-ink/20 px-3 py-2.5 bg-chalk" />
        <input name="password" type="password" required placeholder="Contraseña" className="border border-ink/20 px-3 py-2.5 bg-chalk" />
        <button type="submit" className="bg-navy text-chalk py-3 font-display tracking-wide hover:bg-navy-dark transition-colors">
          Entrar
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-red font-semibold">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
