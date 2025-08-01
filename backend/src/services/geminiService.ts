import { GoogleGenerativeAI } from '@google/generative-ai';

interface RecipeGenerationOptions {
  ingredients: string[];
  language: 'en' | 'it';
  dietaryRestrictions?: string[];
  servings?: number;
  cookingTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface ChatOptions {
  message: string;
  recipe?: any;
  language?: 'en' | 'it';
  context?: string;
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
  stepTimers?: number[]; // Timer in minutes for each step
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  cookingTips: Array<{
    step: number;
    tip: string;
    type: 'technique' | 'timing' | 'ingredient' | 'temperature' | 'safety';
  }>;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY environment variable is not set. Using mock recipe generation.');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
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

    // Recipe generation is always fresh - no caching

    // If no API key is configured, return a mock recipe
    if (!this.model) {
      console.log('🎭 Using mock recipe generation (no Gemini API key configured)');
      const mockRecipe = this.createMockRecipe(ingredients, language, servings, cookingTime || 30, difficulty || 'easy');
      return mockRecipe;
    }

    const prompt = this.buildPrompt(ingredients, language, dietaryRestrictions, servings, cookingTime, difficulty);

    try {
      const result = await this.retryApiCall(() => this.model.generateContent(prompt)) as any;
      const response = await result.response;
      const text = response.text();

      const generatedRecipe = this.parseRecipeResponse(text, language);
      
      return generatedRecipe;
    } catch (error) {
      console.log('Error generating recipe with Gemini:', error);
      
      // If it's a parsing error, log more details
      if (error instanceof Error && error.message.includes('JSON')) {
        console.log('🚨 JSON parsing failed. This may be due to Gemini returning non-JSON response.');
        console.log('🔄 Consider checking the prompt or adjusting the parsing logic.');
      }
      
      console.log('🔄 Falling back to mock recipe due to error');
      const fallbackRecipe = this.createMockRecipe(ingredients, language, servings, cookingTime || 30, difficulty || 'easy');
      
      return fallbackRecipe;
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
  "stepTimers": [5, 10, 15],
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "easy",
  "dietaryTags": ["vegetarian", "gluten-free"],
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbohydrates": 35,
    "fat": 18,
    "fiber": 8,
    "sugar": 12,
    "sodium": 650
  },
  "cookingTips": [
    {
      "step": 1,
      "tip": "Make sure to preheat the pan before adding oil",
      "type": "technique"
    },
    {
      "step": 2,
      "tip": "Don't overcook the vegetables to maintain their crunch",
      "type": "timing"
    }
  ]
}

Important:
- Only use the provided ingredients as main ingredients
- You can add common seasonings and basic ingredients (salt, pepper, oil, etc.)
- Ensure the recipe is practical and achievable
- Include dietary tags if applicable
- Provide accurate nutritional information per serving
- Add helpful cooking tips for key steps (max 5 tips)
- Tip types: technique, timing, ingredient, temperature, safety
- Instructions should be clear and detailed
- For ingredients without specific units (like spices), use "to taste", "pinch", "dash", etc.
- Never leave the "unit" field empty - always provide a unit
- stepTimers should contain the estimated time in minutes for each cooking step
- Each timer in stepTimers corresponds to the instruction at the same index
- Timer should be realistic for the cooking step (e.g., 2-3 mins for sautéing, 10-15 mins for simmering)
- If a step doesn't need timing, use 0 or omit that timer`
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
  "stepTimers": [5, 10, 15],
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "easy",
  "dietaryTags": ["vegetarian", "gluten-free"],
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbohydrates": 35,
    "fat": 18,
    "fiber": 8,
    "sugar": 12,
    "sodium": 650
  },
  "cookingTips": [
    {
      "step": 1,
      "tip": "Assicurati di preriscaldare la padella prima di aggiungere l'olio",
      "type": "technique"
    },
    {
      "step": 2,
      "tip": "Non cuocere troppo le verdure per mantenere la croccantezza",
      "type": "timing"
    }
  ]
}

