import { redisService } from './redisService';
import { cacheKeys } from '../middleware/cache';

export class CacheService {
  // Recipe caching
  static async getPublicRecipes(page: number, limit: number, search?: string, sortBy?: string): Promise<any | null> {
    const key = `${cacheKeys.publicRecipes(page, limit)}:${search || 'all'}:${sortBy || 'recent'}`;
    return await redisService.getJSON(key);
  }

  static async setPublicRecipes(page: number, limit: number, data: any, search?: string, sortBy?: string): Promise<void> {
    const key = `${cacheKeys.publicRecipes(page, limit)}:${search || 'all'}:${sortBy || 'recent'}`;
    await redisService.setJSON(key, data, 300); // 5 minutes TTL (reduced for fresh content)
  }

  static async getUserRecipes(userId: string): Promise<any | null> {
    return await redisService.getJSON(cacheKeys.userRecipes(userId));
  }

  static async setUserRecipes(userId: string, data: any): Promise<void> {
    await redisService.setJSON(cacheKeys.userRecipes(userId), data, 600); // 10 minutes TTL
  }

  static async getRecipe(recipeId: string): Promise<any | null> {
    return await redisService.getJSON(cacheKeys.recipe(recipeId));
  }

  static async setRecipe(recipeId: string, data: any): Promise<void> {
    await redisService.setJSON(cacheKeys.recipe(recipeId), data, 1800); // 30 minutes TTL
  }

  // Nutrition analysis caching
  static async getNutritionAnalysis(ingredients: string): Promise<any | null> {
    return await redisService.getJSON(cacheKeys.nutritionAnalysis(ingredients));
  }

  static async setNutritionAnalysis(ingredients: string, data: any): Promise<void> {
    await redisService.setJSON(cacheKeys.nutritionAnalysis(ingredients), data, 7200); // 2 hours TTL (optimized from 1 hour - static data)
  }

  // Dish recognition caching
  static async getDishRecognition(imageHash: string): Promise<any | null> {
    return await redisService.getJSON(cacheKeys.dishRecognition(imageHash));
  }

  static async setDishRecognition(imageHash: string, data: any): Promise<void> {
    await redisService.setJSON(cacheKeys.dishRecognition(imageHash), data, 7200); // 2 hours TTL
  }

  // User ingredients caching
  static async getUserIngredients(userId: string): Promise<any | null> {
    return await redisService.getJSON(cacheKeys.ingredients(userId));
  }

  static async setUserIngredients(userId: string, data: any): Promise<void> {
    await redisService.setJSON(cacheKeys.ingredients(userId), data, 300); // 5 minutes TTL (optimized from 15 minutes - high update frequency)
  }

  // Cache invalidation methods
  static async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      redisService.deletePattern(`user:${userId}:*`),
      redisService.deletePattern(`public:recipes:*`) // Invalidate public recipes when user data changes
    ]);
  }

  static async invalidateRecipeCache(recipeId: string): Promise<void> {
    await Promise.all([
      redisService.del(cacheKeys.recipe(recipeId)),
      redisService.deletePattern(`public:recipes:*`) // Invalidate public recipes when a recipe changes
    ]);
  }

  static async invalidatePublicRecipesCache(): Promise<void> {
    await redisService.deletePattern(`public:recipes:*`);
  }

  static async invalidateNutritionCache(): Promise<void> {
    await redisService.deletePattern(`nutrition:*`);
  }

  static async invalidateRecognitionCache(): Promise<void> {
    await redisService.deletePattern(`recognition:*`);
  }

  // User statistics caching
  static async getUserStatistics(userId: string): Promise<any> {
    const key = `user:${userId}:statistics`;
    return await redisService.getJSON(key);
  }

  static async setUserStatistics(userId: string, data: any): Promise<void> {
    const key = `user:${userId}:statistics`;
    await redisService.setJSON(key, data, 3600); // 1 hour TTL
  }

  // Cache stampede protected method for public recipes
  static async getPublicRecipesProtected(
    page: number,
    limit: number,
    search: string = '',
    sortBy: string = 'recent',
    fetcher: () => Promise<any>
  ): Promise<any> {
    const key = `${cacheKeys.publicRecipes(page, limit)}:${search || 'all'}:${sortBy || 'recent'}`;
    return await redisService.getOrSet(key, fetcher, 300); // 5 minutes TTL
  }

  // Selective cache invalidation
  static async invalidateUserCacheSelective(userId: string, changedData: string[]): Promise<void> {
    const invalidationPromises = [];
    
    if (changedData.includes('recipes')) {
      invalidationPromises.push(redisService.del(cacheKeys.userRecipes(userId)));
    }
    
    if (changedData.includes('ingredients')) {
      invalidationPromises.push(redisService.del(cacheKeys.ingredients(userId)));
    }

    if (changedData.includes('statistics')) {
      invalidationPromises.push(redisService.del(`user:${userId}:statistics`));
    }
    
    // Only invalidate public recipes if user made a public recipe change
    if (changedData.includes('publicRecipe')) {
      invalidationPromises.push(redisService.deletePattern('public:recipes:*'));
    }
    
    await Promise.all(invalidationPromises);
  }

  // Cache warming methods
  static async warmCache(): Promise<void> {
    console.log('🔥 Starting cache warming...');
    
    try {
      const warmingPromises = [];

      // Pre-load popular public recipes (first page)
      warmingPromises.push(
        CacheService.getPublicRecipesProtected(1, 20, '', 'popular', async () => {
          // This will only execute if cache is empty
          const { Recipe } = await import('../models/Recipe');
          const recipes = await Recipe
            .find({ 
              isDeleted: false,
              status: 'approved', // Only show approved recipes
              $or: [
                { dishPhotos: { $exists: true, $ne: [] } },
                { cookedAt: { $exists: true, $ne: null } }
              ]
            })
            .populate('userId', 'name email avatar')
            .sort({ averageRating: -1, totalRatings: -1, 'dishPhotos.length': -1, createdAt: -1 })
            .limit(20)
            .lean();

          const total = await Recipe.countDocuments({
            isDeleted: false,
            status: 'approved', // Only count approved recipes
            $or: [
              { dishPhotos: { $exists: true, $ne: [] } },
              { cookedAt: { $exists: true, $ne: null } }
            ]
          });

          return {
            recipes,
            pagination: {
              page: 1,
              limit: 20,
              total,
              pages: Math.ceil(total / 20)
            }
          };
        })
      );

      // Pre-load recent recipes
      warmingPromises.push(
        CacheService.getPublicRecipesProtected(1, 20, '', 'recent', async () => {
          const { Recipe } = await import('../models/Recipe');
          const recipes = await Recipe
            .find({ 
              isDeleted: false,
              status: 'approved', // Only show approved recipes
              $or: [
                { dishPhotos: { $exists: true, $ne: [] } },
                { cookedAt: { $exists: true, $ne: null } }
              ]
            })
            .populate('userId', 'name email avatar')
            .sort({ cookedAt: -1, createdAt: -1 })
            .limit(20)
            .lean();

          const total = await Recipe.countDocuments({
            isDeleted: false,
            status: 'approved', // Only count approved recipes
            $or: [
              { dishPhotos: { $exists: true, $ne: [] } },
              { cookedAt: { $exists: true, $ne: null } }
            ]
          });

          return {
            recipes,
            pagination: {
              page: 1,
              limit: 20,
              total,
              pages: Math.ceil(total / 20)
            }
          };
        })
      );

      // Wait for all warming operations to complete
      await Promise.all(warmingPromises);
      
      console.log('✅ Cache warming completed successfully');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
      // Don't throw error - warming is optional
    }
  }
}