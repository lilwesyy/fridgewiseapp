import mongoose from 'mongoose';
import { Recipe, IRecipe, IRecipeIngredient, IDishPhoto } from '../Recipe';

describe('Recipe Model', () => {
  const validRecipeData = {
    title: 'Test Recipe',
    description: 'A test recipe description',
    ingredients: [
      { name: 'Flour', amount: '2', unit: 'cups' },
      { name: 'Sugar', amount: '1', unit: 'cup' }
    ] as IRecipeIngredient[],
    instructions: ['Mix ingredients', 'Bake for 30 minutes'],
    cookingTime: 45,
    servings: 4,
    difficulty: 'easy' as const,
    dietaryTags: ['vegetarian'],
    language: 'en' as const,
    userId: new mongoose.Types.ObjectId(),
    originalIngredients: ['flour', 'sugar'],
    isSaved: false
  };

  describe('Basic Recipe Creation', () => {
    it('should create a recipe with valid data', async () => {
      const recipe = new Recipe(validRecipeData);
      const savedRecipe = await recipe.save();

      expect(savedRecipe.title).toBe(validRecipeData.title);
      expect(savedRecipe.completionCount).toBe(0); // Default value
      expect(savedRecipe.dishPhoto).toBeUndefined();
      expect(savedRecipe.cookedAt).toBeUndefined();
    });

    it('should set default completionCount to 0', async () => {
      const recipe = new Recipe(validRecipeData);
      const savedRecipe = await recipe.save();

      expect(savedRecipe.completionCount).toBe(0);
    });
  });

  describe('Dish Photo Field', () => {
    it('should save recipe with valid dish photo', async () => {
      const dishPhoto: IDishPhoto = {
        url: 'https://example.com/photo.jpg',
        publicId: 'photo123'
      };

      const recipeWithPhoto = new Recipe({
        ...validRecipeData,
        dishPhoto
      });

      const savedRecipe = await recipeWithPhoto.save();
      expect(savedRecipe.dishPhoto?.url).toBe(dishPhoto.url);
      expect(savedRecipe.dishPhoto?.publicId).toBe(dishPhoto.publicId);
    });

    it('should reject invalid dish photo URL', async () => {
      const invalidDishPhoto = {
        url: 'invalid-url',
        publicId: 'photo123'
      };

      const recipeWithInvalidPhoto = new Recipe({
        ...validRecipeData,
        dishPhoto: invalidDishPhoto
      });

      await expect(recipeWithInvalidPhoto.save()).rejects.toThrow();
    });

    it('should accept valid HTTP and HTTPS URLs', async () => {
      const httpPhoto = {
        url: 'http://example.com/photo.jpg',
        publicId: 'photo123'
      };

      const httpsPhoto = {
        url: 'https://example.com/photo.jpg',
        publicId: 'photo456'
      };

      const recipeWithHttp = new Recipe({
        ...validRecipeData,
        dishPhoto: httpPhoto
      });

      const recipeWithHttps = new Recipe({
        ...validRecipeData,
        dishPhoto: httpsPhoto
      });

      const savedHttpRecipe = await recipeWithHttp.save();
      const savedHttpsRecipe = await recipeWithHttps.save();

      expect(savedHttpRecipe.dishPhoto?.url).toBe(httpPhoto.url);
      expect(savedHttpsRecipe.dishPhoto?.url).toBe(httpsPhoto.url);
    });

    it('should allow recipe without dish photo', async () => {
      const recipe = new Recipe(validRecipeData);
      const savedRecipe = await recipe.save();

      expect(savedRecipe.dishPhoto).toBeUndefined();
    });
  });

  describe('CookedAt Field', () => {
    it('should save recipe with valid cookedAt date', async () => {
      const cookedAt = new Date('2024-01-15T10:30:00Z');
      const recipeWithCookedAt = new Recipe({
        ...validRecipeData,
        cookedAt
      });

      const savedRecipe = await recipeWithCookedAt.save();
      expect(savedRecipe.cookedAt).toEqual(cookedAt);
    });

    it('should reject future cookedAt date', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const recipeWithFutureDate = new Recipe({
        ...validRecipeData,
        cookedAt: futureDate
      });

      await expect(recipeWithFutureDate.save()).rejects.toThrow();
    });

    it('should allow current date as cookedAt', async () => {
      const now = new Date();
      const recipeWithNow = new Recipe({
        ...validRecipeData,
        cookedAt: now
      });

      const savedRecipe = await recipeWithNow.save();
      expect(savedRecipe.cookedAt).toEqual(now);
    });

    it('should allow recipe without cookedAt', async () => {
      const recipe = new Recipe(validRecipeData);
      const savedRecipe = await recipe.save();

      expect(savedRecipe.cookedAt).toBeUndefined();
    });
  });

  describe('CompletionCount Field', () => {
    it('should default completionCount to 0', async () => {
      const recipe = new Recipe(validRecipeData);
      const savedRecipe = await recipe.save();

      expect(savedRecipe.completionCount).toBe(0);
    });

    it('should save recipe with valid completionCount', async () => {
      const recipeWithCount = new Recipe({
        ...validRecipeData,
        completionCount: 5
      });

      const savedRecipe = await recipeWithCount.save();
      expect(savedRecipe.completionCount).toBe(5);
    });

    it('should reject negative completionCount', async () => {
      const recipeWithNegativeCount = new Recipe({
        ...validRecipeData,
        completionCount: -1
      });

      await expect(recipeWithNegativeCount.save()).rejects.toThrow();
    });

    it('should reject non-integer completionCount', async () => {
      const recipeWithDecimal = new Recipe({
        ...validRecipeData,
        completionCount: 2.5
      });

      await expect(recipeWithDecimal.save()).rejects.toThrow();
    });

    it('should allow zero completionCount', async () => {
      const recipeWithZero = new Recipe({
        ...validRecipeData,
        completionCount: 0
      });

      const savedRecipe = await recipeWithZero.save();
      expect(savedRecipe.completionCount).toBe(0);
    });
  });

  describe('Combined New Fields', () => {
    it('should save recipe with all new fields', async () => {
      const dishPhoto: IDishPhoto = {
        url: 'https://example.com/delicious-dish.jpg',
        publicId: 'dish123'
      };
      const cookedAt = new Date('2024-01-15T18:30:00Z');
      const completionCount = 3;

      const completeRecipe = new Recipe({
        ...validRecipeData,
        dishPhoto,
        cookedAt,
        completionCount
      });

      const savedRecipe = await completeRecipe.save();

      expect(savedRecipe.dishPhoto?.url).toBe(dishPhoto.url);
      expect(savedRecipe.dishPhoto?.publicId).toBe(dishPhoto.publicId);
      expect(savedRecipe.cookedAt).toEqual(cookedAt);
      expect(savedRecipe.completionCount).toBe(completionCount);
    });

    it('should update existing recipe with new fields', async () => {
      // First create a basic recipe
      const recipe = new Recipe(validRecipeData);
      const savedRecipe = await recipe.save();

      // Then update it with new fields
      const dishPhoto: IDishPhoto = {
        url: 'https://example.com/updated-dish.jpg',
        publicId: 'updated123'
      };
      const cookedAt = new Date();
      const completionCount = 1;

      savedRecipe.dishPhoto = dishPhoto;
      savedRecipe.cookedAt = cookedAt;
      savedRecipe.completionCount = completionCount;

      const updatedRecipe = await savedRecipe.save();

      expect(updatedRecipe.dishPhoto?.url).toBe(dishPhoto.url);
      expect(updatedRecipe.cookedAt).toEqual(cookedAt);
      expect(updatedRecipe.completionCount).toBe(completionCount);
    });
  });

  describe('Validation Edge Cases', () => {
    it('should trim whitespace from dish photo URL', async () => {
      const dishPhoto = {
        url: '  https://example.com/photo.jpg  ',
        publicId: '  photo123  '
      };

      const recipe = new Recipe({
        ...validRecipeData,
        dishPhoto
      });

      const savedRecipe = await recipe.save();
      expect(savedRecipe.dishPhoto?.url).toBe('https://example.com/photo.jpg');
      expect(savedRecipe.dishPhoto?.publicId).toBe('photo123');
    });

    it('should handle empty dish photo object', async () => {
      const recipe = new Recipe({
        ...validRecipeData,
        dishPhoto: {} as IDishPhoto
      });

      const savedRecipe = await recipe.save();
      expect(savedRecipe.dishPhoto?.url).toBeUndefined();
      expect(savedRecipe.dishPhoto?.publicId).toBeUndefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with existing recipe structure', async () => {
      // Simulate existing recipe without new fields
      const existingRecipeData = {
        title: 'Existing Recipe',
        description: 'An existing recipe',
        ingredients: [{ name: 'Salt', amount: '1', unit: 'tsp' }],
        instructions: ['Add salt'],
        cookingTime: 5,
        servings: 1,
        difficulty: 'easy' as const,
        dietaryTags: [],
        language: 'en' as const,
        userId: new mongoose.Types.ObjectId(),
        originalIngredients: ['salt'],
        isSaved: true
      };

      const recipe = new Recipe(existingRecipeData);
      const savedRecipe = await recipe.save();

      expect(savedRecipe.completionCount).toBe(0);
      expect(savedRecipe.dishPhoto).toBeUndefined();
      expect(savedRecipe.cookedAt).toBeUndefined();
      expect(savedRecipe.isSaved).toBe(true);
    });
  });
});