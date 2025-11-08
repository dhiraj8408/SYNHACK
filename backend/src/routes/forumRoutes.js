import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  createThread,
  listThreads,
  getThreadById,
  replyThread,
  resolveThread,
  deleteThread,
} from "../controllers/forumController.js";

const router = Router();

router.use(auth);

router.get("/threads/:courseId", listThreads);
router.get("/thread/:id", getThreadById);
router.post("/thread", requireRole(["student", "professor", "admin"]), createThread);
router.post("/reply", requireRole(["student", "professor", "admin"]), replyThread);
router.patch("/thread/:id/resolve", requireRole(["professor", "admin"]), resolveThread);
router.delete("/thread/:id", requireRole(["professor", "admin"]), deleteThread);

export default router;
