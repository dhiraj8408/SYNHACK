import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
    });
  }
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
