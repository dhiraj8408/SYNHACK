import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));

// API Health test
app.get("/", (req, res) => {
    res.json({ message: "VNIT LMS Backend Running ✅" });
});

// ...
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/announcements", announcementRoutes);

export default app;
