import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';

const geminiService = new GeminiService();

// Common food ingredients validation
const isValidIngredient = (ingredientName: string): boolean => {
  if (!ingredientName || typeof ingredientName !== 'string') return false;
  
  const name = ingredientName.toLowerCase().trim();
  
  // Lista nera di elementi non alimentari
  const forbiddenItems = [
    'utensile', 'utensili', 'strumento', 'strumenti', 'pentola', 'pentole',
    'padella', 'padelle', 'forchetta', 'forchette', 'coltello', 'coltelli',
    'cucchiaio', 'cucchiai', 'spatola', 'spatole', 'frullatore', 'mixer',
    'forno', 'microonde', 'frigorifero', 'freezer', 'lavastoviglie',
    'tagliere', 'taglieri', 'mestolo', 'mestoli', 'scolapasta', 'colino',
    'grattugia', 'apriscatole', 'cavatappi', 'termometro', 'bilancia',
    'timer', 'sveglia', 'orologio', 'telefono', 'cellulare', 'computer',
    'tablet', 'televisore', 'tv', 'radio', 'stereo', 'musica',
    'plastica', 'vetro', 'metallo', 'legno', 'carta', 'cartone',
    'detersivo', 'sapone', 'shampoo', 'bagnoschiuma', 'dentifricio',
    'medicina', 'farmaco', 'aspirina', 'antibiotico', 'vitamina',
    'integratore', 'supplemento', 'pillola', 'pastiglia', 'compressa',
    'alcool', 'etanolo', 'benzina', 'gasolio', 'petrolio', 'olio motore',
    'inchiostro', 'penna', 'matita', 'pennarello', 'evidenziatore',
    'libro', 'giornale', 'rivista', 'quaderno', 'foglio', 'carta',
    'vestito', 'vestiti', 'maglietta', 'pantaloni', 'scarpe', 'calze',
    'cappello', 'berretto', 'giacca', 'cappotto', 'guanti', 'sciarpa',
    'borsa', 'valigia', 'zaino', 'portafoglio', 'portamonete',
    'chiavi', 'serratura', 'lucchetto', 'catena', 'fune', 'corda',
    'nastro', 'colla', 'scotch', 'graffetta', 'spilla', 'ago',
    'filo', 'bottone', 'zip', 'velcro', 'elastico', 'gomma',
    'automobile', 'auto', 'macchina', 'moto', 'motorino', 'bicicletta',
    'bici', 'monopattino', 'autobus', 'treno', 'aereo', 'nave',
    'bitcoin', 'euro', 'dollaro', 'soldi', 'denaro', 'banconota',
    'moneta', 'carta credito', 'bancomat', 'conto', 'banca',
    'iphone', 'android', 'samsung', 'apple', 'google', 'microsoft',
    'facebook', 'instagram', 'twitter', 'tiktok', 'youtube',
    'netflix', 'amazon', 'ebay', 'paypal', 'spotify', 'whatsapp'
  ];
  
  // Controlla se contiene elementi proibiti
  if (forbiddenItems.some(forbidden => name.includes(forbidden))) {
    return false;
  }
  
  // Controlla se è troppo lungo (probabilmente non è un ingrediente)
  if (name.length > 50) {
    return false;
  }
  
  // Controlla se contiene numeri (probabilmente non è un ingrediente base)
  if (/\d/.test(name) && !name.includes('pepe') && !name.includes('spezie')) {
    return false;
  }
  
  return true;
};

// Validate cooking instructions
const isValidInstruction = (instruction: string): boolean => {
  if (!instruction || typeof instruction !== 'string') return false;
  
  const instr = instruction.toLowerCase().trim();
  
  // Lista nera di istruzioni non culinarie
  const forbiddenInstructions = [
    'accendi il telefono', 'chiama', 'invia messaggio', 'scrivi email',
    'apri il computer', 'vai online', 'naviga', 'cerca su internet',
    'guarda la tv', 'ascolta musica', 'accendi la radio',
    'metti in macchina', 'vai al supermercato', 'compra',
    'prendi i soldi', 'paga', 'carta di credito', 'bancomat',
    'indossa', 'vestiti', 'scarpe', 'giacca', 'cappotto',
    'prendi le chiavi', 'chiudi la porta', 'accendi la luce',
    'spegni la luce', 'apri la finestra', 'chiudi la finestra'
  ];
  
  // Controlla se contiene istruzioni proibite
  if (forbiddenInstructions.some(forbidden => instr.includes(forbidden))) {
    return false;
  }
  
  // Controlla se è troppo lunga (probabilmente non è un'istruzione di cucina)
  if (instr.length > 300) {
    return false;
  }
  
  return true;
};

