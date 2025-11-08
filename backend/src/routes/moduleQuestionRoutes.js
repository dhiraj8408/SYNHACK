import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  addQuestion,
  getModuleQuestions,
  submitAnswer,
  deleteQuestion,
} from "../controllers/moduleQuestionController.js";

const router = Router();

router.use(auth);

// Professor: Add question to module
router.post("/", requireRole(["professor", "admin"]), addQuestion);

// Get questions for a module (students and professors)
router.get("/", getModuleQuestions);

// Student: Submit answer
router.post("/answer", requireRole(["student"]), submitAnswer);

// Professor: Delete question
router.delete("/:questionId", requireRole(["professor", "admin"]), deleteQuestion);

export default router;

