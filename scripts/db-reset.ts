import "dotenv/config";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to reset the database.");
  process.exit(1);
}

const allowOverride =
  process.env.ALLOW_DB_RESET === "1" || process.env.ALLOW_DB_RESET === "true";
const isLocal =
  databaseUrl.startsWith("file:") ||
  databaseUrl.includes("localhost") ||
  databaseUrl.includes("127.0.0.1");

if (process.env.NODE_ENV === "production" && !allowOverride) {
  console.error("Refusing to reset the database in production.");
  process.exit(1);
}

if (!isLocal && !allowOverride) {
  console.error(
    "Refusing to reset a non-local database. Set ALLOW_DB_RESET=1 to override.",
  );
  process.exit(1);
}

const runner = process.platform === "win32" ? "npx.cmd" : "npx";

const run = (args: string[]) => {
  const result = spawnSync(runner, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run(["prisma", "db", "push", "--force-reset"]);
run(["prisma", "db", "seed"]);
