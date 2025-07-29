import { SecureFormData as FormData } from '../utils/secureFormData';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';


interface ProcessedIngredient {
  name: string;
  category: string;
  confidence: number;
  source: 'gemini-vision' | 'fallback';
}

// Rimosso database statico - ora si basa completamente sui risultati dinamici di Gemini

export class EnhancedRecognizeService {
  private geminiApiKey: string;

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  async analyzeImage(imagePath: string, language: string = 'en'): Promise<ProcessedIngredient[]> {
    console.log('🔍 Starting enhanced image analysis for:', imagePath, 'Language:', language);
    console.log('🎯 Using Gemini Vision only (local services disabled)');

    // Only use Gemini Vision - local services disabled
    const results = await Promise.allSettled([
      this.analyzeWithGeminiVision(imagePath, language)
    ]);

    const allIngredients: ProcessedIngredient[] = [];

    // Process Gemini Vision results only
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        console.log(`✅ Gemini Vision found ${result.value.length} ingredients`);
        allIngredients.push(...result.value);
      } else {
        console.log(`❌ Gemini Vision failed or found no ingredients`);
      }
    });

    if (allIngredients.length === 0) {
      console.log('🔄 Gemini Vision failed, trying smart fallback');
      const fallbackResults = await this.getSmartFallback(imagePath, language);
      if (fallbackResults.length === 0) {
        console.log('❌ No ingredients detected in image - will trigger NoIngredientsModal');
        return []; // Return empty array to trigger NoIngredientsModal
      }
      return fallbackResults;
    }

    // Combina e deduplicana i risultati
    const finalResults = this.combineAndRankResults(allIngredients);
    
    if (finalResults.length === 0) {
      console.log('❌ All ingredients filtered out - will trigger NoIngredientsModal');
      return []; // Return empty array to trigger NoIngredientsModal
    }
    
    console.log(`🎯 Final combined results: ${finalResults.length} ingredients`);
    
    return finalResults;
  }

  private async analyzeWithGeminiVision(imagePath: string, language: string = 'en'): Promise<ProcessedIngredient[]> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not available');
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      // Add retry logic for 503 errors
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Gemini 2.5-pro attempt ${attempt}/3`);
          
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env.GEMINI_TIMEOUT_MS || '30000'), // Configurable timeout, increased default
            body: JSON.stringify({              contents: [{
                parts: [
                  {
                    text: this.getLanguageSpecificPrompt(language)
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: imageBase64
                    }
                  }
                ]
              }]
            })
          });

          if (response.ok) {
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!text) {
              throw new Error('No text response from Gemini');
            }

            // Parse JSON dalla risposta
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
              throw new Error('No JSON found in Gemini response');
            }

            const ingredients = JSON.parse(jsonMatch[0]);
            const processed = this.processGeminiResults(ingredients, language);
            console.log(`✅ Gemini Vision found ${processed.length} ingredients on attempt ${attempt}`);
            return processed;
          }

          // Handle specific error codes
          if (response.status === 503) {
            lastError = new Error(`Gemini 2.5 Pro API overloaded (503) - attempt ${attempt}`);
            if (attempt < 3) {
              console.log(`⏳ API overloaded, waiting ${attempt * 3}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 3000));
              continue;
            }
          } else if (response.status === 429) {
            lastError = new Error(`Gemini 2.5 Pro rate limited (429) - attempt ${attempt}`);
            if (attempt < 3) {
              console.log(`⏳ Rate limited, waiting ${attempt * 6}s...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 6000));
              continue;
            }
          } else if (response.status === 404) {
            // Gemini 2.5 might not be available, try fallback to 1.5
            console.log('🔄 Gemini 2.5 Pro not available, trying 1.5-flash...');
            return this.analyzeWithGemini15Fallback(imagePath, language);
          } else {
            lastError = new Error(`Gemini 2.5 Pro API error: ${response.status}`);
            break; // Don't retry for other errors
          }
        } catch (networkError) {
          lastError = networkError;
          if (attempt < 3) {
            console.log(`🔌 Network error, retrying in ${attempt * 2}s...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          }
        }
      }

      throw lastError;

    } catch (error) {
      console.error('❌ Gemini Vision error:', error);
      throw error;
    }
  }

  private getLanguageSpecificPrompt(language: string): string {
    if (language === 'it') {
      return `Sei Gemini 2.5 Pro che analizza un'immagine di cibo. Identifica TUTTI gli ingredienti alimentari visibili con massima precisione.

Restituisci SOLO un array JSON valido:
[{"name": "nome_ingrediente", "confidence": 0.95}]

Linee guida:
1. Per 'name': Usa nomi specifici italiani (es. 'pomodorini', 'peperone rosso', 'carne macinata', 'foglie di basilico fresco')
2. Includi SOLO ingredienti alimentari reali: verdure, frutta, carne, pesce, latticini, cereali, legumi, erbe, spezie, noci, oli
3. ESCLUDI: utensili, contenitori, imballaggi, sfondi, oggetti non alimentari
4. Confidence: 0.1-1.0 basato sulla chiarezza visiva
5. Restituisci massimo 1-25 ingredienti
6. Includi ingredienti parziali/tagliati se chiaramente identificabili
7. Sii accurato - includi spezie, erbe, condimenti se visibili
8. Distingui le varietà quando possibile

Esempio risposta:
[{"name": "pomodorini", "confidence": 0.95}, {"name": "basilico fresco", "confidence": 0.88}]

Concentrati su ingredienti alimentari reali che potrebbero essere usati in cucina.`;
    } else {
      return `You are Gemini 2.5 Pro analyzing a food image. Identify ALL visible food ingredients with maximum precision.

Return ONLY a valid JSON array:
[{"name": "ingredient_name", "confidence": 0.95}]

Guidelines:
1. For 'name': Use specific English names (e.g., 'cherry tomatoes', 'red bell pepper', 'ground beef', 'fresh basil leaves')
2. Include ONLY actual food ingredients: vegetables, fruits, meat, fish, dairy, grains, legumes, herbs, spices, nuts, oils
3. EXCLUDE: utensils, containers, packaging, backgrounds, non-food objects
4. Confidence: 0.1-1.0 based on visual clarity
5. Return 1-25 ingredients maximum
6. Include partial/cut ingredients if clearly identifiable
7. Be thorough - include spices, herbs, seasonings if visible
8. Distinguish varieties when possible

Example response:
[{"name": "cherry tomatoes", "confidence": 0.95}, {"name": "fresh basil", "confidence": 0.88}]

Focus on actual food ingredients that could be used in cooking.`;
    }
  }

  private async analyzeWithGemini15Fallback(imagePath: string, language: string = 'en'): Promise<ProcessedIngredient[]> {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      console.log('🔄 Using Gemini 1.5-flash as fallback...');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 25000,
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: this.getLanguageSpecificPrompt(language)
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini 1.5 fallback error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No text response from Gemini 1.5 fallback');
      }

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini 1.5 fallback response');
      }

      const ingredients = JSON.parse(jsonMatch[0]);
      const processed = this.processGeminiResults(ingredients, language);
      console.log(`✅ Gemini 1.5 fallback found ${processed.length} ingredients`);
      return processed;

    } catch (error) {
      console.error('❌ Gemini 1.5 fallback failed:', error);
      throw error;
    }
  }



  private processGeminiResults(ingredients: any[], language: string = 'en'): ProcessedIngredient[] {
    const processed: ProcessedIngredient[] = [];

    ingredients.forEach(item => {
      if (item.name && typeof item.confidence === 'number') {
        // Verifica se l'ingrediente sembra essere cibo
        if (this.looksLikeFood(item.name)) {
          const category = this.guessCategory(item.name);
          
          processed.push({
            name: item.name.toLowerCase().trim(),
            category,
            confidence: Math.min(item.confidence, 1),
            source: 'gemini-vision'
          });
          
          console.log(`✅ Gemini found ingredient: ${item.name} (${category})`);
        } else {
          console.log(`🚫 Gemini found non-food item: ${item.name}`);
        }
      }
    });

    return processed;
  }


  // Rimosso database statico e funzioni correlate

  private combineAndRankResults(ingredients: ProcessedIngredient[]): ProcessedIngredient[] {
    const ingredientMap = new Map<string, ProcessedIngredient>();

    console.log(`📊 Combining ${ingredients.length} raw ingredients...`);
    
    // Combina risultati dallo stesso ingrediente
    ingredients.forEach(ingredient => {
      const existing = ingredientMap.get(ingredient.name);
      
      if (existing) {
        // Se già esiste, prendi quello con confidence più alta
        // Ma aumenta confidence se trovato da fonti multiple
        const combinedConfidence = Math.min(
          Math.max(existing.confidence, ingredient.confidence) + 0.15, // Increased boost for multi-source
          1.0
        );
        
        console.log(`🔄 Combining ${ingredient.name}: ${existing.confidence.toFixed(2)} + ${ingredient.confidence.toFixed(2)} = ${combinedConfidence.toFixed(2)}`);
        
        if (ingredient.confidence > existing.confidence) {
          ingredientMap.set(ingredient.name, {
            ...ingredient,
            confidence: combinedConfidence
          });
        } else {
          existing.confidence = combinedConfidence;
        }
      } else {
        ingredientMap.set(ingredient.name, ingredient);
        console.log(`➕ Added ${ingredient.name} with confidence ${ingredient.confidence.toFixed(2)} from ${ingredient.source}`);
      }
    });

    // Converti a array e ordina per confidence
    const finalResults = Array.from(ingredientMap.values())
      .filter(ingredient => {
        const threshold = process.env.VISION_CONFIDENCE_THRESHOLD ? 
          parseFloat(process.env.VISION_CONFIDENCE_THRESHOLD) : 0.5; // Lowered default threshold
        
        const passed = ingredient.confidence >= threshold;
        if (!passed) {
          console.log(`🚫 Filtered out ${ingredient.name} (confidence ${ingredient.confidence.toFixed(2)} < ${threshold})`);
        }
        return passed;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, parseInt(process.env.VISION_MAX_RESULTS || '12')); // Configurable max results

    console.log(`🎯 Final filtered results: ${finalResults.length} ingredients`);
    finalResults.forEach(ing => {
      console.log(`  ✅ ${ing.name} (${ing.confidence.toFixed(2)}) from ${ing.source}`);
    });

    return finalResults;
  }

  private async getSmartFallback(imagePath: string, language: string = 'en'): Promise<ProcessedIngredient[]> {
    console.log('🧠 Using smart fallback analysis...');
    
    // Senza database statico, il fallback è limitato
    // In futuro si potrebbe implementare analisi del nome file o altri metodi
    console.log('🚫 No fallback ingredients available - returning empty result');
    return [];
  }

  async healthCheck(): Promise<{ gemini: boolean; overall: boolean }> {
    const checks = await Promise.allSettled([
      this.checkGeminiHealth()
    ]);

    const gemini = checks[0].status === 'fulfilled' && checks[0].value;

    return {
      gemini,
      overall: gemini
    };
  }

  private async checkGeminiHealth(): Promise<boolean> {
    return !!this.geminiApiKey;
  }


  private looksLikeFood(term: string): boolean {
    const normalizedTerm = term.toLowerCase().trim();
    
    // Lista ESTESA di termini che chiaramente NON sono cibo (inglese + italiano)
    const nonFoodTerms = [
      // Contenitori e utensili (EN + IT)
      'plate', 'bowl', 'dish', 'spoon', 'fork', 'knife', 'pan', 'pot', 'container', 'box', 
      'bag', 'wrapper', 'package', 'packaging', 'bottle', 'jar', 'can', 'tin', 'carton',
      'cutting board', 'chopping board', 'tray', 'basket', 'cooler', 'fridge', 'freezer',
      'piatto', 'ciotola', 'scodella', 'cucchiaio', 'forchetta', 'coltello', 'padella', 'pentola', 
      'contenitore', 'scatola', 'borsa', 'sacchetto', 'confezione', 'bottiglia', 'barattolo', 
      'lattina', 'vassoio', 'cestino', 'frigorifero', 'frigo', 'freezer', 'congelatore',
      
      // Elettrodomestici e mobili (EN + IT)
      'refrigerator', 'kitchen', 'counter', 'table', 'surface', 'cabinet', 'drawer', 'shelf',
      'appliance', 'home appliance', 'door', 'handle', 'light', 'lighting',
      'cucina', 'bancone', 'tavolo', 'superficie', 'mobile', 'cassetto', 'ripiano', 'scaffale',
      'elettrodomestico', 'porta', 'maniglia', 'luce', 'illuminazione',
      
      // Azioni e stati (EN + IT)
      'fill', 'filled', 'open', 'opened', 'close', 'closed', 'cut', 'sliced', 'chopped', 'diced',
      'cooking', 'preparation', 'eating', 'drinking', 'storage', 'storing',
      'riempire', 'pieno', 'aperto', 'chiuso', 'tagliato', 'affettato', 'tritato', 'a dadini',
      'cucinare', 'cottura', 'preparazione', 'mangiare', 'bere', 'conservazione',
      
      // Materiali (EN + IT)
      'plastic', 'glass', 'metal', 'wood', 'paper', 'cardboard', 'aluminum', 'steel',
      'ceramic', 'fabric', 'cloth', 'rubber',
      'plastica', 'vetro', 'metallo', 'legno', 'carta', 'cartone', 'alluminio', 'acciaio',
      'ceramica', 'tessuto', 'stoffa', 'gomma',
      
      // Colori e descrizioni generiche (EN + IT)
      'color', 'red', 'green', 'blue', 'yellow', 'white', 'black', 'brown', 'orange', 'purple',
      'pink', 'gray', 'grey', 'silver', 'gold', 'bright', 'dark', 'light', 'shadow',
      'colore', 'rosso', 'verde', 'blu', 'giallo', 'bianco', 'nero', 'marrone', 'arancione', 
      'viola', 'rosa', 'grigio', 'argento', 'oro', 'luminoso', 'scuro', 'chiaro', 'ombra',
      
      // Descrittori generici NON SPECIFICI (EN + IT)
      'fresh', 'organic', 'natural', 'healthy', 'raw', 'cooked', 'fried', 'baked', 'grilled',
      'prepared', 'processed', 'frozen', 'canned', 'dried', 'pickled',
      'fresco', 'biologico', 'naturale', 'sano', 'crudo', 'cotto', 'fritto', 'al forno', 
      'grigliato', 'preparato', 'lavorato', 'surgelato', 'in scatola', 'secco', 'sottaceto',
      
      // Persone e corpo umano (EN + IT)
      'person', 'people', 'man', 'woman', 'human', 'hand', 'finger', 'face', 'body',
      'child', 'adult', 'boy', 'girl',
      'persona', 'persone', 'uomo', 'donna', 'umano', 'mano', 'dito', 'viso', 'corpo',
      'bambino', 'adulto', 'ragazzo', 'ragazza',
      
      // Ambiente e luoghi (EN + IT)
      'indoor', 'outdoor', 'inside', 'outside', 'home', 'house', 'room', 'wall', 'floor',
      'ceiling', 'window', 'background', 'foreground', 'scene', 'view', 'space',
      'interno', 'esterno', 'dentro', 'fuori', 'casa', 'stanza', 'parete', 'pavimento',
      'soffitto', 'finestra', 'sfondo', 'primo piano', 'scena', 'vista', 'spazio',
      
      // Forme e dimensioni generiche (EN + IT)
      'round', 'square', 'long', 'short', 'big', 'small', 'large', 'tiny', 'huge',
      'thick', 'thin', 'wide', 'narrow', 'tall', 'low', 'high',
      'rotondo', 'quadrato', 'lungo', 'corto', 'grande', 'piccolo', 'enorme', 'minuscolo',
      'spesso', 'sottile', 'largo', 'stretto', 'alto', 'basso',
      
      // Termini troppo generici o categorie ampie (EN + IT)
      'food', 'ingredient', 'meal', 'dinner', 'lunch', 'breakfast', 'snack', 'dish',
      'vegetable', 'fruit', 'meat', 'dairy', 'grain', 'produce', 'grocery', 'item',
      'object', 'thing', 'stuff', 'piece', 'part', 'section', 'area', 'place', 'spot',
      'cibo', 'ingrediente', 'pasto', 'cena', 'pranzo', 'colazione', 'spuntino', 'piatto',
      'verdura', 'frutta', 'carne', 'latticini', 'cereale', 'prodotto', 'generi alimentari',
      'oggetto', 'cosa', 'roba', 'pezzo', 'parte', 'sezione', 'area', 'posto', 'punto',
      
      // Termini temporali (EN + IT)
      'day', 'night', 'morning', 'evening', 'noon', 'midnight', 'today', 'yesterday',
      'time', 'hour', 'minute', 'second', 'week', 'month', 'year',
      'giorno', 'notte', 'mattina', 'sera', 'mezzogiorno', 'mezzanotte', 'oggi', 'ieri',
      'tempo', 'ora', 'minuto', 'secondo', 'settimana', 'mese', 'anno',
      
      // Altri termini problematici (EN + IT)
      'market', 'store', 'shop', 'shopping', 'buying', 'selling', 'price', 'cost',
      'money', 'dollar', 'euro', 'cheap', 'expensive',
      'mercato', 'negozio', 'spesa', 'comprare', 'vendere', 'prezzo', 'costo',
      'soldi', 'denaro', 'dollaro', 'economico', 'costoso'
    ];
    
    // Esclusione diretta per termini non alimentari
    if (nonFoodTerms.includes(normalizedTerm)) {
      return false;
    }
    
    // Esclusione per termini che contengono principalmente parole non-food
    const containsNonFood = nonFoodTerms.some(nonFood => {
      if (normalizedTerm.includes(nonFood)) {
        // Se il termine non-food costituisce la maggior parte del nome, escludi
        return nonFood.length / normalizedTerm.length > 0.7;
      }
      return false;
    });
    
    if (containsNonFood) {
      return false;
    }
    
    // Lista positiva di termini che sono SICURAMENTE ingredienti alimentari
    const definiteFoodTerms = [
      // Verdure specifiche
      'tomato', 'potato', 'onion', 'garlic', 'carrot', 'celery', 'pepper', 'bell pepper',
      'broccoli', 'spinach', 'lettuce', 'cucumber', 'zucchini', 'eggplant', 'mushroom',
      'cabbage', 'cauliflower', 'asparagus', 'artichoke', 'beetroot', 'radish', 'turnip',
      'leek', 'scallion', 'chive', 'kale', 'chard', 'arugula', 'endive', 'fennel', 'okra',
      
      // Frutta specifica
      'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'raspberry',
      'blackberry', 'grape', 'peach', 'pear', 'cherry', 'watermelon', 'pineapple', 'mango',
      'avocado', 'kiwi', 'papaya', 'coconut', 'fig', 'date', 'apricot', 'plum', 'cantaloupe',
      
      // Proteine
      'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon', 'tuna', 'cod',
      'shrimp', 'crab', 'lobster', 'egg', 'tofu', 'tempeh', 'seitan', 'bacon', 'ham', 'sausage',
      
      // Latticini
      'milk', 'cheese', 'yogurt', 'butter', 'cream', 'mozzarella', 'cheddar', 'parmesan',
      'ricotta', 'feta', 'gouda', 'swiss',
      
      // Cereali e grani
      'rice', 'pasta', 'bread', 'wheat', 'oats', 'barley', 'quinoa', 'flour', 'noodles',
      
      // Legumi
      'beans', 'lentils', 'chickpeas', 'peas',
      
      // Condimenti e spezie
      'salt', 'pepper', 'sugar', 'honey', 'oil', 'vinegar', 'sauce', 'basil', 'oregano',
      'thyme', 'rosemary', 'parsley', 'cilantro', 'mint', 'ginger', 'cinnamon', 'paprika'
    ];
    
    // Se è nella lista positiva, è sicuramente cibo
    if (definiteFoodTerms.some(food => 
      normalizedTerm.includes(food) || food.includes(normalizedTerm)
    )) {
      return true;
    }
    
    // Pattern per ingredienti composti (es: "cherry tomato", "ground beef")
    const foodPatterns = [
      /.*tomato.*/i, /.*pepper.*/i, /.*onion.*/i, /.*cheese.*/i, /.*chicken.*/i,
      /.*beef.*/i, /.*pork.*/i, /.*fish.*/i, /.*salmon.*/i, /.*egg.*/i,
      /.*mushroom.*/i, /.*lettuce.*/i, /.*cabbage.*/i, /.*carrot.*/i, /.*potato.*/i,
      /.*apple.*/i, /.*berry.*/i, /.*fruit.*/i, /.*meat.*/i, /.*oil.*/i,
      /.*sauce.*/i, /.*herb.*/i, /.*spice.*/i, /.*bean.*/i, /.*seed.*/i,
      /.*nut.*/i, /.*milk.*/i, /.*bread.*/i, /.*rice.*/i, /.*pasta.*/i
    ];
    
    if (foodPatterns.some(pattern => pattern.test(normalizedTerm))) {
      return true;
    }
    
    // Se è troppo corto (meno di 3 caratteri), probabilmente non è specifico
    if (normalizedTerm.length < 3) {
      return false;
    }
    
    // Se non corrisponde a pattern noti, è probabilmente non cibo
    return false;
  }

  private guessCategory(ingredient: string): string {
    const normalizedIngredient = ingredient.toLowerCase();
    
    // Pattern matching per categorie comuni
    const categoryPatterns = {
      vegetables: [
        'tomato', 'potato', 'onion', 'garlic', 'carrot', 'celery', 'pepper', 'broccoli', 'spinach',
        'lettuce', 'cucumber', 'zucchini', 'eggplant', 'mushroom', 'cabbage', 'cauliflower',
        'asparagus', 'artichoke', 'beet', 'radish', 'turnip', 'leek', 'scallion', 'chive',
        'kale', 'chard', 'arugula', 'endive', 'fennel', 'okra', 'pea', 'bean'
      ],
      fruits: [
        'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'grape',
        'peach', 'pear', 'cherry', 'watermelon', 'pineapple', 'mango', 'avocado', 'kiwi',
        'papaya', 'coconut', 'fig', 'date', 'apricot', 'plum', 'cantaloupe', 'honeydew',
        'raspberry', 'blackberry', 'cranberry', 'pomegranate', 'passion fruit'
      ],
      meat: [
        'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon',
        'sausage', 'turkey', 'ham', 'duck', 'goose', 'veal', 'venison', 'rabbit',
        'cod', 'halibut', 'trout', 'sardine', 'anchovy', 'crab', 'lobster', 'scallop',
        'mussel', 'oyster', 'clam', 'squid', 'octopus'
      ],
      dairy: [
        'milk', 'cheese', 'yogurt', 'butter', 'cream', 'mozzarella', 'parmesan', 'ricotta',
        'cheddar', 'gouda', 'brie', 'camembert', 'feta', 'cottage cheese', 'sour cream',
        'ice cream', 'egg', 'eggs'
      ],
      grains: [
        'rice', 'pasta', 'bread', 'flour', 'quinoa', 'oats', 'barley', 'wheat', 'noodles',
        'spaghetti', 'cereal', 'couscous', 'bulgur', 'millet', 'buckwheat', 'rye',
        'corn', 'polenta', 'tortilla', 'bagel', 'croissant'
      ],
      legumes: [
        'beans', 'lentils', 'chickpeas', 'peas', 'soybeans', 'kidney beans', 'black beans',
        'white beans', 'lima beans', 'navy beans', 'pinto beans', 'garbanzo'
      ],
      herbs: [
        'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'mint', 'sage',
        'dill', 'chives', 'tarragon', 'bay leaf', 'lavender'
      ],
      spices: [
        'salt', 'pepper', 'paprika', 'cumin', 'coriander', 'cinnamon', 'nutmeg', 'ginger',
        'turmeric', 'cardamom', 'cloves', 'allspice', 'vanilla', 'saffron'
      ]
    };
    
    // Cerca pattern match
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(pattern => normalizedIngredient.includes(pattern))) {
        return category;
      }
    }
    
    // Default fallback
    return 'other';
  }

  // Rimossa funzione di traduzione - ora Gemini gestisce direttamente la lingua
}
