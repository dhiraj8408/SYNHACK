import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import { listCourses, getCourseById,getCoursesByStudent,getCoursesByProfessor,createCourse,updateCourse,deleteCourse,enrollStudent,unenrollStudent } from "../controllers/courseController.js";

const router = Router();

router.use(auth);
router.get("/", listCourses);
router.get("/:id", getCourseById);
router.get("/student/:studentId", getCoursesByStudent);
router.get("/professor/:professorId", getCoursesByProfessor);
router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);
router.post("/:id/enroll", enrollStudent);
router.post("/:id/unenroll", unenrollStudent);

export default router;
