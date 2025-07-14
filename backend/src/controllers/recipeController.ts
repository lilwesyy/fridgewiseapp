import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Recipe } from '../models/Recipe';
import { GeminiService } from '../services/geminiService';
import { APIResponse } from '@/types';

// Helper function to normalize dietary tags
const normalizeDietaryTags = (tags: string[]): string[] => {
  if (!tags || !Array.isArray(tags)) return [];
  
  const validTags = ['vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'];
  const tagMap: { [key: string]: string } = {
    // Italian mappings
    'vegetariano': 'vegetarian',
    'vegano': 'vegan',
    'pescetariano': 'pescatarian',
    'senza glutine': 'gluten-free',
    'senza lattosio': 'dairy-free',
    'senza latte': 'dairy-free',
    'senza frutta secca': 'nut-free',
    'senza soia': 'soy-free',
    'senza uova': 'egg-free',
    'low carb': 'low-carb',
    'basso contenuto di carboidrati': 'low-carb',
    'chetogenico': 'keto',
    'paleo': 'paleo',
    // Common variations
    'gluten-free': 'gluten-free',
    'dairy-free': 'dairy-free',
    'nut-free': 'nut-free',
    'egg-free': 'egg-free',
    'low-carb': 'low-carb'
  };
  
  const normalizedTags: string[] = [];
  
  for (const tag of tags) {
    if (!tag || typeof tag !== 'string') continue;
    
    const lowercaseTag = tag.toLowerCase().trim();
    
    // Direct match
    if (validTags.includes(lowercaseTag)) {
      normalizedTags.push(lowercaseTag);
      continue;
    }
    
    // Mapped match
    if (tagMap[lowercaseTag]) {
      normalizedTags.push(tagMap[lowercaseTag]);
      continue;
    }
    
    // Partial match for common cases
    if (lowercaseTag.includes('vegetarian') || lowercaseTag.includes('vegetariano')) {
      normalizedTags.push('vegetarian');
    } else if (lowercaseTag.includes('vegan') || lowercaseTag.includes('vegano')) {
      normalizedTags.push('vegan');
    } else if (lowercaseTag.includes('gluten') && (lowercaseTag.includes('free') || lowercaseTag.includes('senza'))) {
      normalizedTags.push('gluten-free');
    } else if ((lowercaseTag.includes('dairy') || lowercaseTag.includes('latte') || lowercaseTag.includes('lattosio')) && (lowercaseTag.includes('free') || lowercaseTag.includes('senza'))) {
      normalizedTags.push('dairy-free');
    }
  }
  
  // Remove duplicates
  return [...new Set(normalizedTags)];
};

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

    // Use dietary restrictions from user profile (database) as priority
    const userDietaryRestrictions = user.dietaryRestrictions || [];
    const finalDietaryRestrictions = dietaryRestrictions 
      ? [...userDietaryRestrictions, ...dietaryRestrictions].filter((v, i, a) => a.indexOf(v) === i) // merge and deduplicate
      : userDietaryRestrictions;

    console.log(`🍽️ Using dietary restrictions: ${finalDietaryRestrictions.join(', ') || 'none'} for user ${user.email}`);

    // Generate recipe with Gemini AI
    const geminiService = new GeminiService();
    const generatedRecipe = await geminiService.generateRecipe({
      ingredients,
      language: language || user.preferredLanguage || 'en',
      dietaryRestrictions: finalDietaryRestrictions,
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
      // Normalize dietary tags to ensure they match the validation schema
      dietaryTags: normalizeDietaryTags(generatedRecipe.dietaryTags || []),
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

export const createRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const recipeData = req.body;
    
    if (!recipeData) {
      res.status(400).json({
        success: false,
        error: 'Recipe data is required'
      });
      return;
    }

    // Remove null/undefined id fields that come from frontend
    const cleanRecipeData = { ...recipeData };
    delete cleanRecipeData._id;
    delete cleanRecipeData.id;

    // Normalize dietary tags to ensure they match the validation schema
    if (cleanRecipeData.dietaryTags) {
      cleanRecipeData.dietaryTags = normalizeDietaryTags(cleanRecipeData.dietaryTags);
    }

    // Clean ingredients to ensure all required fields are present
    const cleanedIngredients = cleanRecipeData.ingredients?.map((ingredient: any) => {
      let defaultUnit = 'to taste';
      if (cleanRecipeData.language === 'it') {
        defaultUnit = 'q.b.'; // quanto basta
      }
      
      return {
        name: ingredient.name || '',
        amount: ingredient.amount || '',
        unit: ingredient.unit && ingredient.unit.trim() !== '' ? ingredient.unit : defaultUnit
      };
    }) || [];

    const newRecipe = new Recipe({
      ...cleanRecipeData,
      ingredients: cleanedIngredients,
      userId: user._id,
      originalIngredients: cleanRecipeData.originalIngredients || cleanRecipeData.ingredients?.map((ing: any) => ing.name) || [],
      language: cleanRecipeData.language || 'en',
      isSaved: false, // Create without saving to collection
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newRecipe.save();

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: newRecipe
    });
  } catch (error: any) {
    console.error('Error creating recipe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create recipe'
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

    // Remove null/undefined id fields that come from frontend
    const cleanRecipeData = { ...recipeData };
    delete cleanRecipeData._id;
    delete cleanRecipeData.id;

    // Normalize dietary tags to ensure they match the validation schema
    if (cleanRecipeData.dietaryTags) {
      cleanRecipeData.dietaryTags = normalizeDietaryTags(cleanRecipeData.dietaryTags);
    }

    const newRecipe = new Recipe({
      ...cleanRecipeData,
      userId: user._id,
      isSaved: false, // Don't add to collection yet - only when cooking is finished
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


