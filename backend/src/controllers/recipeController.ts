import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Recipe } from '../models/Recipe';
import { SavedPublicRecipe } from '../models/SavedPublicRecipe';
import { Rating } from '../models/Rating';
import { GeminiService } from '../services/geminiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { DailyUsage } from '../models/DailyUsage';
import { APIResponse } from '@/types';

// Helper function to normalize dietary tags
const normalizeDietaryTags = (tags: string[]): string[] => {
  if (!tags || !Array.isArray(tags)) return [];
  
  const validTags = [
    'vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo',
    'quick', 'slow-cooking', 'no-cook', 'high-protein', 'high-fiber', 'low-sodium', 'sugar-free',
    'mediterranean', 'asian', 'italian', 'mexican', 'spicy', 'mild', 'one-pot', 'grilled', 'baked', 'raw',
    'whole30', 'fodmap-friendly', 'anti-inflammatory'
  ];
  const tagMap: { [key: string]: string } = {
    // Italian mappings - Dietetici
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
    // Tempo di preparazione
    'veloce': 'quick',
    'rapido': 'quick',
    'cottura lenta': 'slow-cooking',
    'lenta cottura': 'slow-cooking',
    'senza cottura': 'no-cook',
    // Contenuto nutrizionale
    'ricco di proteine': 'high-protein',
    'proteico': 'high-protein',
    'ricco di fibre': 'high-fiber',
    'poco sale': 'low-sodium',
    'povero di sodio': 'low-sodium',
    'senza zucchero': 'sugar-free',
    'senza zuccheri': 'sugar-free',
    // Stile culinario
    'mediterraneo': 'mediterranean',
    'asiatico': 'asian',
    'italiano': 'italian',
    'messicano': 'mexican',
    // Intensità sapore
    'piccante': 'spicy',
    'delicato': 'mild',
    // Modalità cottura
    'una pentola': 'one-pot',
    'pentola unica': 'one-pot',
    'alla griglia': 'grilled',
    'grigliato': 'grilled',
    'al forno': 'baked',
    'infornato': 'baked',
    'crudo': 'raw',
    // Diete specializzate
    'antinfiammatorio': 'anti-inflammatory',
    'anti-infiammatorio': 'anti-inflammatory',
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

    // Increment daily usage counter after successful generation
    try {
      await DailyUsage.incrementRecipeGeneration(user.id);
    } catch (usageError) {
      console.error('Failed to increment daily usage:', usageError);
      // Don't fail the request if usage tracking fails
    }

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
    const { dishPhoto, cookedAt, ...otherData } = req.body || {};

    // Validate dishPhoto URL if provided
    if (dishPhoto && dishPhoto.url) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(dishPhoto.url)) {
        res.status(400).json({
          success: false,
          error: 'Invalid dish photo URL format'
        });
        return;
      }
    }

    // Validate cookedAt timestamp if provided
    if (cookedAt) {
      const cookedDate = new Date(cookedAt);
      if (isNaN(cookedDate.getTime()) || cookedDate > new Date()) {
        res.status(400).json({
          success: false,
          error: 'Invalid cooked date - must be a valid date not in the future'
        });
        return;
      }
    }

    // If id is provided, try to find existing recipe
    if (id) {
      const recipe = await Recipe.findOne({ 
      _id: id, 
      userId: user._id,
      isDeleted: false // Exclude soft-deleted recipes
    });
      
      if (recipe) {
        // Mark existing recipe as saved
        recipe.isSaved = true;
        
        // Handle dish photo and completion logic
        if (dishPhoto && dishPhoto.url) {
          // Check if we already have 3 photos
          if (recipe.dishPhotos.length >= 3) {
            res.status(400).json({
              success: false,
              error: 'Maximum 3 photos allowed per recipe'
            });
            return;
          }
          
          // Add new photo to array
          recipe.dishPhotos.push({
            url: dishPhoto.url,
            publicId: dishPhoto.publicId || ''
          });
        }
        
        if (cookedAt) {
          recipe.cookedAt = new Date(cookedAt);
        }
        
        // Update completion count when recipe is completed with cooking date
        if (cookedAt) {
          recipe.completionCount = (recipe.completionCount || 0) + 1;
        }
        
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
    const recipeData = otherData;
    
    if (!recipeData || Object.keys(recipeData).length === 0) {
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

    // Prepare new recipe data
    const newRecipeData: any = {
      ...cleanRecipeData,
      userId: user._id,
      isSaved: false, // Don't add to collection yet - only when cooking is finished
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add dish photo if provided
    if (dishPhoto && dishPhoto.url) {
      newRecipeData.dishPhotos = [{
        url: dishPhoto.url,
        publicId: dishPhoto.publicId || ''
      }];
    }

    // Add cooked date if provided
    if (cookedAt) {
      newRecipeData.cookedAt = new Date(cookedAt);
      // Set initial completion count to 1 if recipe is being completed
      newRecipeData.completionCount = 1;
    }

    const newRecipe = new Recipe(newRecipeData);
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
    const filter: any = { 
      userId: user._id,
      isDeleted: false // Exclude soft-deleted recipes
    };
    
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

    // Get user's own saved recipes
    const ownRecipesFilter: any = { 
      userId: user._id,
      isSaved: true, // Only saved recipes
      isDeleted: false // Exclude soft-deleted recipes
    };

    if (req.query.difficulty) {
      ownRecipesFilter.difficulty = req.query.difficulty;
    }
    
    if (req.query.dietaryTags) {
      const tags = (req.query.dietaryTags as string).split(',');
      ownRecipesFilter.dietaryTags = { $in: tags };
    }

    if (req.query.search) {
      const searchTerm = req.query.search as string;
      ownRecipesFilter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { originalIngredients: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Get user's own recipes
    const ownRecipes = await Recipe.find(ownRecipesFilter)
      .sort({ createdAt: -1 })
      .lean();

    // Get saved public recipes
    const savedPublicRecipes = await SavedPublicRecipe.find({ userId: user._id })
      .populate({
        path: 'recipeId',
        match: { isDeleted: false },
        populate: {
          path: 'userId',
          select: 'name email avatar'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out null populated recipes and transform saved public recipes
    const transformedPublicRecipes = savedPublicRecipes
      .filter(saved => saved.recipeId) // Remove null populated recipes
      .map(saved => ({
        ...(saved.recipeId as any),
        isPublicRecipe: true,
        savedAt: saved.createdAt,
        cookedAt: saved.cookedAt,
        userRating: saved.rating,
        userComment: saved.comment,
        originalCreator: (saved.recipeId as any).userId
      }));

    // Apply filters to public recipes if needed
    let filteredPublicRecipes = transformedPublicRecipes;
    
    if (req.query.difficulty) {
      filteredPublicRecipes = filteredPublicRecipes.filter(recipe => recipe.difficulty === req.query.difficulty);
    }
    
    if (req.query.dietaryTags) {
      const tags = (req.query.dietaryTags as string).split(',');
      filteredPublicRecipes = filteredPublicRecipes.filter(recipe => 
        recipe.dietaryTags.some((tag: string) => tags.includes(tag))
      );
    }

    if (req.query.search) {
      const searchTerm = (req.query.search as string).toLowerCase();
      filteredPublicRecipes = filteredPublicRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm) ||
        recipe.originalIngredients.some((ingredient: string) => ingredient.toLowerCase().includes(searchTerm))
      );
    }

    // Combine and sort all recipes
    const allRecipes = [...ownRecipes, ...filteredPublicRecipes]
      .sort((a, b) => new Date(b.createdAt || b.savedAt).getTime() - new Date(a.createdAt || a.savedAt).getTime());

    // Apply pagination
    const paginatedRecipes = allRecipes.slice(skip, skip + limit);
    const total = allRecipes.length;

    res.status(200).json({
      success: true,
      data: {
        recipes: paginatedRecipes,
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

    const recipe = await Recipe.findOne({ 
      _id: id, 
      userId: user._id,
      isDeleted: false // Exclude soft-deleted recipes
    });

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

    const recipe = await Recipe.findOne({ 
      _id: id, 
      userId: user._id,
      isDeleted: false // Exclude soft-deleted recipes
    });
    
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

export const savePublicRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { cookedAt, rating, comment } = req.body || {};

    // Validate cookedAt timestamp if provided
    if (cookedAt) {
      const cookedDate = new Date(cookedAt);
      if (isNaN(cookedDate.getTime()) || cookedDate > new Date()) {
        res.status(400).json({
          success: false,
          error: 'Invalid cooked date - must be a valid date not in the future'
        });
        return;
      }
    }

    // Find the public recipe (not owned by current user)
    const publicRecipe = await Recipe.findOne({ 
      _id: id, 
      userId: { $ne: user._id }, // Not owned by current user
      isDeleted: false,
      $or: [
        { dishPhotos: { $exists: true, $ne: [] } },
        { cookedAt: { $exists: true, $ne: null } }
      ]
    });
    
    if (!publicRecipe) {
      res.status(404).json({
        success: false,
        error: 'Public recipe not found'
      });
      return;
    }

    // Create or update saved public recipe record
    const savedPublicRecipe = await SavedPublicRecipe.findOneAndUpdate(
      { userId: user._id, recipeId: id },
      { 
        cookedAt: cookedAt ? new Date(cookedAt) : new Date(),
        rating,
        comment
      },
      { new: true, upsert: true }
    );

    // Populate the recipe details
    await savedPublicRecipe.populate('recipeId');
    await savedPublicRecipe.populate('userId', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Public recipe saved to your collection successfully',
      data: savedPublicRecipe
    });
  } catch (error: any) {
    console.error('Error saving public recipe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save public recipe'
    });
  }
};

export const updateRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { title, description, ingredients, instructions, cookingTime, servings, difficulty, dietaryTags } = req.body;

    const recipe = await Recipe.findOne({ 
      _id: id, 
      userId: user._id,
      isDeleted: false // Exclude soft-deleted recipes
    });

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

    const recipe = await Recipe.findOne({ 
      _id: id, 
      userId: user._id,
      isDeleted: false // Only find non-deleted recipes
    });

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return;
    }

    // Soft delete: keep recipe if it was cooked (has completion history)
    if (recipe.completionCount > 0 || recipe.cookedAt) {
      console.log(`📚 Soft deleting recipe "${recipe.title}" - preserving cooking history (${recipe.completionCount} completions)`);
      
      // Soft delete - mark as deleted but keep in database for history
      recipe.isDeleted = true;
      recipe.deletedAt = new Date();
      recipe.isSaved = false; // Remove from saved recipes
      await recipe.save();

      res.status(200).json({
        success: true,
        message: 'Recipe removed successfully (cooking history preserved)'
      });
    } else {
      console.log(`🗑️ Hard deleting recipe "${recipe.title}" - no cooking history`);
      
      // Hard delete - recipe was never cooked, can be safely removed
      await Recipe.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Recipe deleted successfully'
      });
    }
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete recipe'
    });
  }
};

