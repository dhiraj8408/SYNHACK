import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let ioInstance = null;

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware for socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error("Authentication error: Invalid user"));
      }

      socket.user = { id: user._id.toString(), role: user.role, name: user.name };
      next();
    } catch (error) {
      next(new Error("Authentication error: " + error.message));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id, "User:", socket.user.name);

    socket.on("join-room", (courseId) => {
      const roomId = typeof courseId === "object" ? courseId.courseId : courseId;
      socket.join(String(roomId));
      console.log(`User ${socket.user.name} joined room: ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  ioInstance = io;
};

export const getIO = () => ioInstance;
