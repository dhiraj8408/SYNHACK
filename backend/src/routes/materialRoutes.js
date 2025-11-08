import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  addMaterial,
  listMaterials,
  removeMaterial,
} from "../controllers/materialController.js";

const router = Router();

router.use(auth);

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `material-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types for materials
    cb(null, true);
  },
});

// Serve uploaded files
router.get("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(uploadsDir, filename);
  const uploadsDirResolved = path.resolve(uploadsDir);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(uploadsDirResolved)) {
    return res.status(403).json({ message: "Access denied" });
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ message: "File not found" });
    }
  });
});

router.get("/", listMaterials);
router.post("/", requireRole(["professor", "admin"]), upload.single("file"), addMaterial);
router.delete("/:id", requireRole(["professor", "admin"]), removeMaterial);

export default router;
