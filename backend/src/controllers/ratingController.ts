import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Rating } from '../models/Rating';
import { Recipe } from '../models/Recipe';
import { APIResponse } from '@/types';

// Rate a recipe
export const rateRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { recipeId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
      return;
    }

    // Check if recipe exists and is public (cooked/saved)
    const recipe = await Recipe.findOne({ 
      _id: recipeId, 
      isDeleted: false,
      isSaved: true,
      $or: [
        { dishPhotos: { $exists: true, $ne: [] } },
        { cookedAt: { $exists: true, $ne: null } }
      ]
    });

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found or not public'
      });
      return;
    }

    // Users cannot rate their own recipes
    if (recipe.userId.toString() === (user._id as any).toString()) {
      res.status(400).json({
        success: false,
        error: 'Cannot rate your own recipe'
      });
      return;
    }

    // Upsert rating (update if exists, create if not)
    const existingRating = await Rating.findOneAndUpdate(
      { recipeId, userId: user._id as any },
      { rating, comment },
      { new: true, upsert: true }
    );

    // Recalculate recipe average rating
    await updateRecipeAverageRating(recipeId);

    res.status(200).json({
      success: true,
      message: 'Rating saved successfully',
      data: existingRating
    });
  } catch (error: any) {
    console.error('Error rating recipe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to rate recipe'
    });
  }
};

// Get user's rating for a recipe
export const getUserRating = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { recipeId } = req.params;

    const rating = await Rating.findOne({ 
      recipeId, 
      userId: user._id as any 
    });

    res.status(200).json({
      success: true,
      data: rating
    });
  } catch (error: any) {
    console.error('Error getting user rating:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get rating'
    });
  }
};

// Get all ratings for a recipe
export const getRecipeRatings = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const ratings = await Rating
      .find({ recipeId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Rating.countDocuments({ recipeId });

    res.status(200).json({
      success: true,
      data: {
        ratings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting recipe ratings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get ratings'
    });
  }
};

// Helper function to update recipe average rating
async function updateRecipeAverageRating(recipeId: string): Promise<void> {
  try {
    const ratings = await Rating.find({ recipeId });
    
    if (ratings.length === 0) {
      await Recipe.findByIdAndUpdate(recipeId, {
        averageRating: 0,
        totalRatings: 0
      });
      return;
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    await Recipe.findByIdAndUpdate(recipeId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Error updating recipe average rating:', error);
  }
}