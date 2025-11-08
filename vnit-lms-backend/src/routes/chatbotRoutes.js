import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import { askBot } from "../controllers/chatbotController.js";

const router = Router();

router.use(auth);
router.post("/ask", askBot);

export default router;
