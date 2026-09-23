import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getIo } from "@/realtime/io";
import { sendExpoPush } from "@/lib/expoPush";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedBookingId?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      relatedBookingId: params.relatedBookingId,
    },
  });

  getIo()?.to(`user:${params.userId}`).emit("notification:new", {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    relatedBookingId: notification.relatedBookingId,
    createdAt: notification.createdAt.toISOString(),
  });

  // Best-effort, ne bloque jamais la réponse : la notification en base + l'event socket ci-dessus
  // sont déjà la source de vérité. Le push ne fait qu'atteindre les appareils mobiles hors ligne.
  const devices = await prisma.deviceToken.findMany({ where: { userId: params.userId }, select: { expoPushToken: true } });
  if (devices.length > 0) {
    void sendExpoPush(
      devices.map((d) => d.expoPushToken),
      { title: params.title, body: params.body, data: { relatedBookingId: params.relatedBookingId, type: params.type } },
    );
  }

  return notification;
}
