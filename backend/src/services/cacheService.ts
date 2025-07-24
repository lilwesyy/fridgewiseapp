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
    await redisService.setJSON(key, data, 300); // 5 minutes TTL
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
    await redisService.setJSON(cacheKeys.nutritionAnalysis(ingredients), data, 3600); // 1 hour TTL
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
    await redisService.setJSON(cacheKeys.ingredients(userId), data, 900); // 15 minutes TTL
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
}