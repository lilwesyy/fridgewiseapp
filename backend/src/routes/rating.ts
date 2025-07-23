import { Router } from 'express';
import { rateRecipe, getUserRating, getRecipeRatings } from '../controllers/ratingController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/:recipeId/ratings', getRecipeRatings);

// Protected routes
router.use(protect);
router.post('/:recipeId/rate', rateRecipe);
router.get('/:recipeId/user-rating', getUserRating);

export { router as ratingRoutes };