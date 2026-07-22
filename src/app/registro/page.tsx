"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth-shell";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo crear tu cuenta.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Cuenta creada, pero no se pudo iniciar sesión automáticamente. Intenta ingresar.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="text-3xl mb-8">Crear cuenta</h1>

      {error && (
        <p className="bg-red/10 text-red text-sm px-4 py-3 mb-6 border border-red/30">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input name="name" required placeholder="Nombre" className="border border-ink/20 px-3 py-2.5 bg-chalk" />
        <input name="email" type="email" required placeholder="Correo" className="border border-ink/20 px-3 py-2.5 bg-chalk" />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Contraseña (mín. 8 caracteres)"
          className="border border-ink/20 px-3 py-2.5 bg-chalk"
        />
        <button type="submit" disabled={loading} className="btn btn-dark w-full disabled:opacity-50">
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-8 text-center">¿Ya tienes cuenta?</p>
      <Link href="/ingresar" className="btn btn-outline-dark w-full mt-2">
        Ingresa
      </Link>
    </AuthShell>
  );
}