export const completeRecipe = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { cookedAt } = req.body;

    // Validate cookedAt timestamp if provided
    if (cookedAt) {
      const cookedDate = new Date(cookedAt);
      if (isNaN(cookedDate.getTime()) || cookedDate > new Date()) {
        res.status(400).json({
          success: false,
          error: 'Invalid cooked date - must be a valid date not in the future'
        });
        return;
      }
    }

    const recipe = await Recipe.findOne({ 
      _id: id, 
      userId: user._id,
      isDeleted: false // Exclude soft-deleted recipes
    });

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return;
    }

    // Mark recipe as saved and completed
    recipe.isSaved = true;
    
    if (cookedAt) {
      recipe.cookedAt = new Date(cookedAt);
    }
    
    // Update completion count
    recipe.completionCount = (recipe.completionCount || 0) + 1;
    
    await recipe.save();

    res.status(200).json({
      success: true,
      message: 'Recipe completed successfully',
      data: recipe
    });
  } catch (error: any) {
    console.error('Error completing recipe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete recipe'
    });
  }
};

export const getCookedRecipes = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get all recipes that were cooked (including soft-deleted ones)
    const filter: any = { 
      userId: user._id,
      $or: [
        { completionCount: { $gt: 0 } },
        { cookedAt: { $exists: true, $ne: null } }
      ]
    };

    if (req.query.search) {
      const searchTerm = req.query.search as string;
      filter.$and = [
        filter.$or, // Keep the cooked condition
        {
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { originalIngredients: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ];
      delete filter.$or; // Remove the top-level $or since we're using $and
    }

    const recipes = await Recipe.find(filter)
      .sort({ cookedAt: -1, updatedAt: -1 }) // Sort by cooked date, then update date
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude version field

    const total = await Recipe.countDocuments(filter);

    // Add cooking statistics to each recipe
    const recipesWithStats = recipes.map(recipe => {
      const recipeObj = recipe.toObject();
      return {
        ...recipeObj,
        cookingStats: {
          totalCompletions: recipe.completionCount,
          lastCooked: recipe.cookedAt,
          isDeleted: recipe.isDeleted,
          deletedAt: recipe.deletedAt
        }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        recipes: recipesWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting cooked recipes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cooked recipes'
    });
  }
};

export const deleteRecipePhoto = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { publicId, photoIndex } = req.body;

    if (typeof photoIndex !== 'number' || photoIndex < 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid photo index'
      });
      return;
    }

    const recipe = await Recipe.findOne({ 
      _id: id, 
      userId: user._id,
      isDeleted: false // Exclude soft-deleted recipes
    });

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return;
    }

    if (!recipe.dishPhotos || recipe.dishPhotos.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No photos found for this recipe'
      });
      return;
    }

    if (photoIndex >= recipe.dishPhotos.length) {
      res.status(400).json({
        success: false,
        error: 'Photo index out of range'
      });
      return;
    }

    // Get the photo to delete
    const photoToDelete = recipe.dishPhotos[photoIndex];
    
    // Delete from Cloudinary if publicId exists
    if (photoToDelete.publicId) {
      try {
        await cloudinaryService.deleteImage(photoToDelete.publicId);
        console.log(`✅ Photo deleted from Cloudinary: ${photoToDelete.publicId}`);
      } catch (cloudinaryError) {
        console.error('Failed to delete from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Remove photo from array
    recipe.dishPhotos.splice(photoIndex, 1);
    await recipe.save();

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      data: recipe
    });
  } catch (error: any) {
    console.error('Error deleting recipe photo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete photo'
    });
  }
};

