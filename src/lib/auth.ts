import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { consumeLoginToken } from "@/lib/login-tokens";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email & mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user?.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          directoryId: user.directoryId,
          companyId: user.companyId,
        };
      },
    }),
    CredentialsProvider({
      id: "magic",
      name: "Lien par email",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        const consumed = await consumeLoginToken(credentials.token);
        if (!consumed) return null;
        const user = await prisma.user.findUnique({ where: { id: consumed.userId } });
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          directoryId: user.directoryId,
          companyId: user.companyId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.directoryId = user.directoryId ?? null;
        token.companyId = user.companyId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as Role;
        session.user.directoryId = (token.directoryId as string | null) ?? null;
        session.user.companyId = (token.companyId as string | null) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function isSuperAdmin(role: Role | undefined): boolean {
  return role === "SUPER_ADMIN";
}

export function canManageDirectory(role: Role | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "DIRECTORY_ADMIN";
}
