import { defineConfig, loadEnv } from 'vite'
import { configDefaults } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";


export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app")
    },
  },
  test: {
    globals: true,
    // Use different environments based on test file location
    environmentMatchGlobs: [
      ["**/__tests__/**", "jsdom"], // Component tests use jsdom
    ],
    setupFiles: ['./__tests__/components/setup-tests.ts'],
    css: false,
    env: loadEnv('', process.cwd(), ''),
    exclude: [
    ...configDefaults.exclude,
      '**/__tests__/e2e/**'
    ],
    coverage: {
      provider: "v8",
      include: [
        'app/components/**/*.{ts,tsx}',
        'app/actions/**/*.{ts,tsx}',
        'app/api/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'node_modules/',
        'app/components/ui/*',
        '**/__tests__/e2e/**'
      ],
    },
  },
})
//