import { Server } from "socket.io";

let ioInstance = null;

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("join-room", (courseId) => {
      socket.join(String(courseId));
    });
  });

  ioInstance = io;
};

export const getIO = () => ioInstance;
