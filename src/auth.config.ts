import type { NextAuthConfig } from "next-auth";

// Routes that require an authenticated session.
const protectedPrefixes = ["/cuenta", "/suscripcion", "/recomendaciones", "/admin"];
const adminPrefixes = ["/admin"];

export const authConfig = {
  pages: {
    signIn: "/ingresar",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
      const isAdminRoute = adminPrefixes.some((p) => pathname.startsWith(p));

      if (!isProtected) return true;
      if (!auth?.user) return false;
      if (isAdminRoute && auth.user.role !== "ADMIN") return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
  providers: [], // extended in auth.ts (edge middleware can't use the Prisma/Node providers)
} satisfies NextAuthConfig;
