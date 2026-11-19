import { execSync } from "node:child_process";

/** Resets the test database to an empty schema. Keep the URL in sync with vitest.config.ts. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://shop:shop@localhost:5432/shop_test";
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
