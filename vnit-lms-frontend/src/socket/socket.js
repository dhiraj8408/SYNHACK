import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_BACKEND_API_URL, {
  withCredentials: true,
});