Importante:
- Usa solo gli ingredienti forniti come ingredienti principali
- Puoi aggiungere condimenti comuni e ingredienti di base (sale, pepe, olio, ecc.)
- Assicurati che la ricetta sia pratica e realizzabile
- Includi tag dietetici se applicabile
- Fornisci informazioni nutrizionali accurate per porzione
- Aggiungi consigli di cottura utili per i passaggi chiave (max 5 consigli)
- Tipi di consigli: technique, timing, ingredient, temperature, safety
- Le istruzioni devono essere chiare e dettagliate`
      }
    };

    const selectedPrompt = prompts[language];
    return `${selectedPrompt.base}\n\n${selectedPrompt.constraints.join('\n')}\n\n${selectedPrompt.format}\n\nIMPORTANT: Respond ONLY with the JSON object. Do not include any explanatory text before or after the JSON. Start your response with { and end with }.`;
  }

  private parseRecipeResponse(response: string, language: 'en' | 'it'): GeneratedRecipe {
    try {
      console.log('🔍 Raw Gemini response (first 500 chars):', response.substring(0, 500));
      
      // Extract JSON from response - try multiple patterns
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try looking for JSON wrapped in code blocks
        jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        // Try looking for JSON without code blocks but with ```
        jsonMatch = response.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        console.log('❌ No JSON found in Gemini response. Full response:', response);
        throw new Error('No JSON found in response');
      }
      
      console.log('✅ Found JSON:', jsonMatch[0]);
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.title || !parsed.description || !parsed.ingredients || !parsed.instructions) {
        console.log('❌ Missing required fields in recipe response:', {
          hasTitle: !!parsed.title,
          hasDescription: !!parsed.description,
          hasIngredients: !!parsed.ingredients,
          hasInstructions: !!parsed.instructions
        });
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

      // Ensure step timers is an array (or undefined)
      const stepTimers = parsed.stepTimers && Array.isArray(parsed.stepTimers) 
        ? parsed.stepTimers.map((timer: any) => typeof timer === 'number' ? timer : 0)
        : undefined;

      // Set defaults for missing fields
      const recipe: GeneratedRecipe = {
        title: parsed.title,
        description: parsed.description,
        ingredients,
        instructions,
        stepTimers,
        cookingTime: parsed.cookingTime || 30,
        servings: parsed.servings || 4,
        difficulty: parsed.difficulty || 'medium',
        dietaryTags: parsed.dietaryTags || [],
        nutrition: parsed.nutrition,
        cookingTips: parsed.cookingTips || []
      };

      return recipe;
    } catch (error) {
      console.log('Error parsing recipe response:', error);
      
      // Return a basic fallback recipe
      return this.createFallbackRecipe(language);
    }
  }

  private createMockRecipe(
    ingredients: string[], 
    language: 'en' | 'it', 
    servings: number, 
    cookingTime: number, 
    difficulty: string
  ): GeneratedRecipe {
    const mockRecipes = {
      en: {
        title: `Delicious ${ingredients.join(' & ')} Dish`,
        description: `A tasty recipe using ${ingredients.join(', ')} perfect for ${servings} people`,
        baseIngredients: ingredients.map(ing => ({
          name: ing,
          amount: servings > 4 ? '2-3' : '1-2',
          unit: ing.toLowerCase().includes('oil') ? 'tbsp' : ing.toLowerCase().includes('rice') || ing.toLowerCase().includes('pasta') ? 'cups' : 'pieces'
        })),
        additionalIngredients: [
          { name: 'olive oil', amount: '2', unit: 'tbsp' },
          { name: 'salt', amount: '1', unit: 'tsp' },
          { name: 'black pepper', amount: '1/2', unit: 'tsp' }
        ],
        instructions: [
          'Prepare and wash all ingredients thoroughly',
          'Heat olive oil in a large pan over medium heat',
          `Add ${ingredients.slice(0, 2).join(' and ')} to the pan and cook for 5-7 minutes`,
          'Season with salt and pepper to taste',
          `Add remaining ingredients (${ingredients.slice(2).join(', ')}) and cook for ${Math.max(10, cookingTime - 10)} minutes`,
          'Stir occasionally and adjust seasoning if needed',
          `Serve hot for ${servings} people and enjoy!`
        ],
        stepTimers: [3, 2, 6, 1, Math.max(10, cookingTime - 10), 0, 0]
      },
      it: {
        title: `Deliziosa Ricetta con ${ingredients.join(' e ')}`,
        description: `Una ricetta gustosa usando ${ingredients.join(', ')} perfetta per ${servings} persone`,
        baseIngredients: ingredients.map(ing => ({
          name: ing,
          amount: servings > 4 ? '2-3' : '1-2',
          unit: ing.toLowerCase().includes('olio') ? 'cucchiai' : ing.toLowerCase().includes('riso') || ing.toLowerCase().includes('pasta') ? 'tazze' : 'pezzi'
        })),
        additionalIngredients: [
          { name: 'olio di oliva', amount: '2', unit: 'cucchiai' },
          { name: 'sale', amount: '1', unit: 'cucchiaino' },
          { name: 'pepe nero', amount: '1/2', unit: 'cucchiaino' }
        ],
        instructions: [
          'Preparare e lavare tutti gli ingredienti accuratamente',
          'Scaldare l\'olio di oliva in una padella grande a fuoco medio',
          `Aggiungere ${ingredients.slice(0, 2).join(' e ')} alla padella e cuocere per 5-7 minuti`,
          'Condire con sale e pepe a piacere',
          `Aggiungere gli ingredienti rimanenti (${ingredients.slice(2).join(', ')}) e cuocere per ${Math.max(10, cookingTime - 10)} minuti`,
          'Mescolare occasionalmente e aggiustare il condimento se necessario',
          `Servire caldo per ${servings} persone e buon appetito!`
        ],
        stepTimers: [3, 2, 6, 1, Math.max(10, cookingTime - 10), 0, 0]
      }
    };

    const selectedRecipe = mockRecipes[language];
    const allIngredients = [...selectedRecipe.baseIngredients, ...selectedRecipe.additionalIngredients];

    // Mock nutrition data based on typical values
    const mockNutrition = {
      calories: Math.round(300 + (servings * 50) + (ingredients.length * 30)),
      protein: Math.round(15 + (ingredients.length * 5)),
      carbohydrates: Math.round(25 + (ingredients.length * 8)),
      fat: Math.round(12 + (ingredients.length * 3)),
      fiber: Math.round(4 + (ingredients.length * 2)),
      sugar: Math.round(8 + (ingredients.length * 1.5)),
      sodium: Math.round(400 + (servings * 50))
    };

    // Mock cooking tips
    const mockTips = {
      en: [
        { step: 1, tip: "Make sure all ingredients are at room temperature for better cooking", type: "ingredient" as const },
        { step: 2, tip: "Preheat the pan properly to avoid sticking", type: "technique" as const },
        { step: 3, tip: "Don't overcook the vegetables to maintain nutrients", type: "timing" as const }
      ],
      it: [
        { step: 1, tip: "Assicurati che tutti gli ingredienti siano a temperatura ambiente per una cottura migliore", type: "ingredient" as const },
        { step: 2, tip: "Preriscalda bene la padella per evitare che si attacchi", type: "technique" as const },
        { step: 3, tip: "Non cuocere troppo le verdure per mantenere i nutrienti", type: "timing" as const }
      ]
    };

    return {
      title: selectedRecipe.title,
      description: selectedRecipe.description,
      ingredients: allIngredients,
      instructions: selectedRecipe.instructions,
      stepTimers: selectedRecipe.stepTimers,
      cookingTime: cookingTime,
      servings: servings,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      dietaryTags: [],
      nutrition: mockNutrition,
      cookingTips: mockTips[language]
    };
  }

  async chatWithAI(options: ChatOptions): Promise<string> {
    const { message, recipe, language = 'it', context = 'general' } = options;

    // If no API key is configured, throw error
    if (!this.model) {
      throw new Error('Gemini API key not configured. Please configure GEMINI_API_KEY environment variable.');
    }

    const prompt = this.buildChatPrompt(message, recipe, language, context);

    try {
      const result = await this.retryApiCall(() => this.model.generateContent(prompt)) as any;
      const response = await result.response;
      const text = response.text();

      return text.trim();
    } catch (error) {
      console.log('Error generating AI chat response:', error);
      
      // Handle specific error types
      if (error instanceof Error && error.message.includes('503')) {
        throw new Error('Il servizio AI è temporaneamente sovraccarico. Riprova tra qualche minuto.');
      }
      if (error instanceof Error && error.message.includes('429')) {
        throw new Error('Troppi richieste. Riprova tra qualche secondo.');
      }
      
      throw new Error('Errore nel servizio AI. Riprova più tardi.');
    }
  }

  private buildChatPrompt(message: string, recipe: any, language: 'en' | 'it', context: string): string {
    const prompts = {
      en: {
        roleContext: `You are an experienced Italian chef and cooking assistant. You help users with recipes, cooking tips, and food-related questions.`,
        recipeContext: recipe ? `Current recipe context:
Title: ${recipe.title}
Description: ${recipe.description}
Ingredients: ${recipe.ingredients?.map((ing: any) => `${ing.amount} ${ing.unit} ${ing.name}`).join(', ')}
Instructions: ${recipe.instructions?.join('; ')}
Cooking time: ${recipe.cookingTime} minutes
Servings: ${recipe.servings}
Difficulty: ${recipe.difficulty}` : '',
        userMessage: `User question: ${message}`,
        instructions: `IMPORTANT: Always respond BRIEFLY and CONCISELY (maximum 2-3 sentences). Avoid long explanations.

If the user asks to modify the recipe (keywords: "add", "remove", "change", "modify", "reduce", "increase", "substitute", "put", "insert"), use EXACTLY this format:

RECIPE_MODIFICATION_START
{
  "type": "recipe_update",
  "changes": {
    "title": "new title if changed",
    "description": "new description if changed",
    "ingredients": [{"name": "ingredient", "amount": "quantity", "unit": "unit"}],
    "instructions": ["step 1", "step 2"],
    "cookingTime": 30,
    "servings": 4,
    "difficulty": "easy"
  },
  "explanation": "Brief explanation (1 sentence)"
}
RECIPE_MODIFICATION_END

INGREDIENT RULES:
- ONLY add real, edible food ingredients (vegetables, meat, fish, cheese, spices, herbs, condiments)
- Keep ingredients consistent with the dish type (don't completely change the recipe nature)
- Use realistic, commonly available ingredients
- Use reasonable quantities for the number of servings
- DO NOT add non-food items, tools, or equipment

For general questions, respond only with 1-2 brief sentences.`
      },
      it: {
        roleContext: `Sei un chef italiano esperto e assistente di cucina. Aiuti gli utenti con ricette, consigli di cucina e domande relative al cibo.`,
        recipeContext: recipe ? `Contesto della ricetta attuale:
Titolo: ${recipe.title}
Descrizione: ${recipe.description}
Ingredienti: ${recipe.ingredients?.map((ing: any) => `${ing.amount} ${ing.unit} ${ing.name}`).join(', ')}
Istruzioni: ${recipe.instructions?.join('; ')}
Tempo di cottura: ${recipe.cookingTime} minuti
Porzioni: ${recipe.servings}
Difficoltà: ${recipe.difficulty}` : '',
        userMessage: `Domanda dell'utente: ${message}`,
        instructions: `IMPORTANTE: Rispondi sempre in modo BREVE e CONCISO (massimo 2-3 frasi).

Se l'utente chiede di modificare la ricetta (parole chiave: "aggiungi", "togli", "rimuovi", "cambia", "modifica", "riduci", "aumenta", "sostituisci", "metti", "inserisci", "invece", "al posto", "senza", "non ho", "sostituire", "cambiare", "eliminare"), restituisci la ricetta COMPLETA MODIFICATA:

RECIPE_MODIFICATION_START
{
  "type": "recipe_update",
  "changes": {
    "title": "titolo ricetta",
    "description": "descrizione",
    "ingredients": [
      // TUTTI gli ingredienti esistenti + nuovi
    ],
    "instructions": [
      // TUTTE le istruzioni MODIFICATE per includere i nuovi ingredienti
      // Specifica QUANDO aggiungere i nuovi ingredienti
    ],
    "cookingTime": 30,
    "servings": 4,
    "difficulty": "easy"
  },
  "explanation": "Ho modificato la ricetta secondo la tua richiesta."
}
RECIPE_MODIFICATION_END

ATTENZIONE: 
1. AGGIORNA SEMPRE le istruzioni quando modifichi ingredienti!
2. Gli ingredienti DEVONO essere oggetti con "name", "amount", "unit" - NON stringhe!
3. Esempi di modifiche:
   - "aggiungi prosciutto" → Aggiungi prosciutto agli ingredienti e alle istruzioni
   - "togli il sale" → Rimuovi il sale dalla lista ingredienti
   - "sostituisci la mozzarella con gorgonzola" → Cambia mozzarella con gorgonzola
   - "non ho la mozzarella" → Suggerisci sostituto e aggiorna ricetta
   - "riduci il sale" → Diminuisci quantità del sale
   - "aumenta le porzioni" → Aumenta servings e quantità ingredienti

Corretto: {"name": "Prosciutto", "amount": "100", "unit": "g"}
Sbagliato: "100 g Prosciutto"

Per domande generali, rispondi normalmente.`
      }
    };

    const selectedPrompt = prompts[language];
    return [
      selectedPrompt.roleContext,
      selectedPrompt.recipeContext,
      selectedPrompt.userMessage,
      selectedPrompt.instructions
    ].filter(Boolean).join('\n\n');
  }

  private async retryApiCall<T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors
        if (error instanceof Error && error.message.includes('401')) {
          throw error;
        }
        
        // Retry on 503 (service unavailable) and 429 (rate limit)
        if (error instanceof Error && (error.message.includes('503') || error.message.includes('429'))) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`🔄 API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For other errors, don't retry
        throw error;
      }
    }
    
    throw lastError!;
  }

  private buildChatPrompt_old(message: string, recipe: any, language: 'en' | 'it', context: string): string {
    const prompts = {
      en: {
        roleContext: `You are an experienced Italian chef and cooking assistant. You help users with recipes, cooking tips, and food-related questions.`,
        recipeContext: recipe ? `Current recipe context:
