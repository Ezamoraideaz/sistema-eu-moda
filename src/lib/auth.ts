import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.activo) return null;

        const passwordValid = await compare(parsed.data.password, user.passwordHash);
        if (!passwordValid) return null;

        return { id: user.id, name: user.nombre, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "OPERARIO" | "RECEPCION";
      }
      return session;
    },
    authorized({ auth, request }) {
      // Route groups (auth)/(dashboard) don't add URL prefixes, so every
      // path except /login and the Auth.js API routes is treated as
      // protected. /api/auth must stay public or sign-in itself breaks.
      const { pathname } = request.nextUrl;
      if (pathname === "/login" || pathname.startsWith("/api/auth")) return true;
      return !!auth?.user;
    },
  },
});
