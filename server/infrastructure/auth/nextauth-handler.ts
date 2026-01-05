import { scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "@/server/infrastructure/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const HASH_PREFIX = "scrypt";

const verifyPassword = (password: string, hashedValue: string): boolean => {
  const [prefix, saltBase64, keyBase64] = hashedValue.split("$");
  if (prefix !== HASH_PREFIX || !saltBase64 || !keyBase64) {
    return false;
  }
  const salt = Buffer.from(saltBase64, "base64");
  const storedKey = Buffer.from(keyBase64, "base64");
  const derivedKey = scryptSync(password, salt, storedKey.length);
  return timingSafeEqual(derivedKey, storedKey);
};

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
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          return null;
        }
        if (!verifyPassword(password, user.passwordHash)) {
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
  session: { strategy: "database" },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export const createNextAuthHandler = () => NextAuth(createAuthOptions());
