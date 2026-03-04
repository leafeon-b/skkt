import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "generated/**",
    // Ignore repository metadata and CI configs — lint only application code
    ".github/**",
  ]),

  // ─── Clean Architecture Layer Boundaries ───
  //
  //   presentation → application → domain ← infrastructure
  //
  //   - domain:         innermost — imports nothing from other server layers
  //   - application:    imports domain only
  //   - presentation:   imports application / domain only
  //   - infrastructure: imports domain only
  //

  // domain: no importing presentation, application, infrastructure, app
  {
    files: ["server/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/server/presentation/**",
            "@/server/application/**",
            "@/server/infrastructure/**",
            "@/app/**",
            "app/**",
          ],
        },
      ],
    },
  },

  // application: no importing presentation, infrastructure
  {
    files: ["server/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/presentation/**", "@/server/infrastructure/**"],
        },
      ],
    },
  },
  // application exceptions: test files
  {
    files: ["server/application/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },

  // presentation: no importing infrastructure
  {
    files: ["server/presentation/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/infrastructure/**"],
        },
      ],
    },
  },
  // presentation/providers: infrastructure 層の直接利用を禁止
  {
    files: ["server/presentation/providers/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/infrastructure/**"],
        },
      ],
    },
  },
  // presentation exceptions: test files (リポジトリモックのためinfrastructure層のServiceContainerDepsを参照)
  {
    files: [
      "server/presentation/**/*.test.{ts,tsx}",
      "server/presentation/**/__tests__/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // presentation exceptions: context.ts (DI composition root for tRPC)
  {
    files: ["server/presentation/trpc/context.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // infrastructure: no importing presentation, application
  {
    files: ["server/infrastructure/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/presentation/**", "@/server/application/**"],
        },
      ],
    },
  },
  // infrastructure exception: service-container (DI composition root) — 全レイヤの具象実装を参照する
  {
    files: [
      "server/infrastructure/service-container.ts",
      "server/infrastructure/service-container.test.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // app (frontend): no importing infrastructure
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/infrastructure/**"],
        },
      ],
    },
  },
  // app exceptions: auth routes, layouts (direct auth handler access)
  {
    files: [
      "app/api/auth/**/route.ts",
      "app/(authenticated)/layout.tsx",
      "app/(public)/layout.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
