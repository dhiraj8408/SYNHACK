import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  createQuiz,
  listQuizzes,
  getQuiz,
  publishQuiz,
  submitQuiz,
  getQuizAttempts,
} from "../controllers/quizController.js";

const router = Router();

router.use(auth);

router.get("/", listQuizzes);
router.get("/attempts", getQuizAttempts);
router.get("/:id", getQuiz);
router.post("/", requireRole(["professor", "admin"]), createQuiz);
router.patch("/:id/publish", requireRole(["professor", "admin"]), publishQuiz);
router.post("/submit", requireRole(["student"]), submitQuiz);

export default router;

