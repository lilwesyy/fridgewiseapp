import { Router } from 'express';
import { generateRecipe, getRecipes, getRecipe, updateRecipe, deleteRecipe } from '../controllers/recipeController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

router.post('/generate', generateRecipe);
router.get('/', getRecipes);
router.get('/:id', getRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

export { router as recipeRoutes };