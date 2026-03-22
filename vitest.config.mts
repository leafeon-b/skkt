import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.mts"],
    include: [
      "**/*.{test,spec}.ts",
      "**/*.{test,spec}.mts",
      "**/*.{test,spec}.tsx",
    ],
    env: {
      TZ: "Asia/Tokyo",
    },
    exclude: [
      ...configDefaults.exclude,
      ".next",
      "dist",
      "coverage",
      "**/*.integration.test.*",
      "e2e",
    ],
  },
});
