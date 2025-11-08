import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

const router = Router();

router.use(auth);

// Get all announcements for a course (accessible to all authenticated users)
router.get("/", getAnnouncements);

// Create announcement (only professors and admins)
router.post(
  "/",
  requireRole(["professor", "admin"]),
  createAnnouncement
);

// Delete announcement (only professors and admins)
router.delete(
  "/:id",
  requireRole(["professor", "admin"]),
  deleteAnnouncement
);

export default router;

