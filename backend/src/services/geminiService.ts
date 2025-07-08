import { GoogleGenerativeAI } from '@google/generative-ai';

interface RecipeGenerationOptions {
  ingredients: string[];
  language: 'en' | 'it';
  dietaryRestrictions?: string[];
  servings?: number;
  cookingTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface GeneratedRecipe {
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateRecipe(options: RecipeGenerationOptions): Promise<GeneratedRecipe> {
    const {
      ingredients,
      language,
      dietaryRestrictions = [],
      servings = 4,
      cookingTime,
      difficulty
    } = options;

    const prompt = this.buildPrompt(ingredients, language, dietaryRestrictions, servings, cookingTime, difficulty);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseRecipeResponse(text, language);
    } catch (error) {
      console.error('Error generating recipe with Gemini:', error);
      throw new Error('Failed to generate recipe');
    }
  }

  private buildPrompt(
    ingredients: string[],
    language: 'en' | 'it',
    dietaryRestrictions: string[],
    servings: number,
    cookingTime?: number,
    difficulty?: string
  ): string {
    const prompts = {
      en: {
        base: `Create a recipe using these ingredients: ${ingredients.join(', ')}`,
        constraints: [
          `Language: English`,
          `Servings: ${servings}`,
          dietaryRestrictions.length > 0 ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : '',
          cookingTime ? `Maximum cooking time: ${cookingTime} minutes` : '',
          difficulty ? `Difficulty level: ${difficulty}` : ''
        ].filter(Boolean),
        format: `
Please provide the recipe in the following JSON format:
{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity",
      "unit": "measurement unit"
    }
  ],
  "instructions": ["step 1", "step 2", "step 3"],
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "easy",
  "dietaryTags": ["vegetarian", "gluten-free"]
}

Important:
- Only use the provided ingredients as main ingredients
- You can add common seasonings and basic ingredients (salt, pepper, oil, etc.)
- Ensure the recipe is practical and achievable
- Include dietary tags if applicable
- Instructions should be clear and detailed`
      },
      it: {
        base: `Crea una ricetta usando questi ingredienti: ${ingredients.join(', ')}`,
        constraints: [
          `Lingua: Italiano`,
          `Porzioni: ${servings}`,
          dietaryRestrictions.length > 0 ? `Restrizioni dietetiche: ${dietaryRestrictions.join(', ')}` : '',
          cookingTime ? `Tempo di cottura massimo: ${cookingTime} minuti` : '',
          difficulty ? `Livello di difficoltà: ${difficulty}` : ''
        ].filter(Boolean),
        format: `
Fornisci la ricetta nel seguente formato JSON:
{
  "title": "Nome della Ricetta",
  "description": "Breve descrizione del piatto",
  "ingredients": [
    {
      "name": "nome ingrediente",
      "amount": "quantità",
      "unit": "unità di misura"
    }
  ],
  "instructions": ["passaggio 1", "passaggio 2", "passaggio 3"],
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "easy",
  "dietaryTags": ["vegetarian", "gluten-free"]
}

Importante:
- Usa solo gli ingredienti forniti come ingredienti principali
- Puoi aggiungere condimenti comuni e ingredienti di base (sale, pepe, olio, ecc.)
- Assicurati che la ricetta sia pratica e realizzabile
- Includi tag dietetici se applicabile
- Le istruzioni devono essere chiare e dettagliate`
      }
    };

    const selectedPrompt = prompts[language];
    return `${selectedPrompt.base}\n\n${selectedPrompt.constraints.join('\n')}\n\n${selectedPrompt.format}`;
  }

  private parseRecipeResponse(response: string, language: 'en' | 'it'): GeneratedRecipe {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.title || !parsed.description || !parsed.ingredients || !parsed.instructions) {
        throw new Error('Missing required fields in recipe response');
      }

      // Ensure ingredients have proper structure
      const ingredients = parsed.ingredients.map((ing: any) => ({
        name: ing.name || '',
        amount: ing.amount || '',
        unit: ing.unit || ''
      }));

      // Ensure instructions is an array
      const instructions = Array.isArray(parsed.instructions) 
        ? parsed.instructions 
        : [parsed.instructions];

      // Set defaults for missing fields
      const recipe: GeneratedRecipe = {
        title: parsed.title,
        description: parsed.description,
        ingredients,
        instructions,
        cookingTime: parsed.cookingTime || 30,
        servings: parsed.servings || 4,
        difficulty: parsed.difficulty || 'medium',
        dietaryTags: parsed.dietaryTags || []
      };

      return recipe;
    } catch (error) {
      console.error('Error parsing recipe response:', error);
      
      // Return a basic fallback recipe
      return this.createFallbackRecipe(language);
    }
  }

  private createFallbackRecipe(language: 'en' | 'it'): GeneratedRecipe {
    const fallbacks = {
      en: {
        title: 'Simple Mixed Ingredient Dish',
        description: 'A simple dish made with the provided ingredients',
        instructions: [
          'Prepare all ingredients by washing and chopping as needed',
          'Heat oil in a pan over medium heat',
          'Add ingredients and cook until tender',
          'Season with salt and pepper to taste',
          'Serve hot'
        ]
      },
      it: {
        title: 'Piatto Semplice con Ingredienti Misti',
        description: 'Un piatto semplice preparato con gli ingredienti forniti',
        instructions: [
          'Prepara tutti gli ingredienti lavandoli e tagliandoli se necessario',
          'Scalda l\'olio in una padella a fuoco medio',
          'Aggiungi gli ingredienti e cuoci fino a quando sono teneri',
          'Condisci con sale e pepe a piacere',
          'Servi caldo'
        ]
      }
    };

    const fallback = fallbacks[language];
    
    return {
      title: fallback.title,
      description: fallback.description,
      ingredients: [
        { name: 'Oil', amount: '2', unit: 'tbsp' },
        { name: 'Salt', amount: '1', unit: 'tsp' },
        { name: 'Pepper', amount: '1/2', unit: 'tsp' }
      ],
      instructions: fallback.instructions,
      cookingTime: 30,
      servings: 4,
      difficulty: 'easy',
      dietaryTags: []
    };
  }
}