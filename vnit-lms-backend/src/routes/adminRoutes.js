import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  createUser,
  bulkCreateUsers,
  createCourse,
  enrollStudents,
  dropStudents,
} from "../controllers/adminController.js";

const router = Router();

router.use(auth, requireRole(["admin"]));

router.post("/users", createUser);
router.post("/users/bulk", bulkCreateUsers);
router.post("/course", createCourse);
router.post("/course/enroll", enrollStudents);
router.post("/course/drop", dropStudents);

export default router;
