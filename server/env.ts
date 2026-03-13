import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  UNSUBSCRIBE_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(1).optional(),
  BASE_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_CONTACT_FORM_URL: z.string().url().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadEnv(): ServerEnv {
  if (process.env.VITEST) {
    return process.env as unknown as ServerEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    throw new Error(
      `Environment variable validation failed:\n${JSON.stringify(formatted, null, 2)}`,
    );
  }

  const isBuilding = process.env.NEXT_PHASE === "phase-production-build";

  if (
    !isBuilding &&
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview" &&
    !parsed.data.NEXTAUTH_URL?.trim()
  ) {
    throw new Error(
      "NEXTAUTH_URL environment variable is required in production",
    );
  }

  return parsed.data;
}

export const env = loadEnv();
