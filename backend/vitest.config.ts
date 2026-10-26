import path from "node:path";
import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/testDatabase";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    // Les tests d'intégration partagent une seule base : on les exécute un fichier après l'autre.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: "test-access-secret-0123456789",
      JWT_REFRESH_SECRET: "test-refresh-secret-0123456789",
      WEB_ORIGIN: "http://localhost:3000",
      COOKIE_SECURE: "false",
      BCRYPT_SALT_ROUNDS: "4",
    },
  },
});
