import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  createAssignment,
  listAssignments,
  submitAssignment,
  gradeSubmission,
  listSubmissions,
} from "../controllers/assignmentController.js";

const router = Router();

router.use(auth);

router.get("/", listAssignments);
router.get("/submissions", listSubmissions);
router.post("/", requireRole(["professor", "admin"]), createAssignment);
router.post("/submit", requireRole(["student"]), submitAssignment);
router.post("/grade", requireRole(["professor", "admin"]), gradeSubmission);

export default router;
