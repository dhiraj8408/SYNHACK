import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  createAssignment,
  getAssignment,
  listAssignments,
  submitAssignment,
  getMySubmission,
  gradeSubmission,
  listSubmissions,
} from "../controllers/assignmentController.js";

const router = Router();

router.use(auth);

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assignmentsDir = path.join(__dirname, "../../uploads/assignments");
const submissionsDir = path.join(__dirname, "../../uploads/submissions");

// Ensure upload directories exist
if (!fs.existsSync(assignmentsDir)) {
  fs.mkdirSync(assignmentsDir, { recursive: true });
}
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

// Configure multer for assignment file uploads
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `assignment-${uniqueSuffix}${ext}`);
  },
});

const assignmentUpload = multer({
  storage: assignmentStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
}).single("file"); // Use .single() to make it optional

// Configure multer for submission file uploads
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, submissionsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `submission-${uniqueSuffix}${ext}`);
  },
});

const submissionUpload = multer({
  storage: submissionStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// Assignment routes
router.get("/", listAssignments);
router.post("/", requireRole(["professor", "admin"]), assignmentUpload, createAssignment);

// Submission API routes (must come BEFORE file serving routes to avoid conflicts)
router.get("/submissions/my", getMySubmission);
router.get("/submissions/list", listSubmissions);
// Make file upload optional for submissions (can use Drive link instead)
router.post("/submit", requireRole(["student"]), submissionUpload.single("file"), submitAssignment);
router.post("/grade", requireRole(["professor", "admin"]), gradeSubmission);

// Serve assignment files
router.get("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(assignmentsDir, filename);
  const assignmentsDirResolved = path.resolve(assignmentsDir);
  
  if (!filePath.startsWith(assignmentsDirResolved)) {
    return res.status(403).json({ message: "Access denied" });
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ message: "File not found" });
    }
  });
});

// Serve submission files (must come AFTER /submissions/list to avoid route conflicts)
router.get("/submissions/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(submissionsDir, filename);
  const submissionsDirResolved = path.resolve(submissionsDir);
  
  if (!filePath.startsWith(submissionsDirResolved)) {
    return res.status(403).json({ message: "Access denied" });
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ message: "File not found" });
    }
  });
});

// Get single assignment (must come after /submissions routes)
router.get("/:id", getAssignment);

export default router;
