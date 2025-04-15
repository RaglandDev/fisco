import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
   resolve: {
    alias: {
      "@": path.resolve(__dirname, "app"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    env: loadEnv('', process.cwd(), ''),
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "**",           // exclude everything in fisco/
        "!app/**/*.{ts,tsx}" // re-include only TypeScript files in app/
      ],
    }
}})