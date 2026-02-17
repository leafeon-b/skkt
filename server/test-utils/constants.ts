import { resolve } from "node:path";

export const TEST_SCHEMA_SQL_PATH = resolve(
  process.cwd(),
  "tmp/test-schema.sql",
);
