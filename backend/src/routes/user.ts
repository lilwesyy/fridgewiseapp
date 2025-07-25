import { Router } from 'express';
import { protect } from '../middleware/auth';
import { cache } from '../middleware/cache';
import { getUserStatistics, getDetailedStatistics, getRecentRecipes } from '../controllers/statisticsController';
import { 
  validationRules, 
  handleValidationErrors 
} from '../middleware/inputValidation';

const router = Router();

// All routes require authentication
router.use(protect);

// Statistics routes (with caching)
router.get('/statistics', cache({ ttl: 3600, keyGenerator: (req: any) => `user:${req.user?._id}:statistics` }), getUserStatistics);
router.get('/statistics/detailed', cache({ ttl: 1800, keyGenerator: (req: any) => `user:${req.user?._id}:detailed-stats` }), getDetailedStatistics);

// Recent recipes routes (with caching)
router.get('/recent-recipes', 
  ...validationRules.pagination,
  handleValidationErrors,
  cache({ ttl: 600, keyGenerator: (req: any) => `user:${req.user?._id}:recent-recipes:${req.query.type || 'saved'}:${req.query.limit || 5}` }), 
  getRecentRecipes
);

// User routes can be added here for additional user-related functionality
// For now, user management is handled in auth routes

export { router as userRoutes };