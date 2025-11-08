import { Router } from "express";
import multer from "multer";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  createUser,
  bulkCreateUsers,
  listUsers,
  getUserById,
  updateUser,
  resetPassword,
  toggleUserStatus,
  createCourse,
  enrollStudents,
  enrollStudentsByEmail,
  enrollStudentsFromCSV,
  dropStudents,
} from "../controllers/adminController.js";

const router = Router();

router.use(auth, requireRole(["admin"]));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// User management routes
router.get("/users", listUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.post("/users/bulk", upload.single("file"), bulkCreateUsers);
router.put("/users/:id", updateUser);
router.post("/users/:id/reset-password", resetPassword);
router.patch("/users/:id/toggle-status", toggleUserStatus);

// Course management routes
router.post("/course", upload.single("studentsFile"), createCourse);
router.post("/course/enroll", enrollStudents);
router.post("/course/enroll-by-email", enrollStudentsByEmail);
router.post("/course/enroll-csv", upload.single("file"), enrollStudentsFromCSV);
router.post("/course/drop", dropStudents);

export default router;
