import { prisma } from "@/server/infrastructure/db";
import { verifyPassword } from "@/server/infrastructure/auth/password";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const isDebug = process.env.NODE_ENV !== "production";

export const createAuthOptions = (): AuthOptions => ({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;
        if (!email || !password) {
          if (isDebug) {
            console.warn("[auth] credentials missing email or password");
          }
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
          },
        });
        if (!user) {
          if (isDebug) {
            console.warn("[auth] credentials user not found", { email });
          }
          return null;
        }
        if (!user.passwordHash) {
          if (isDebug) {
            console.warn("[auth] credentials user missing password hash", {
              email,
            });
          }
          return null;
        }
        if (!verifyPassword(password, user.passwordHash)) {
          if (isDebug) {
            console.warn("[auth] credentials password mismatch", { email });
          }
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  debug: isDebug,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.iat = Math.floor(Date.now() / 1000);
        return token;
      }

      const userId = (token.id ?? token.sub) as string | undefined;
      if (!userId) {
        return {} as typeof token;
      }

      if (token.iat) {
        try {
          const found = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordChangedAt: true },
          });
          if (found?.passwordChangedAt) {
            const changedAtSec = Math.floor(
              found.passwordChangedAt.getTime() / 1000,
            );
            if (changedAtSec > (token.iat as number)) {
              return {} as typeof token;
            }
          }
        } catch {
          // Fail open: DB障害時は既存セッションを維持する
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = (token.id ?? token.sub) as string;
      }
      return session;
    },
  },
});

export const createNextAuthHandler = () => NextAuth(createAuthOptions());
