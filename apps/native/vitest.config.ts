import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit tests for the pure logic in `features/` — question grading, contract
 * normalisation and prompt parsing. These modules import types only, so they
 * run under plain node without a React Native runtime.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["features/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
