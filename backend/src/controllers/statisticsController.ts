import { Request, Response } from 'express';
import { Recipe } from '../models/Recipe';
import { Analysis } from '../models/Analysis';
import { IUser } from '../models/User';
import { CacheService } from '../services/cacheService';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface UserStatistics {
  recipesCreated: number;
  ingredientsScanned: number;
  favoriteRecipes: number;
  totalAnalyses: number;
  lastAnalysisDate?: Date;
  lastRecipeDate?: Date;
}

export const getUserStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Try to get from cache first
    let statistics = await CacheService.getUserStatistics(userId.toString());
    
    if (!statistics) {
      // Compute statistics if not in cache
      const [
        recipesCreated,
        favoriteRecipes,
        completedAnalyses,
        ingredientsScannedResult,
        lastAnalysis,
        lastRecipe
      ] = await Promise.all([
        // Count total recipes created by user
        Recipe.countDocuments({ userId }),
        
        // Count saved/favorite recipes
        Recipe.countDocuments({ userId, isSaved: true }),
        
        // Count completed analyses
        Analysis.countDocuments({ userId, status: 'completed' }),
        
        // Count total unique ingredients scanned
        Analysis.aggregate([
          { $match: { userId, status: 'completed' } },
          { $unwind: '$ingredients' },
          { $group: { _id: '$ingredients.name' } },
          { $count: 'uniqueIngredients' }
        ]),
        
        // Get last analysis date
        Analysis.findOne(
          { userId, status: 'completed' },
          { createdAt: 1 },
          { sort: { createdAt: -1 } }
        ),
        
        // Get last recipe date
        Recipe.findOne(
          { userId },
          { createdAt: 1 },
          { sort: { createdAt: -1 } }
        )
      ]);

      statistics = {
        recipesCreated,
        favoriteRecipes,
        ingredientsScanned: ingredientsScannedResult[0]?.uniqueIngredients || 0,
        totalAnalyses: completedAnalyses,
        lastAnalysisDate: lastAnalysis?.createdAt,
        lastRecipeDate: lastRecipe?.createdAt
      };

      // Cache the result for 1 hour
      await CacheService.setUserStatistics(userId.toString(), statistics);
    }

    res.json(statistics);
  } catch (error) {
    console.log('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

export const getDetailedStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get detailed statistics with breakdowns
    const [
      recipesByDifficulty,
      recipesByDietaryTags,
      ingredientsByCategory,
      analysisHistory
    ] = await Promise.all([
      // Recipes by difficulty
      Recipe.aggregate([
        { $match: { userId } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } }
      ]),
      
      // Recipes by dietary tags
      Recipe.aggregate([
        { $match: { userId } },
        { $unwind: '$dietaryTags' },
        { $group: { _id: '$dietaryTags', count: { $sum: 1 } } }
      ]),
      
      // Ingredients by category
      Analysis.aggregate([
        { $match: { userId, status: 'completed' } },
        { $unwind: '$ingredients' },
        { $group: { _id: '$ingredients.category', count: { $sum: 1 } } }
      ]),
      
      // Analysis history (last 30 days)
      Analysis.aggregate([
        { 
          $match: { 
            userId, 
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const detailedStatistics = {
      recipesByDifficulty: recipesByDifficulty.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      
      recipesByDietaryTags: recipesByDietaryTags.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      
      ingredientsByCategory: ingredientsByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      
      analysisHistory: analysisHistory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json(detailedStatistics);
  } catch (error) {
    console.log('Error fetching detailed statistics:', error);
    res.status(500).json({ error: 'Failed to fetch detailed statistics' });
  }
};

export const getRecentRecipes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const type = req.query.type as string || 'saved'; // 'saved' or 'created'

    let query: any = { userId };
    
    if (type === 'saved') {
      query.isSaved = true;
    }

    const recentRecipes = await Recipe.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('title description ingredients instructions cookingTime servings difficulty dietaryTags imageUrl dishPhotos language originalIngredients createdAt updatedAt isSaved')
      .lean();

    res.json(recentRecipes);
  } catch (error) {
    console.log('Error fetching recent recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recent recipes' });
  }
};