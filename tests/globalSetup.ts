import { execSync } from "node:child_process";

/** Creates a fresh, empty SQLite database for the integration tests. */
export default function setup() {
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
