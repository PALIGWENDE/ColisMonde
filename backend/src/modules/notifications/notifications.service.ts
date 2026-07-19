import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getIo } from "@/realtime/io";

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

  return notification;
}
