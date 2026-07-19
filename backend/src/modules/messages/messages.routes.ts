import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { serializePublicUser } from "@/utils/serializers";
import { getIo } from "@/realtime/io";
import { createNotification } from "@/modules/notifications/notifications.service";
import { isBlockedEitherWay } from "@/modules/blocks/blocks.routes";

export const messagesRouter = Router();

async function loadConversationOrThrow(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { booking: true },
  });
  if (!conversation) throw ApiError.notFound("Conversation introuvable");
  return conversation;
}

function assertParticipant(conversation: { booking: { senderId: string; travelerId: string } }, userId: string) {
  if (conversation.booking.senderId !== userId && conversation.booking.travelerId !== userId) {
    throw ApiError.forbidden("Vous n'avez pas accès à cette conversation");
  }
}

messagesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversations = await prisma.conversation.findMany({
      where: { booking: { OR: [{ senderId: req.userId }, { travelerId: req.userId }] } },
      include: {
        booking: { include: { sender: true, traveler: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = await Promise.all(
      conversations.map(async (c) => {
        const otherParticipant = c.booking.senderId === req.userId ? c.booking.traveler : c.booking.sender;
        const unreadCount = await prisma.message.count({
          where: { conversationId: c.id, readAt: null, senderId: { not: req.userId } },
        });
        const lastMessage = c.messages[0];
        return {
          id: c.id,
          bookingId: c.bookingId,
          otherParticipant: serializePublicUser(otherParticipant),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                conversationId: lastMessage.conversationId,
                senderId: lastMessage.senderId,
                content: lastMessage.content,
                attachmentUrl: lastMessage.attachmentUrl,
                readAt: lastMessage.readAt?.toISOString() ?? null,
                createdAt: lastMessage.createdAt.toISOString(),
              }
            : null,
          unreadCount,
        };
      }),
    );

    res.json({ conversations: result });
  }),
);

messagesRouter.get(
  "/:id/messages",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const conversation = await loadConversationOrThrow(req.params.id);
    assertParticipant(conversation, req.userId!);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    await prisma.message.updateMany({
      where: { conversationId: conversation.id, senderId: { not: req.userId }, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        attachmentUrl: m.attachmentUrl,
        readAt: m.readAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  }),
);

const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

messagesRouter.post(
  "/:id/messages",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }), body: sendMessageSchema }),
  asyncHandler(async (req, res) => {
    const conversation = await loadConversationOrThrow(req.params.id);
    assertParticipant(conversation, req.userId!);

    const otherParticipantId =
      conversation.booking.senderId === req.userId ? conversation.booking.travelerId : conversation.booking.senderId;
    if (await isBlockedEitherWay(req.userId!, otherParticipantId)) {
      throw ApiError.forbidden("Impossible d'envoyer un message à cet utilisateur");
    }

    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderId: req.userId!, content: req.body.content },
    });

    const dto = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      attachmentUrl: message.attachmentUrl,
      readAt: null,
      createdAt: message.createdAt.toISOString(),
    };

    getIo()?.to(`conversation:${conversation.id}`).emit("message:new", dto);

    await createNotification({
      userId: otherParticipantId,
      type: "MESSAGE_RECEIVED",
      title: "Nouveau message",
      body: req.body.content.slice(0, 120),
      relatedBookingId: conversation.bookingId,
    });

    res.status(201).json({ message: dto });
  }),
);
