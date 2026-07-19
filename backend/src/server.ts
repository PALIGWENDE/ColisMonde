import { createServer } from "node:http";
import { env } from "@/config/env";
import { createApp } from "@/app";
import { createSocketServer } from "@/socket";
import { prisma } from "@/lib/prisma";

async function main() {
  await prisma.$connect();

  const app = createApp();
  const httpServer = createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`✅ ColisMonde API prête sur http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} reçu, arrêt en cours...`);
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("❌ Échec du démarrage du serveur :", err);
  process.exit(1);
});
