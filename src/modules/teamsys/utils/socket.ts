import { Server, Socket } from "socket.io";
import type http from "http";
import  Session  from "../models/session.model"; // ajusta la ruta al modelo real
import mongoose from "mongoose";

const userSockets = new Map<string, Set<string>>();

interface SocketData {
  userId?: string;
  accessToken?: string;
}

let io: Server | null = null;

interface AuthPayload {
  userId: string;
  accessToken: string;
}

export function initTeamsysSocketServer(server: http.Server, allowedOrigins: string[]) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : "*",
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("🔌 [teamsys] Cliente conectado:", socket.id);

    // 🔐 Autenticar socket con userId + accessToken
    socket.on("auth", async (payload: AuthPayload) => {
      const { userId, accessToken } = payload || {};

      if (!userId || !accessToken) return;
      if (!mongoose.Types.ObjectId.isValid(userId)) return;

      console.log(`🔐 [teamsys] Socket ${socket.id} -> usuario ${userId}`);

      // Guardamos en el socket a qué usuario y token pertenece
      const data = socket.data as SocketData;
      data.userId = userId;
      data.accessToken = accessToken;

      // Mapeo usuario -> sockets
      let set = userSockets.get(userId);
      if (!set) {
        set = new Set();
        userSockets.set(userId, set);
      }
      set.add(socket.id);

    });

    socket.on("disconnect", async () => {
      const data = socket.data as SocketData;

      const userId = data.userId;
      const accessToken = data.accessToken;
      if (!userId) return;
      
        const set = userSockets.get(userId);
        if (!set) return;
          set.delete(socket.id);
          if (set.size === 0) userSockets.delete(userId);
        
      

      console.log(`❌ [teamsys] Socket ${socket.id} desconectado de usuario ${userId} accessToken ${accessToken}`);

      // 🔻 Aquí marcamos la sesión de ese socket como inactiva
      if (userId && accessToken && mongoose.Types.ObjectId.isValid(userId)) {
        await Session.findOneAndUpdate(
          {
            userId: new mongoose.Types.ObjectId(userId),
            token: accessToken,
          },
          {
            $set: {
              isActive: false,
              lastActivity: new Date(), // última hora de conexión de ESA sesión
            },
          }
        );
      }
    });
  });

  console.log("✅ [teamsys] Socket.io inicializado");
}


export async function forceLogoutUser(userId: string, exceptSocketId?: string) {
  if (!io) return;
  const set = userSockets.get(userId);
  if (set) {
    console.log(`🚨 [teamsys] Expulsando sesiones del usuario ${userId}`);

    for (const id of set) {
      if (id === exceptSocketId) continue;
      io.to(id).emit("force-logout");
    }
  }

}

// Desconecta todas las conexiones de un usuario cuyos accessToken estén en la lista
export function disconnectUserSessionsByTokens(userId: string, tokens: string[]): void {
  if (!io) return;

  const set = userSockets.get(userId);
  if (!set || set.size === 0) return;

  console.log(
    `🚨 [teamsys] Desconectando sockets del usuario ${userId} para tokens:`,
    tokens
  );

  for (const socketId of Array.from(set)) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) {
      set.delete(socketId);
      continue;
    }

    const data = socket.data as SocketData;
    const accessToken = data.accessToken;

    if (accessToken && tokens.includes(accessToken)) {
      // Avisar al front y desconectar
      socket.emit("force-logout");
      socket.disconnect(true);

      set.delete(socketId);
      console.log(
        `❌ [teamsys] Socket ${socketId} desconectado por cierre de sesión (token ${accessToken})`
      );
    }
  }

  if (set.size === 0) {
    userSockets.delete(userId);
  }
}

