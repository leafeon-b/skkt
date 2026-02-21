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
          patterns: [
            "@/server/presentation/**",
            "@/server/infrastructure/**",
          ],
        },
      ],
    },
  },
  // application exceptions: service-container (DI composition root), test files
  {
    files: ["server/application/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["server/application/service-container.ts"],
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
  // presentation exceptions: context.ts (DI composition root for tRPC)
  {
    files: ["server/presentation/trpc/context.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // TODO: #455 — holiday provider の DI 化後に削除
  {
    files: [
      "server/presentation/providers/home-provider.ts",
      "server/presentation/providers/circle-overview-provider.ts",
      "server/presentation/trpc/routers/holiday.ts",
    ],
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
          patterns: [
            "@/server/presentation/**",
            "@/server/application/**",
          ],
        },
      ],
    },
  },
  // infrastructure exception: application/common（port 定義 — RateLimiter, UnitOfWork）の import を許可
  {
    files: [
      "server/infrastructure/rate-limit/**/*.{ts,tsx}",
      "server/infrastructure/transaction/**/*.{ts,tsx}",
      "server/infrastructure/auth/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/presentation/**"],
        },
      ],
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
