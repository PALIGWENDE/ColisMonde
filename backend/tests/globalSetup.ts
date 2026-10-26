import { execSync } from "node:child_process";
import path from "node:path";
import { TEST_DATABASE_URL } from "./testDatabase";

// La base est entièrement effacée avant chaque lancement : on refuse tout nom qui ne désigne pas
// clairement une base de test, pour ne jamais vider la base de dev ou de prod par erreur.
export default function setup() {
  const dbName = new URL(TEST_DATABASE_URL).pathname.slice(1);
  if (!/test/i.test(dbName)) {
    throw new Error(`Refus de réinitialiser "${dbName}" : le nom de la base de test doit contenir "test".`);
  }

  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
