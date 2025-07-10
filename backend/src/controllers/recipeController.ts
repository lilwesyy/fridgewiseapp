import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Recipe } from '../models/Recipe';
import { GeminiService } from '../services/geminiService';
import { APIResponse } from '@/types';

export const generateRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { 
      ingredients, 
      language = user.preferredLanguage,
      dietaryRestrictions,
      servings,
      cookingTime,
      difficulty,
      // Support for new frontend parameter names
      portions,
      maxTime
    } = req.body;

    // Validate ingredients
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Ingredients are required'
      });
      return;
    }

    // Generate recipe with Gemini AI
    const geminiService = new GeminiService();
    const generatedRecipe = await geminiService.generateRecipe({
      ingredients,
      language: language || 'en',
      dietaryRestrictions: dietaryRestrictions || user.dietaryRestrictions,
      servings: portions || servings || 4, // Use portions from frontend, fallback to servings or 4
      cookingTime: maxTime || cookingTime || 30, // Use maxTime from frontend, fallback to cookingTime or 30
      difficulty: difficulty || 'easy'
    });

    // Clean ingredients to ensure all required fields are present
    const cleanedIngredients = generatedRecipe.ingredients.map((ingredient: any) => {
      let defaultUnit = 'to taste';
      if (language === 'it') {
        defaultUnit = 'q.b.'; // quanto basta
      }
      
      return {
        name: ingredient.name || '',
        amount: ingredient.amount || '',
        unit: ingredient.unit && ingredient.unit.trim() !== '' ? ingredient.unit : defaultUnit
      };
    });

    // Create recipe object without saving to database
    const recipe = {
      ...generatedRecipe,
      ingredients: cleanedIngredients,
      userId: user._id,
      originalIngredients: ingredients,
      language: language || 'en',
      isSaved: false,
      // Add a temporary ID for frontend use
      _id: null,
      id: null
    };

    res.status(201).json({
      success: true,
      data: recipe
    });
  } catch (error: any) {
    console.error('Recipe generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Recipe generation failed'
    });
  }
};

export const saveRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // If id is provided, try to find existing recipe
    if (id) {
      const recipe = await Recipe.findOne({ _id: id, userId: user._id });
      
      if (recipe) {
        // Mark existing recipe as saved
        recipe.isSaved = true;
        await recipe.save();

        res.status(200).json({
          success: true,
          message: 'Recipe saved successfully',
          data: recipe
        });
        return;
      }
    }

    // If no id or recipe not found, create a new recipe from request body
    const recipeData = req.body;
    
    if (!recipeData) {
      res.status(400).json({
        success: false,
        error: 'Recipe data is required'
      });
      return;
    }

    const newRecipe = new Recipe({
      ...recipeData,
      userId: user._id,
      isSaved: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newRecipe.save();

    res.status(201).json({
      success: true,
      message: 'Recipe saved successfully',
      data: newRecipe
    });
  } catch (error: any) {
    console.error('Error saving recipe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save recipe'
    });
  }
};

export const getRecipes = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query filters
    const filter: any = { userId: user._id };
    
    if (req.query.language) {
      filter.language = req.query.language;
    }
    
    if (req.query.difficulty) {
      filter.difficulty = req.query.difficulty;
    }
    
    if (req.query.dietaryTags) {
      const tags = (req.query.dietaryTags as string).split(',');
      filter.dietaryTags = { $in: tags };
    }

    if (req.query.search) {
      const searchTerm = req.query.search as string;
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { originalIngredients: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const recipes = await Recipe.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Recipe.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        recipes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recipes'
    });
  }
};

export const getSavedRecipes = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { 
      userId: user._id,
      isSaved: true // Only saved recipes
    };

    if (req.query.difficulty) {
      filter.difficulty = req.query.difficulty;
    }
    
    if (req.query.dietaryTags) {
      const tags = (req.query.dietaryTags as string).split(',');
      filter.dietaryTags = { $in: tags };
    }

    if (req.query.search) {
      const searchTerm = req.query.search as string;
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { originalIngredients: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const recipes = await Recipe.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Recipe.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        recipes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get saved recipes'
    });
  }
};

export const getRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const recipe = await Recipe.findOne({ _id: id, userId: user._id });

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recipe'
    });
  }
};

export const unsaveRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const recipe = await Recipe.findOne({ _id: id, userId: user._id });
    
    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return;
    }

    // Mark recipe as not saved
    recipe.isSaved = false;
    await recipe.save();

    res.status(200).json({
      success: true,
      message: 'Recipe removed from saved successfully',
      data: recipe
    });
  } catch (error: any) {
    console.error('Error removing recipe from saved:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove recipe from saved'
    });
  }
};

export const updateRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { title, description, ingredients, instructions, cookingTime, servings, difficulty, dietaryTags } = req.body;

    const recipe = await Recipe.findOne({ _id: id, userId: user._id });

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return;
    }

    // Update recipe fields
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      id,
      {
        title,
        description,
        ingredients,
        instructions,
        cookingTime,
        servings,
        difficulty,
        dietaryTags
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updatedRecipe
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Recipe update failed'
    });
  }
};

export const deleteRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const recipe = await Recipe.findOne({ _id: id, userId: user._id });

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return;
    }

    await Recipe.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete recipe'
    });
  }
};