Title: ${recipe.title}
Description: ${recipe.description}
Ingredients: ${recipe.ingredients?.map((ing: any) => `${ing.amount} ${ing.unit} ${ing.name}`).join(', ')}
Instructions: ${recipe.instructions?.join('; ')}
Cooking time: ${recipe.cookingTime} minutes
Servings: ${recipe.servings}
Difficulty: ${recipe.difficulty}` : '',
        userMessage: `User question: ${message}`,
        instructions: `IMPORTANT: Always respond BRIEFLY and CONCISELY (maximum 2-3 sentences). Avoid long explanations.

If the user asks to modify the recipe (keywords: "add", "remove", "change", "modify", "reduce", "increase", "substitute", "put", "insert"), use EXACTLY this format:

RECIPE_MODIFICATION_START
{
  "type": "recipe_update",
  "changes": {
    "ingredients": [{"name": "ingredient", "amount": "quantity", "unit": "unit"}],
    "instructions": ["step 1", "step 2"],
    "cookingTime": 30,
    "servings": 4,
    "difficulty": "easy"
  },
  "explanation": "Brief explanation (1 sentence)"
}
RECIPE_MODIFICATION_END

For general questions, respond only with 1-2 brief sentences.`
      },
      it: {
        roleContext: `Sei un chef italiano esperto e assistente di cucina. Aiuti gli utenti con ricette, consigli di cucina e domande relative al cibo.`,
        recipeContext: recipe ? `Contesto della ricetta attuale:
