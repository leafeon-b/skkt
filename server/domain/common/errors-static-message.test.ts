import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * DomainError のメッセージ引数に動的データが埋め込まれていないことを検証する。
 *
 * テンプレートリテラル（`）や文字列結合（+）がメッセージに含まれると、
 * ユーザー入力がエラーメッセージに混入するリスクがある。
 * このテストは将来の回帰を防止する。
 */

const SERVER_DIR = path.resolve(__dirname, "../..");

const TARGET_ERROR_CLASSES = [
  "BadRequestError",
  "ForbiddenError",
  "ConflictError",
  "TooManyRequestsError",
];

const THROW_PATTERN = new RegExp(
  `throw\\s+new\\s+(${TARGET_ERROR_CLASSES.join("|")})\\(`,
);

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...collectTsFiles(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

function isExcluded(filePath: string): boolean {
  const relativePath = path.relative(SERVER_DIR, filePath);
  return (
    relativePath === "domain/common/errors.ts" ||
    relativePath === "domain/common/validation.ts"
  );
}

describe("DomainError メッセージの静的検証", () => {
  it("throw new XxxError(...) のメッセージにテンプレートリテラルや文字列結合が使われていない", () => {
    const violations: { file: string; line: number; content: string }[] = [];

    const tsFiles = collectTsFiles(SERVER_DIR).filter(
      (f) => !isExcluded(f),
    );

    for (const filePath of tsFiles) {
      const lines = fs.readFileSync(filePath, "utf-8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!THROW_PATTERN.test(line)) continue;

        // テンプレートリテラルまたは文字列結合を検出
        const matchResult = line.match(THROW_PATTERN);
        if (!matchResult) continue;
        const throwIndex = matchResult.index! + matchResult[0].length - 1;
        const afterThrow = line.slice(throwIndex);
        if (afterThrow.includes("`") || /["']\s*\+|\+\s*["']/.test(afterThrow)) {
          violations.push({
            file: path.relative(SERVER_DIR, filePath),
            line: i + 1,
            content: line.trim(),
          });
        }
      }
    }

    if (violations.length > 0) {
      const details = violations
        .map((v) => `  ${v.file}:${v.line}  ${v.content}`)
        .join("\n");
      expect.fail(
        `DomainError のメッセージに動的データが含まれています:\n${details}`,
      );
    }
  });
});