// Get all public recipes (cooked recipes from all users)
export const getPublicRecipes = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'recent' // recent, popular, alphabetical
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build query for public recipes (recipes with photos or that have been cooked)
    const query: any = { 
      isDeleted: false,
      $or: [
        { dishPhotos: { $exists: true, $ne: [] } }, // Has photos
        { cookedAt: { $exists: true, $ne: null } } // Has been cooked
      ]
    };
    
    // Search in title and description
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } }
        ]
      });
    }

    // Build sort criteria
    let sort: any = {};
    switch (sortBy) {
      case 'popular':
        // Sort by average rating, then by number of ratings, then by dish photos
        sort = { averageRating: -1, totalRatings: -1, 'dishPhotos.length': -1, createdAt: -1 };
        break;
      case 'recent':
        sort = { cookedAt: -1, createdAt: -1 };
        break;
      case 'alphabetical':
        sort = { title: 1 };
        break;
      case 'rating':
        sort = { averageRating: -1, totalRatings: -1 };
        break;
      default:
        sort = { cookedAt: -1, createdAt: -1 };
    }

    const recipes = await Recipe
      .find(query)
      .populate('userId', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Recipe.countDocuments(query);

    console.log('Public recipes with ratings:', recipes.map(r => ({ 
      title: r.title, 
      averageRating: r.averageRating, 
      totalRatings: r.totalRatings 
    })));

    res.json({
      success: true,
      data: {
        recipes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching public recipes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch public recipes'
    });
  }
};

