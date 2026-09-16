/// <reference types="vitest" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Mirrors the `@/*` -> `./src/*` mapping in tsconfig.json. Without it any
  // test importing a module by its `@/` path fails to resolve.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
  },
})