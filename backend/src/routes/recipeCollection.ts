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
import { cache } from '../middleware/cache';

const router = express.Router();

// Public routes (no authentication required) - with caching
router.get('/public', cache({ ttl: 600 }), getPublicCollections);
router.get('/:id', cache({ ttl: 1800, keyGenerator: (req) => `collection:${req.params.id}` }), getCollectionDetails);

// Protected routes (authentication required)
router.post('/:id/follow', protect, toggleFollowCollection);
router.post('/', protect, createCollection);
router.get('/user/my-collections', protect, cache({ ttl: 600, keyGenerator: (req) => `user:${req.user?._id}:collections` }), getUserCollections);
router.post('/:collectionId/recipes/:recipeId', protect, addRecipeToCollection);

export default router;