import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/enums";

const credentialsSchema = z.object({
  username: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/connexion" },
  providers: [
    Credentials({
      name: "Identifiant et mot de passe",
      credentials: {
        username: { label: "Identifiant", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { username: parsed.data.username.toLowerCase() },
        });

        if (!user?.isActive) return null;

        const passwordIsValid = await compare(parsed.data.password, user.passwordHash);
        if (!passwordIsValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id);
      session.user.username = String(token.username);
      session.user.role = token.role as UserRole;
      return session;
    },
    authorized({ auth: session, request }) {
      const isAuthenticated = Boolean(session?.user);
      const isLoginPage = request.nextUrl.pathname.startsWith("/connexion");

      if (isLoginPage && isAuthenticated) {
        return Response.redirect(new URL("/tableau-de-bord", request.nextUrl));
      }

      return isLoginPage || isAuthenticated;
    },
  },
});
