// PrismaAdapter が NextAuth のアダプタ要件として prisma を直接必要とするため、この import のみリポジトリ抽象化の対象外
import { prisma } from "@/server/infrastructure/db";
import { verifyPassword } from "@/server/infrastructure/auth/password";
import { userId } from "@/server/domain/common/ids";
import type { RateLimiter } from "@/server/application/common/rate-limiter";
import { TooManyRequestsError } from "@/server/domain/common/errors";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const isDebug = process.env.NODE_ENV !== "production";

export type AuthDeps = {
  userRepository: UserRepository;
  loginRateLimiter: RateLimiter;
};

export const createAuthOptions = (deps: AuthDeps): AuthOptions => ({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) {
          if (isDebug) {
            console.warn("[auth] credentials missing email or password");
          }
          return null;
        }

        try {
          deps.loginRateLimiter.check(email);
        } catch (e) {
          if (e instanceof TooManyRequestsError) {
            if (isDebug) {
              console.warn("[auth] rate limited", { email });
            }
            return null;
          }
          throw e;
        }

        const user = await deps.userRepository.findByEmail(email);
        if (!user) {
          if (isDebug) {
            console.warn("[auth] credentials user not found", { email });
          }
          deps.loginRateLimiter.recordFailure(email);
          return null;
        }
        const passwordHash =
          await deps.userRepository.findPasswordHashById(user.id);
        if (!passwordHash) {
          if (isDebug) {
            console.warn("[auth] credentials user missing password hash", {
              email,
            });
          }
          deps.loginRateLimiter.recordFailure(email);
          return null;
        }
        if (!verifyPassword(password, passwordHash)) {
          if (isDebug) {
            console.warn("[auth] credentials password mismatch", { email });
          }
          deps.loginRateLimiter.recordFailure(email);
          return null;
        }
        deps.loginRateLimiter.reset(email);
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

      const rawUserId = (token.id ?? token.sub) as string | undefined;
      if (!rawUserId) {
        return {} as typeof token;
      }

      if (token.iat) {
        try {
          const passwordChangedAt =
            await deps.userRepository.findPasswordChangedAt(
              userId(rawUserId),
            );
          if (passwordChangedAt) {
            const changedAtSec = Math.floor(
              passwordChangedAt.getTime() / 1000,
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

export const createNextAuthHandler = (deps: AuthDeps) =>
  NextAuth(createAuthOptions(deps));
