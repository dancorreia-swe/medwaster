/// <reference types="vitest" />
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Component tests render real JSX, so they need the React transform.
  plugins: [react()],
  // Mirrors the `@/*` -> `./src/*` mapping in tsconfig.json, which test
  // mocks such as `vi.mock("@/lib/auth-client")` rely on.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // src/test/setup.ts loads @testing-library/jest-dom's matchers. Without
    // this it was never executed, so `toBeInTheDocument` did not exist.
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
})