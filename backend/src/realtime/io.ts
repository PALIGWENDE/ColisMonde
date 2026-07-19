import type { Server } from "socket.io";

let ioInstance: Server | null = null;

export function setIo(io: Server) {
  ioInstance = io;
}

/** Peut renvoyer null si appelé avant l'initialisation du serveur (ex: scripts, tests). */
export function getIo(): Server | null {
  return ioInstance;
}
