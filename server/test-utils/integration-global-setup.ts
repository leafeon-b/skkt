import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outputPath = resolve(process.cwd(), "tmp/test-schema.sql");
const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");

export async function setup() {
  mkdirSync(resolve(process.cwd(), "tmp"), { recursive: true });
  execSync(
    `npx prisma migrate diff --from-empty --to-schema ${schemaPath} --script > ${outputPath}`,
    { stdio: ["pipe", "pipe", "pipe"] },
  );
}
