import { Router } from 'express';
import { getDailyUsage } from '../controllers/usageController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/usage/daily - Get user's daily usage statistics
router.get('/daily', getDailyUsage);

export { router as usageRoutes };