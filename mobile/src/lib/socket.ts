import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/config";
import { useAuthStore } from "@/store/auth";

let socket: Socket | null = null;

/** Connexion Socket.IO paresseuse, authentifiée avec le même access token que l'API REST. */
export function getSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, autoConnect: false });
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
