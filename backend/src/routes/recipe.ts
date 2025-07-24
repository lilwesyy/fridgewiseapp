import { Router } from 'express';
import { generateRecipe, getRecipes, getRecipe, updateRecipe, deleteRecipe, getSavedRecipes, saveRecipe, unsaveRecipe, createRecipe, deleteRecipePhoto, completeRecipe, getCookedRecipes, getPublicRecipes, getUsersWhoCookedRecipe, savePublicRecipe } from '../controllers/recipeController';
import { protect } from '../middleware/auth';
import { rateLimits } from '../middleware/rateLimiter';
import { checkDailyLimit, incrementDailyUsage } from '../middleware/dailyLimits';
import { cache } from '../middleware/cache';

const router = Router();

// Public routes (no authentication required)
router.get('/public', cache({ 
  ttl: 300, // 5 minutes
  keyGenerator: (req) => `public:recipes:${req.url}`,
  condition: (req) => !req.query.search // Don't cache search results
}), getPublicRecipes);
router.get('/:recipeId/cooked-by', cache({ ttl: 600 }), getUsersWhoCookedRecipe);

// All other routes require authentication
router.use(protect);

router.post('/generate', checkDailyLimit('recipeGenerations'), rateLimits.recipeGeneration, generateRecipe);
router.post('/', rateLimits.recipeCreation, createRecipe); // Create recipe without saving to collection
router.get('/', getRecipes);
router.get('/saved', getSavedRecipes);
router.get('/cooked', getCookedRecipes); // Get cooking history (including soft-deleted recipes)
router.post('/save/:id', rateLimits.recipeCreation, saveRecipe);
router.post('/save', rateLimits.recipeCreation, saveRecipe); // For temporary recipes without ID
router.post('/save-public/:id', rateLimits.recipeCreation, savePublicRecipe); // Save public recipe to user's collection
router.post('/complete/:id', completeRecipe); // Complete recipe without photo
router.delete('/saved/:id', unsaveRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);
router.delete('/:id/photo', deleteRecipePhoto);
router.get('/:id', getRecipe); // Move this to the end to avoid conflicts

export { router as recipeRoutes };