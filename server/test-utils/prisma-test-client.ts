import { PGlite } from "@electric-sql/pglite";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { readFileSync } from "node:fs";

import { TEST_SCHEMA_SQL_PATH } from "./constants";

export function getSchemaSql(): string {
  return readFileSync(TEST_SCHEMA_SQL_PATH, "utf-8");
}

export type TestPrismaContext = {
  prisma: PrismaClient;
  pglite: PGlite;
};

/**
 * Create an in-memory PGlite-backed PrismaClient for integration testing.
 * Call `teardown()` in afterAll to clean up resources.
 */
export async function setupTestPrisma(): Promise<TestPrismaContext> {
  const pglite = new PGlite({ dataDir: "memory://" });
  await pglite.exec(getSchemaSql());

  const adapter = new PrismaPGlite(pglite);
  const prisma = new PrismaClient({ adapter }) as PrismaClient;

  return { prisma, pglite };
}

export async function teardownTestPrisma(ctx: TestPrismaContext): Promise<void> {
  await ctx.prisma.$disconnect();
  await ctx.pglite.close();
}

/**
 * Truncate all user-defined tables (excluding Prisma internals).
 */
export async function truncateAllTables(pglite: PGlite): Promise<void> {
  const result = await pglite.query<{ tablename: string }>(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE '_prisma%'
    ORDER BY tablename;
  `);

  const tableNames = result.rows.map((row) => row.tablename);
  if (tableNames.length > 0) {
    await pglite.exec(`
      SET session_replication_role = replica;
      TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(", ")} RESTART IDENTITY CASCADE;
      SET session_replication_role = DEFAULT;
    `);
  }
}
