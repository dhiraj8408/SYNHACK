import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  getProgress,
  markModuleComplete,
  markModuleIncomplete,
} from "../controllers/progressController.js";

const router = Router();

router.use(auth);

// Get progress for current user in a course
router.get("/course/:courseId", getProgress);

// Mark module as complete (students only)
router.post("/complete", requireRole(["student"]), markModuleComplete);

// Mark module as incomplete (students only)
router.post("/incomplete", requireRole(["student"]), markModuleIncomplete);

export default router;

