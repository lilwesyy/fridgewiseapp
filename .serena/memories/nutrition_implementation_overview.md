# Nutritional Values Implementation in FridgeWise

## Overview
The FridgeWise recipe system has comprehensive nutritional values implementation across the full stack, recently added to provide detailed nutrition information for generated recipes.

## Data Model (Backend)
- **Location**: `backend/src/models/Recipe.ts`
- **Interface**: `INutritionInfo` with 7 nutritional fields:
  - calories (number)
  - protein (grams)
  - carbohydrates (grams) 
  - fat (grams)
  - fiber (grams)
  - sugar (grams)
  - sodium (milligrams)
- **Schema**: `nutritionInfoSchema` with validation rules
- **Integration**: Optional `nutrition` field in Recipe model

## Data Generation (AI Service)
- **Location**: `backend/src/services/geminiService.ts`
- **Primary Source**: Google Gemini AI with structured prompts
- **Fallback**: Mock nutrition calculator based on ingredients/servings
- **Prompt**: Explicitly requests "accurate nutritional information per serving"

## Frontend Display
- **Location**: `frontend/mobile/src/components/RecipeScreen.tsx`
- **Layout**: Grid display with color-coded values
- **Languages**: English/Italian support
- **Features**: Per-serving calculations, secondary nutrients display