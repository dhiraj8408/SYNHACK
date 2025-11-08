import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import { listCourses, getCourse } from "../controllers/courseController.js";

const router = Router();

router.use(auth);
router.get("/", listCourses);
router.get("/:id", getCourse);

export default router;
