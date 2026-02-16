import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules", ".next", "dist", "coverage"],
    globalSetup: "./server/test-utils/integration-global-setup.ts",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
