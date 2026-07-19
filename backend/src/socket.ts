import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/utils/jwt";
import { webOrigins } from "@/config/env";
import { setIo } from "@/realtime/io";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: webOrigins, credentials: true },
  });

  // Authentification par access token JWT (même jeton que l'API REST), pas de session anonyme.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("UNAUTHORIZED"));
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.isSuspended) return next(new Error("UNAUTHORIZED"));
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on("conversation:join", async (conversationId: string, ack?: (ok: boolean) => void) => {
      if (typeof conversationId !== "string") return ack?.(false);
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { booking: true },
      });
      const isParticipant =
        conversation && (conversation.booking.senderId === userId || conversation.booking.travelerId === userId);
      if (!isParticipant) return ack?.(false);
      socket.join(`conversation:${conversationId}`);
      ack?.(true);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      if (typeof conversationId === "string") socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing", (payload: { conversationId?: string }) => {
      if (typeof payload?.conversationId === "string") {
        socket.to(`conversation:${payload.conversationId}`).emit("typing", { userId });
      }
    });
  });

  setIo(io);
  return io;
}
