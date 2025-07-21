import { Router } from 'express';
import { generateRecipe, getRecipes, getRecipe, updateRecipe, deleteRecipe, getSavedRecipes, saveRecipe, unsaveRecipe, createRecipe, deleteRecipePhoto, completeRecipe } from '../controllers/recipeController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

router.post('/generate', generateRecipe);
router.post('/', createRecipe); // Create recipe without saving to collection
router.get('/', getRecipes);
router.get('/saved', getSavedRecipes);
router.post('/save/:id', saveRecipe);
router.post('/save', saveRecipe); // For temporary recipes without ID
router.post('/complete/:id', completeRecipe); // Complete recipe without photo
router.delete('/saved/:id', unsaveRecipe);
router.get('/:id', getRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);
router.delete('/:id/photo', deleteRecipePhoto);

export { router as recipeRoutes };