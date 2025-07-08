import { Router } from 'express';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// User routes can be added here for additional user-related functionality
// For now, user management is handled in auth routes

export { router as userRoutes };