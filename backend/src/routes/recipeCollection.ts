import express from 'express';
import {
  getPublicCollections,
  getCollectionDetails,
  toggleFollowCollection,
  createCollection,
  getUserCollections,
  addRecipeToCollection
} from '../controllers/recipeCollectionController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', getPublicCollections);
router.get('/:id', getCollectionDetails);

// Protected routes (authentication required)
router.post('/:id/follow', protect, toggleFollowCollection);
router.post('/', protect, createCollection);
router.get('/user/my-collections', protect, getUserCollections);
router.post('/:collectionId/recipes/:recipeId', protect, addRecipeToCollection);

export default router;