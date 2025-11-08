import http from "http";
import dotenv from "dotenv";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`)
  );
};

start();
