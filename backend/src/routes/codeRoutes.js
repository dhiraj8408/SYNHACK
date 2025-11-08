import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { executeCode } from '../controllers/codeController.js';

const router = Router();

// All code execution routes require authentication
router.use(auth);

router.post('/execute', executeCode);

export default router;