export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, recipe, context } = req.body;

    if (!message) {
      res.status(400).json({
        error: 'Message is required'
      });
      return;
    }

    // Detect language from user context or default to Italian
    const user = (req as any).user;
    const language = user?.language || 'it';

    const response = await geminiService.chatWithAI({
      message,
      recipe,
      language,
      context: context || 'recipe_modification'
    });

    // Debug logging
    console.log('🔍 AI Response:', response);
    console.log('🔍 User message:', message);
    console.log('🔍 Recipe context:', recipe?.title || 'No recipe');

    // Check if the response contains recipe modifications
    const modificationMatch = response.match(/RECIPE_MODIFICATION_START\s*([\s\S]*?)\s*RECIPE_MODIFICATION_END/);
    console.log('🔍 Modification match:', modificationMatch ? 'FOUND' : 'NOT FOUND');
    if (modificationMatch) {
      console.log('🔍 Raw modification JSON:', modificationMatch[1]);
    }
    
    if (modificationMatch) {
      try {
        const modificationData = JSON.parse(modificationMatch[1]);
        console.log('🔍 Parsed modification data:', JSON.stringify(modificationData, null, 2));
        const explanation = modificationData.explanation || '';
        
        // Merge ingredients if we're adding new ones
        let updatedRecipe = { ...recipe };
        
        if (modificationData.changes.ingredients) {
          // If we have new ingredients, merge them with existing ones
          const existingIngredients = recipe?.ingredients || [];
          const newIngredients = modificationData.changes.ingredients;
          
          // Validate ingredients are food items
          const validatedIngredients = newIngredients.filter((ing: any) => 
            isValidIngredient(ing.name)
          );
          
          if (validatedIngredients.length !== newIngredients.length) {
            console.log('⚠️ Some ingredients were filtered out as invalid');
          }
          
          // Check if we're adding new ingredients or replacing
          const isAddingIngredients = validatedIngredients.length === 1 && 
            !existingIngredients.find((ing: any) => ing.name.toLowerCase() === validatedIngredients[0].name.toLowerCase());
          
          if (isAddingIngredients) {
            // Add new ingredient to existing ones
            updatedRecipe.ingredients = [...existingIngredients, ...validatedIngredients];
          } else {
            // Replace all ingredients
            updatedRecipe.ingredients = validatedIngredients;
          }
        }
        
        // Apply other changes - only allow specific recipe fields
        const allowedFields = ['title', 'description', 'instructions', 'cookingTime', 'servings', 'difficulty', 'dietaryTags'];
        
        Object.keys(modificationData.changes).forEach(key => {
          if (key !== 'ingredients' && allowedFields.includes(key)) {
            if (key === 'instructions' && Array.isArray(modificationData.changes[key])) {
              // Handle complex instructions format from Gemini 2.5
              const instructions = modificationData.changes[key];
              if (instructions.length > 0 && typeof instructions[0] === 'object') {
                // If instructions are objects, keep existing instructions for now
                console.log('🔍 Complex instructions detected, keeping existing ones');
              } else {
                // Simple string array - validate instructions are cooking-related
                const validInstructions = instructions.filter((instruction: string) => 
                  isValidInstruction(instruction)
                );
                updatedRecipe[key] = validInstructions;
              }
            } else {
              updatedRecipe[key] = modificationData.changes[key];
            }
          } else if (key !== 'ingredients') {
            console.log(`⚠️ Skipping invalid field: ${key}`);
          }
        });
        
        // Remove the JSON part from the response and keep only the explanation
        const cleanResponse = response.replace(/RECIPE_MODIFICATION_START[\s\S]*?RECIPE_MODIFICATION_END/, '').trim() || explanation;
        
        res.status(200).json({
          success: true,
          response: cleanResponse,
          hasModifications: true,
          modifications: updatedRecipe,
          context: {
            language,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.log('Error parsing recipe modifications:', error);
        // If parsing fails, return the response as normal text
        res.status(200).json({
          success: true,
          response: response.replace(/RECIPE_MODIFICATION_START[\s\S]*?RECIPE_MODIFICATION_END/, '').trim(),
          hasModifications: false,
          context: {
            language,
            timestamp: new Date().toISOString()
          }
        });
      }
    } else {
      // Normal response without modifications
      res.status(200).json({
        success: true,
        response,
        hasModifications: false,
        context: {
          language,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.log('AI Chat Error:', error);
    res.status(500).json({
      error: 'Failed to process AI chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};