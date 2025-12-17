import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.ts", "**/*.{test,spec}.mts"],
    exclude: ["node_modules", ".next", "dist", "coverage"],
  },
});