Titolo: ${recipe.title}
Descrizione: ${recipe.description}
Ingredienti: ${recipe.ingredients?.map((ing: any) => `${ing.amount} ${ing.unit} ${ing.name}`).join(', ')}
Istruzioni: ${recipe.instructions?.join('; ')}
Tempo di cottura: ${recipe.cookingTime} minuti
Porzioni: ${recipe.servings}
Difficoltà: ${recipe.difficulty}` : '',
        userMessage: `Domanda dell'utente: ${message}`,
        instructions: `IMPORTANTE: Rispondi sempre in modo BREVE e CONCISO (massimo 2-3 frasi).

Se l'utente chiede di modificare la ricetta (parole chiave: "aggiungi", "togli", "rimuovi", "cambia", "modifica", "riduci", "aumenta", "sostituisci", "metti", "inserisci", "invece", "al posto", "senza", "non ho", "sostituire", "cambiare", "eliminare"), restituisci la ricetta COMPLETA MODIFICATA:

RECIPE_MODIFICATION_START
{
  "type": "recipe_update",
  "changes": {
    "title": "titolo ricetta",
    "description": "descrizione",
    "ingredients": [
      // TUTTI gli ingredienti esistenti + nuovi
    ],
    "instructions": [
      // TUTTE le istruzioni MODIFICATE per includere i nuovi ingredienti
      // Specifica QUANDO aggiungere i nuovi ingredienti
    ],
    "cookingTime": 30,
    "servings": 4,
    "difficulty": "easy"
  },
  "explanation": "Ho modificato la ricetta secondo la tua richiesta."
}
RECIPE_MODIFICATION_END

ATTENZIONE: 
1. AGGIORNA SEMPRE le istruzioni quando modifichi ingredienti!
2. Gli ingredienti DEVONO essere oggetti con "name", "amount", "unit" - NON stringhe!
3. Esempi di modifiche:
   - "aggiungi prosciutto" → Aggiungi prosciutto agli ingredienti e alle istruzioni
   - "togli il sale" → Rimuovi il sale dalla lista ingredienti
   - "sostituisci la mozzarella con gorgonzola" → Cambia mozzarella con gorgonzola
   - "non ho la mozzarella" → Suggerisci sostituto e aggiorna ricetta
   - "riduci il sale" → Diminuisci quantità del sale
   - "aumenta le porzioni" → Aumenta servings e quantità ingredienti

Corretto: {"name": "Prosciutto", "amount": "100", "unit": "g"}
Sbagliato: "100 g Prosciutto"

Per domande generali, rispondi normalmente.`
      }
    };

    const selectedPrompt = prompts[language];
    return [
      selectedPrompt.roleContext,
      selectedPrompt.recipeContext,
      selectedPrompt.userMessage,
      selectedPrompt.instructions
    ].filter(Boolean).join('\n\n');
  }

  private createMockChatResponse(message: string, language: 'en' | 'it'): string {
    const lowerMessage = message.toLowerCase();
    const modificationKeywords = {
      it: ['aggiungi', 'togli', 'rimuovi', 'cambia', 'modifica', 'riduci', 'aumenta', 'sostituisci', 'metti', 'inserisci'],
      en: ['add', 'remove', 'change', 'modify', 'reduce', 'increase', 'substitute', 'put', 'insert']
    };
    
    const isModification = modificationKeywords[language].some(keyword => lowerMessage.includes(keyword));
    
    if (isModification) {
      // Return modification format for mock responses
      const mockModifications = {
        it: `RECIPE_MODIFICATION_START
{
  "type": "recipe_update",
  "changes": {
    "ingredients": [{
      "name": "${lowerMessage.includes('prosciutto') ? 'prosciutto cotto' : 'nuovo ingrediente'}",
      "amount": "100",
      "unit": "g"
    }]
  },
  "explanation": "Ho aggiunto l'ingrediente richiesto alla ricetta."
}
RECIPE_MODIFICATION_END`,
        en: `RECIPE_MODIFICATION_START
{
  "type": "recipe_update",
  "changes": {
    "ingredients": [{
      "name": "${lowerMessage.includes('ham') ? 'cooked ham' : 'new ingredient'}",
      "amount": "100",
      "unit": "g"
    }]
  },
  "explanation": "Added the requested ingredient to the recipe."
}
RECIPE_MODIFICATION_END`
      };
      
      return mockModifications[language];
    }
    
    // Regular responses for non-modification questions
    const mockResponses = {
      en: [
        "That's an interesting question! I'd suggest trying that modification.",
        "Great idea! You could definitely try that approach.",
        "That would work well with this recipe."
      ],
      it: [
        "Ottima idea! Potresti provare quella modifica.",
        "Bella proposta! Funzionerebbe bene con questa ricetta.",
        "È un approccio interessante da provare."
      ]
    };

    const responses = mockResponses[language];
    return responses[Math.floor(Math.random() * responses.length)];
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
      dietaryTags: [],
      cookingTips: []
    };
  }
}