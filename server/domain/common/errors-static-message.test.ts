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
  `throw\\s+new\\s+(${TARGET_ERROR_CLASSES.join("|")})(\\([^)]*\\))`,
  "gs",
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

// allowlist: throw new XxxError(...) の引数部分として許可するパターン
const COMMON_ALLOWED_PATTERNS = [
  // 引数なし: XxxError()
  /^\(\s*\)/,
  // 静的文字列リテラルのみ: XxxError("msg") or XxxError('msg')（末尾カンマ許容）
  /^\(\s*["'][^"']*["']\s*,?\s*\)/,
];

// TooManyRequestsError 専用: 第1引数が数値/変数
const TOO_MANY_REQUESTS_PATTERNS = [
  // 第1引数が数値/変数のみ: TooManyRequestsError(retryAfterMs)
  /^\(\s*[^"'`),]+\s*,?\s*\)/,
  // 第1引数が数値/変数 + 第2引数が静的文字列: TooManyRequestsError(retryAfterMs, "msg")
  /^\(\s*[^"'`),]+,\s*["'][^"']*["']\s*,?\s*\)/,
];

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function isAllowedArgs(argsStr: string, errorClass: string): boolean {
  if (COMMON_ALLOWED_PATTERNS.some((pattern) => pattern.test(argsStr))) {
    return true;
  }
  if (errorClass === "TooManyRequestsError") {
    return TOO_MANY_REQUESTS_PATTERNS.some((pattern) => pattern.test(argsStr));
  }
  return false;
}

describe("DomainError メッセージの静的検証", () => {
  it("throw new XxxError(...) の引数が静的文字列リテラルまたはデフォルト引数のみであること", () => {
    const violations: { file: string; line: number; content: string }[] = [];

    const tsFiles = collectTsFiles(SERVER_DIR).filter(
      (f) => !isExcluded(f),
    );

    for (const filePath of tsFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const match of content.matchAll(THROW_PATTERN)) {
        const errorClass = match[1];
        const argsStr = match[2];

        if (!isAllowedArgs(argsStr, errorClass)) {
          const line = getLineNumber(content, match.index!);
          violations.push({
            file: path.relative(SERVER_DIR, filePath),
            line,
            content: match[0].replace(/\s+/g, " ").trim(),
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
