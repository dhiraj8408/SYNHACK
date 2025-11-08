import { Router } from "express";
import { auth, requireRole } from "../middleware/authMiddleware.js";
import {
  addMaterial,
  listMaterials,
  removeMaterial,
} from "../controllers/materialController.js";

const router = Router();

router.use(auth);

router.get("/", listMaterials);
router.post("/", requireRole(["professor", "admin"]), addMaterial);
router.delete("/:id", requireRole(["professor", "admin"]), removeMaterial);

export default router;
