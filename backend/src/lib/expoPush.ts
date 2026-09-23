import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Envoie une notification push via le service Expo (abstrait FCM/APNs, un seul appel HTTP).
 * Best-effort : une erreur d'envoi ne doit jamais faire échouer la création de la notification
 * en base (déjà faite par l'appelant) — on log et on continue.
 */
export async function sendExpoPush(expoPushTokens: string[], notification: { title: string; body: string; data?: Record<string, unknown> }) {
  if (expoPushTokens.length === 0) return;

  for (const batch of chunk(expoPushTokens, BATCH_SIZE)) {
    const messages: ExpoPushMessage[] = batch.map((to) => ({ to, title: notification.title, body: notification.body, data: notification.data }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        console.error(`[expoPush] Envoi échoué (HTTP ${res.status})`);
        continue;
      }

      const { data: tickets } = (await res.json()) as { data: ExpoPushTicket[] };
      const staleTokens = batch.filter((_, i) => tickets[i]?.status === "error" && tickets[i]?.details?.error === "DeviceNotRegistered");
      if (staleTokens.length > 0) {
        await prisma.deviceToken.deleteMany({ where: { expoPushToken: { in: staleTokens } } });
      }
    } catch (err) {
      console.error("[expoPush] Envoi échoué", err);
    }
  }
}