// Get users who cooked a specific recipe
export const getUsersWhoCookedRecipe = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const { limit = 10 } = req.query;

    if (!recipeId) {
      res.status(400).json({
        success: false,
        error: 'Recipe ID is required'
      });
      return;
    }

    // Find the original recipe
    const originalRecipe = await Recipe.findById(recipeId).lean();
    
    if (!originalRecipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return;
    }

    // Get users who saved this public recipe (from SavedPublicRecipe model)
    console.log('🔍 Looking for SavedPublicRecipe with recipeId:', recipeId);
    
    // First, let's see all SavedPublicRecipe records to debug
    const allSavedRecipes = await SavedPublicRecipe.find({}).lean();
    console.log('📋 All SavedPublicRecipe records:', allSavedRecipes.length, allSavedRecipes);
    
    const savedPublicRecipes = await SavedPublicRecipe
      .find({ recipeId })
      .populate('userId', 'name email avatar')
      .sort({ cookedAt: -1 })
      .limit(Number(limit))
      .lean();
    
    console.log('✅ Found SavedPublicRecipes for this recipe:', savedPublicRecipes.length, savedPublicRecipes);

    // Also get users who cooked their own version of this recipe (legacy support)
    const cookedVersions = await Recipe
      .find({
        title: originalRecipe.title,
        userId: { $ne: originalRecipe.userId }, // Exclude the original creator
        isSaved: true,
        isDeleted: false,
        $or: [
          { dishPhotos: { $exists: true, $ne: [] } },
          { cookedAt: { $exists: true, $ne: null } }
        ]
      })
      .populate('userId', 'name email avatar')
      .select('userId cookedAt dishPhotos createdAt')
      .sort({ cookedAt: -1, createdAt: -1 })
      .lean();

    // Get all ratings for this recipe from the Rating model
    const ratings = await Rating.find({ recipeId }).lean();
    const ratingsMap = new Map();
    ratings.forEach(rating => {
      ratingsMap.set(rating.userId.toString(), {
        rating: rating.rating,
        comment: rating.comment
      });
    });

    // Combine users from both sources
    const userCookingMap = new Map();
    
    // Add users from SavedPublicRecipe
    console.log('Processing SavedPublicRecipes:', savedPublicRecipes.length);
    savedPublicRecipes.forEach(saved => {
      const userId = (saved.userId as any)._id.toString();
      const userData = saved.userId as any;
      
      // Get rating from Rating model (takes precedence over SavedPublicRecipe rating)
      const userRating = ratingsMap.get(userId) || { rating: saved.rating, comment: saved.comment };
      
      console.log('Adding user from SavedPublicRecipe:', {
        userId,
        name: userData.name,
        rating: userRating.rating,
        comment: userRating.comment
      });
      
      if (!userCookingMap.has(userId)) {
        userCookingMap.set(userId, {
          user: {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar
          },
          cookedAt: saved.cookedAt,
          hasPhoto: false, // SavedPublicRecipe doesn't have photos
          photoUrl: null,
          rating: userRating.rating,
          comment: userRating.comment
        });
      }
    });
    
    // Add users from legacy cooked versions
    cookedVersions.forEach(recipe => {
      const userId = (recipe.userId as any)._id.toString();
      const userData = recipe.userId as any;
      
      if (!userCookingMap.has(userId)) {
        // Get rating from Rating model
        const userRating = ratingsMap.get(userId);
        
        userCookingMap.set(userId, {
          user: {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar
          },
          cookedAt: recipe.cookedAt,
          hasPhoto: recipe.dishPhotos && recipe.dishPhotos.length > 0,
          photoUrl: recipe.dishPhotos && recipe.dishPhotos.length > 0 ? recipe.dishPhotos[0].url : null,
          rating: userRating?.rating,
          comment: userRating?.comment
        });
      }
    });

    const uniqueUsers = Array.from(userCookingMap.values());

    res.json({
      success: true,
      data: {
        users: uniqueUsers,
        total: uniqueUsers.length,
        recipeTitle: originalRecipe.title
      }
    });
  } catch (error: any) {
    console.error('Error fetching users who cooked recipe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users who cooked this recipe'
    });
  }
};


