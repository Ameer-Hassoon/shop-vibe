import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    // The integration tests share one SQLite file, so run test files one after another.
    fileParallelism: false,
    env: {
      // Relative to prisma/schema.prisma, i.e. prisma/test.db (git-ignored by *.db)
      DATABASE_URL: "file:./test.db",
    },
  },
});
