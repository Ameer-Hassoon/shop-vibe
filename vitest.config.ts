import path from "node:path";
import { defineConfig } from "vitest/config";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://shop:shop@localhost:5432/shop_test";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    // The integration tests share one database, so run test files one after another.
    fileParallelism: false,
    env: {
      // A separate database that the tests wipe; never point this at real data.
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
    },
  },
});
