import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RecipeCollection, Recipe } from '../models';
import mongoose from 'mongoose';

// Get public collections with pagination and filters
export const getPublicCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      tags,
      sortBy = 'popular' // popular, recent, alphabetical
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build query for public collections
    const query: any = { isPublic: true };
    
    // Search in title and description
    if (search) {
      query.$text = { $search: search as string };
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Build sort criteria
    let sort: any = {};
    switch (sortBy) {
      case 'popular':
        sort = { totalFollowers: -1, createdAt: -1 };
        break;
      case 'recent':
        sort = { createdAt: -1 };
        break;
      case 'alphabetical':
        sort = { title: 1 };
        break;
      default:
        sort = { totalFollowers: -1, createdAt: -1 };
    }

    const collections = await RecipeCollection
      .find(query)
      .populate('creatorId', 'username email')
      .populate({
        path: 'recipes',
        select: 'title dishPhotos cookingTime difficulty',
        match: { isDeleted: false },
        options: { limit: 3 } // Solo le prime 3 ricette per preview
      })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await RecipeCollection.countDocuments(query);

    res.json({
      success: true,
      data: {
        collections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching public collections:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public collections'
    });
  }
};

// Get collection details with all recipes
export const getCollectionDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid collection ID'
      });
      return;
    }

    const collection = await RecipeCollection
      .findById(id)
      .populate('creatorId', 'username email')
      .populate({
        path: 'recipes',
        match: { isDeleted: false },
        populate: {
          path: 'userId',
          select: 'username'
        }
      })
      .lean();

    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
      return;
    }

    // Check if collection is public or user is the creator
    if (!collection.isPublic && collection.creatorId._id.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied to private collection'
      });
      return;
    }

    // Check if user is following this collection
    const isFollowing = userId ? collection.followers.some(
      (followerId: any) => followerId.toString() === userId
    ) : false;

    res.json({
      success: true,
      data: {
        ...collection,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Error fetching collection details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collection details'
    });
  }
};

// Follow/unfollow a collection
export const toggleFollowCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid collection ID'
      });
      return;
    }

    const collection = await RecipeCollection.findById(id);

    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
      return;
    }

    if (!collection.isPublic) {
      res.status(403).json({
        success: false,
        message: 'Cannot follow private collection'
      });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isFollowing = collection.followers.includes(userObjectId);

    if (isFollowing) {
      // Unfollow
      collection.followers = collection.followers.filter(
        (followerId: mongoose.Types.ObjectId) => !followerId.equals(userObjectId)
      );
    } else {
      // Follow
      collection.followers.push(userObjectId);
    }

    await collection.save();

    res.json({
      success: true,
      data: {
        isFollowing: !isFollowing,
        totalFollowers: collection.followers.length
      }
    });
  } catch (error) {
    console.error('Error toggling follow collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating follow status'
    });
  }
};

// Create a new collection (for authenticated users)
export const createCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, tags, isPublic = false } = req.body;
    const userId = req.user?.id;

    if (!title || !description) {
      res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
      return;
    }

    const collection = new RecipeCollection({
      title,
      description,
      creatorId: userId,
      tags: tags || [],
      isPublic,
      recipes: [],
      followers: []
    });

    await collection.save();

    res.status(201).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating collection'
    });
  }
};

// Get user's own collections
export const getUserCollections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const collections = await RecipeCollection
      .find({ creatorId: userId })
      .populate({
        path: 'recipes',
        select: 'title dishPhotos',
        match: { isDeleted: false },
        options: { limit: 3 }
      })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Error fetching user collections:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user collections'
    });
  }
};

// Add recipe to collection
export const addRecipeToCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { collectionId, recipeId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(collectionId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid collection or recipe ID'
      });
      return;
    }

    const collection = await RecipeCollection.findById(collectionId);
    const recipe = await Recipe.findById(recipeId);

    if (!collection || !recipe) {
      res.status(404).json({
        success: false,
        message: 'Collection or recipe not found'
      });
      return;
    }

    // Check if user owns the collection
    if (collection.creatorId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Check if recipe is already in collection
    const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
    if (collection.recipes.includes(recipeObjectId)) {
      res.status(400).json({
        success: false,
        message: 'Recipe already in collection'
      });
      return;
    }

    collection.recipes.push(recipeObjectId);
    await collection.save();

    res.json({
      success: true,
      message: 'Recipe added to collection successfully'
    });
  } catch (error) {
    console.error('Error adding recipe to collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding recipe to collection'
    });
  }
};