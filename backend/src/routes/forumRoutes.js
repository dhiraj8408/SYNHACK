import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  createThread,
  listThreads,
  replyThread,
  resolveThread,
} from "../controllers/forumController.js";

const router = Router();

router.use(auth);

router.get("/", listThreads);
router.post("/", requireRole(["student", "professor", "admin"]), createThread);
router.post("/reply", requireRole(["student", "professor", "admin"]), replyThread);
router.post("/:id/resolve", requireRole(["professor", "admin"]), resolveThread);

export default router;
