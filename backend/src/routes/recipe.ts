import { Router } from 'express';
import { generateRecipe, getRecipes, getRecipe, updateRecipe, deleteRecipe, getSavedRecipes, saveRecipe, unsaveRecipe, createRecipe, deleteRecipePhoto, completeRecipe, getCookedRecipes, getPublicRecipes, getUsersWhoCookedRecipe } from '../controllers/recipeController';
import { protect } from '../middleware/auth';
import { rateLimits } from '../middleware/rateLimiter';
import { checkDailyLimit, incrementDailyUsage } from '../middleware/dailyLimits';

const router = Router();

// Public routes (no authentication required)
router.get('/public', getPublicRecipes);
router.get('/:recipeId/cooked-by', getUsersWhoCookedRecipe);

// All other routes require authentication
router.use(protect);

router.post('/generate', checkDailyLimit('recipeGenerations'), rateLimits.recipeGeneration, generateRecipe);
router.post('/', rateLimits.recipeCreation, createRecipe); // Create recipe without saving to collection
router.get('/', getRecipes);
router.get('/saved', getSavedRecipes);
router.get('/cooked', getCookedRecipes); // Get cooking history (including soft-deleted recipes)
router.post('/save/:id', rateLimits.recipeCreation, saveRecipe);
router.post('/save', rateLimits.recipeCreation, saveRecipe); // For temporary recipes without ID
router.post('/complete/:id', completeRecipe); // Complete recipe without photo
router.delete('/saved/:id', unsaveRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);
router.delete('/:id/photo', deleteRecipePhoto);
router.get('/:id', getRecipe); // Move this to the end to avoid conflicts

export { router as recipeRoutes };