import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getUserStatistics, getDetailedStatistics, getRecentRecipes } from '../controllers/statisticsController';

const router = Router();

// All routes require authentication
router.use(protect);

// Statistics routes
router.get('/statistics', getUserStatistics);
router.get('/statistics/detailed', getDetailedStatistics);

// Recent recipes routes
router.get('/recent-recipes', getRecentRecipes);

// User routes can be added here for additional user-related functionality
// For now, user management is handled in auth routes

export { router as userRoutes };