import { Request, Response } from 'express';
import { saveRecipe } from '../recipeController';
import { Recipe, IRecipe } from '../../models/Recipe';
import { AuthRequest } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../models/Recipe');

const mockRecipe = Recipe as jest.Mocked<typeof Recipe>;

describe('saveRecipe', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      user: { _id: 'user123' },
      params: {},
      body: {}
    } as any;
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Dish Photo Validation', () => {
    it('should reject invalid dish photo URL format', async () => {
      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        dishPhoto: {
          url: 'invalid-url',
          publicId: 'test_123'
        }
      };

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid dish photo URL format'
      });
    });

    it('should accept valid HTTP dish photo URL', async () => {
      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        isSaved: false,
        completionCount: 0,
        dishPhoto: undefined as any,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        dishPhoto: {
          url: 'http://example.com/image.jpg',
          publicId: 'test_123'
        }
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockRecipeDoc.dishPhoto).toEqual({
        url: 'http://example.com/image.jpg',
        publicId: 'test_123'
      });
    });

    it('should accept valid HTTPS dish photo URL', async () => {
      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        isSaved: false,
        completionCount: 0,
        dishPhoto: undefined as any,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        dishPhoto: {
          url: 'https://cloudinary.com/image.jpg',
          publicId: 'test_123'
        }
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockRecipeDoc.dishPhoto).toEqual({
        url: 'https://cloudinary.com/image.jpg',
        publicId: 'test_123'
      });
    });
  });

  describe('CookedAt Validation', () => {
    it('should reject invalid cookedAt date format', async () => {
      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        cookedAt: 'invalid-date'
      };

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid cooked date - must be a valid date not in the future'
      });
    });

    it('should reject future cookedAt date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        cookedAt: futureDate.toISOString()
      };

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid cooked date - must be a valid date not in the future'
      });
    });

    it('should accept valid past cookedAt date', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        isSaved: false,
        completionCount: 0,
        cookedAt: undefined as any,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        cookedAt: pastDate.toISOString()
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockRecipeDoc.cookedAt).toEqual(pastDate);
    });

    it('should accept current time as cookedAt', async () => {
      const now = new Date();

      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        isSaved: false,
        completionCount: 0,
        cookedAt: undefined as any,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        cookedAt: now.toISOString()
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockRecipeDoc.cookedAt).toEqual(now);
    });
  });

  describe('Completion Count Logic', () => {
    it('should increment completion count when cookedAt is provided for existing recipe', async () => {
      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        isSaved: false,
        completionCount: 2,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        cookedAt: new Date().toISOString()
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockRecipeDoc.completionCount).toBe(3);
      expect(mockRecipeDoc.save).toHaveBeenCalled();
    });

    it('should not increment completion count when cookedAt is not provided', async () => {
      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        isSaved: false,
        completionCount: 2,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {};

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockRecipeDoc.completionCount).toBe(2);
      expect(mockRecipeDoc.save).toHaveBeenCalled();
    });

    it('should set completion count to 1 for new recipe with cookedAt', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockRecipeInstance = {
        save: mockSave
      };
      
      (mockRecipe as any).mockImplementation(() => mockRecipeInstance);

      mockReq.body = {
        title: 'Test Recipe',
        description: 'Test Description',
        ingredients: [{ name: 'Test', amount: '1', unit: 'cup' }],
        instructions: ['Test instruction'],
        cookingTime: 30,
        servings: 4,
        difficulty: 'easy',
        language: 'en',
        originalIngredients: ['Test'],
        cookedAt: new Date().toISOString()
      };

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockSave).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it('should not set completion count for new recipe without cookedAt', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockRecipeInstance = {
        save: mockSave
      };
      
      (mockRecipe as any).mockImplementation(() => mockRecipeInstance);

      mockReq.body = {
        title: 'Test Recipe',
        description: 'Test Description',
        ingredients: [{ name: 'Test', amount: '1', unit: 'cup' }],
        instructions: ['Test instruction'],
        cookingTime: 30,
        servings: 4,
        difficulty: 'easy',
        language: 'en',
        originalIngredients: ['Test']
      };

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockSave).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });

  describe('Recipe Association Logic', () => {
    it('should associate dish photo with existing recipe', async () => {
      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        isSaved: false,
        completionCount: 0,
        dishPhoto: undefined as any,
        cookedAt: undefined as any,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        dishPhoto: {
          url: 'https://cloudinary.com/image.jpg',
          publicId: 'dish_123'
        },
        cookedAt: new Date().toISOString()
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockRecipeDoc.dishPhoto).toEqual({
        url: 'https://cloudinary.com/image.jpg',
        publicId: 'dish_123'
      });
      expect(mockRecipeDoc.isSaved).toBe(true);
      expect(mockRecipeDoc.completionCount).toBe(1);
      expect(mockRecipeDoc.save).toHaveBeenCalled();
    });

    it('should handle dish photo without publicId', async () => {
      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        isSaved: false,
        completionCount: 0,
        dishPhoto: undefined as any,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        dishPhoto: {
          url: 'https://cloudinary.com/image.jpg'
        }
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockRecipeDoc.dishPhoto).toEqual({
        url: 'https://cloudinary.com/image.jpg',
        publicId: ''
      });
    });

    it('should create new recipe with dish photo and completion data', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockRecipeInstance = {
        save: mockSave
      };
      
      (mockRecipe as any).mockImplementation(() => mockRecipeInstance);

      mockReq.body = {
        title: 'Test Recipe',
        description: 'Test Description',
        ingredients: [{ name: 'Test', amount: '1', unit: 'cup' }],
        instructions: ['Test instruction'],
        cookingTime: 30,
        servings: 4,
        difficulty: 'easy',
        language: 'en',
        originalIngredients: ['Test'],
        dishPhoto: {
          url: 'https://cloudinary.com/image.jpg',
          publicId: 'dish_123'
        },
        cookedAt: new Date().toISOString()
      };

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockSave).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockReq.params = { id: 'recipe123' };
      mockReq.body = {};

      mockRecipe.findOne.mockRejectedValue(new Error('Database error'));

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });

    it('should handle recipe not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = {
        title: 'Test Recipe',
        description: 'Test Description',
        ingredients: [{ name: 'Test', amount: '1', unit: 'cup' }],
        instructions: ['Test instruction'],
        cookingTime: 30,
        servings: 4,
        difficulty: 'easy',
        language: 'en',
        originalIngredients: ['Test']
      };

      mockRecipe.findOne.mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(true);
      const mockRecipeInstance = {
        save: mockSave
      };
      
      (mockRecipe as any).mockImplementation(() => mockRecipeInstance);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Recipe saved successfully',
        data: expect.any(Object)
      });
    });

    it('should handle missing recipe data for new recipe', async () => {
      mockReq.body = null;

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Recipe data is required'
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete cooking flow with photo and timestamp', async () => {
      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        title: 'Pasta Recipe',
        isSaved: false,
        completionCount: 0,
        dishPhoto: undefined as any,
        cookedAt: undefined as any,
        save: jest.fn().mockResolvedValue(true)
      };

      const cookedDate = new Date();
      cookedDate.setMinutes(cookedDate.getMinutes() - 30);

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        dishPhoto: {
          url: 'https://cloudinary.com/pasta-dish.jpg',
          publicId: 'dish_pasta_123'
        },
        cookedAt: cookedDate.toISOString()
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockRecipeDoc.isSaved).toBe(true);
      expect(mockRecipeDoc.dishPhoto).toEqual({
        url: 'https://cloudinary.com/pasta-dish.jpg',
        publicId: 'dish_pasta_123'
      });
      expect(mockRecipeDoc.cookedAt).toEqual(cookedDate);
      expect(mockRecipeDoc.completionCount).toBe(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Recipe saved successfully',
        data: mockRecipeDoc
      });
    });

    it('should handle recipe completion without photo', async () => {
      const mockRecipeDoc = {
        _id: 'recipe123',
        userId: 'user123',
        title: 'Simple Recipe',
        isSaved: false,
        completionCount: 1,
        dishPhoto: undefined as any,
        cookedAt: undefined as any,
        save: jest.fn().mockResolvedValue(true)
      };

      const cookedDate = new Date();

      mockReq.params = { id: 'recipe123' };
      mockReq.body = {
        cookedAt: cookedDate.toISOString()
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeDoc as any);

      await saveRecipe(mockReq as AuthRequest, mockRes as Response);

      expect(mockRecipeDoc.isSaved).toBe(true);
      expect(mockRecipeDoc.dishPhoto).toBeUndefined();
      expect(mockRecipeDoc.cookedAt).toEqual(cookedDate);
      expect(mockRecipeDoc.completionCount).toBe(2);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });
});