import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { TEST_SCHEMA_SQL_PATH } from "./constants";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");

export async function setup() {
  mkdirSync(dirname(TEST_SCHEMA_SQL_PATH), { recursive: true });
  execSync(
    `npx prisma migrate diff --from-empty --to-schema ${schemaPath} --script > ${TEST_SCHEMA_SQL_PATH}`,
    { stdio: ["pipe", "pipe", "pipe"] },
  );
}
