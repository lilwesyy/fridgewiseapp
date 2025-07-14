import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface RecognitionResult {
  tags?: string[];
  english?: string[];
  chinese?: string[];
  confidence?: number;
  model?: string;
}

interface VisionApiResult {
  predictions?: Array<{
    label: string;
    confidence: number;
  }>;
  labels?: Array<{
    name: string;
    score: number;
  }>;
}

interface ProcessedIngredient {
  name: string;
  nameIt?: string;
  category: string;
  confidence: number;
  source: 'vision-api' | 'gemini-vision' | 'local-model' | 'fallback';
}

// Database dinamico degli ingredienti con sinonimi e varianti
const ENHANCED_FOOD_DATABASE = {
  // Verdure
  tomato: {
    names: ['tomato', 'tomatoes', 'cherry tomato', 'roma tomato', 'beefsteak tomato'],
    nameIt: 'pomodoro',
    category: 'vegetables',
    aliases: ['pomodoro', 'pomodori']
  },
  potato: {
    names: ['potato', 'potatoes', 'russet potato', 'red potato', 'sweet potato'],
    nameIt: 'patata',
    category: 'vegetables',
    aliases: ['patata', 'patate']
  },
  onion: {
    names: ['onion', 'onions', 'red onion', 'white onion', 'yellow onion', 'shallot'],
    nameIt: 'cipolla',
    category: 'vegetables',
    aliases: ['cipolla', 'cipolle']
  },
  carrot: {
    names: ['carrot', 'carrots', 'baby carrot'],
    nameIt: 'carota',
    category: 'vegetables',
    aliases: ['carota', 'carote']
  },
  bell_pepper: {
    names: ['bell pepper', 'pepper', 'red pepper', 'green pepper', 'yellow pepper', 'capsicum'],
    nameIt: 'peperone',
    category: 'vegetables',
    aliases: ['peperone', 'peperoni']
  },
  broccoli: {
    names: ['broccoli', 'broccoli florets'],
    nameIt: 'broccoli',
    category: 'vegetables',
    aliases: ['broccoli']
  },
  spinach: {
    names: ['spinach', 'baby spinach'],
    nameIt: 'spinaci',
    category: 'vegetables',
    aliases: ['spinaci']
  },
  zucchini: {
    names: ['zucchini', 'courgette', 'summer squash'],
    nameIt: 'zucchina',
    category: 'vegetables',
    aliases: ['zucchina', 'zucchine']
  },
  eggplant: {
    names: ['eggplant', 'aubergine'],
    nameIt: 'melanzana',
    category: 'vegetables',
    aliases: ['melanzana', 'melanzane']
  },
  mushroom: {
    names: ['mushroom', 'mushrooms', 'button mushroom', 'portobello', 'shiitake'],
    nameIt: 'fungo',
    category: 'vegetables',
    aliases: ['fungo', 'funghi']
  },
  
  // Frutta
  apple: {
    names: ['apple', 'apples', 'red apple', 'green apple', 'granny smith'],
    nameIt: 'mela',
    category: 'fruits',
    aliases: ['mela', 'mele']
  },
  banana: {
    names: ['banana', 'bananas'],
    nameIt: 'banana',
    category: 'fruits',
    aliases: ['banana', 'banane']
  },
  orange: {
    names: ['orange', 'oranges', 'navel orange', 'blood orange'],
    nameIt: 'arancia',
    category: 'fruits',
    aliases: ['arancia', 'arance']
  },
  lemon: {
    names: ['lemon', 'lemons'],
    nameIt: 'limone',
    category: 'fruits',
    aliases: ['limone', 'limoni']
  },
  strawberry: {
    names: ['strawberry', 'strawberries'],
    nameIt: 'fragola',
    category: 'fruits',
    aliases: ['fragola', 'fragole']
  },
  
  // Latticini
  cheese: {
    names: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'gouda', 'swiss cheese'],
    nameIt: 'formaggio',
    category: 'dairy',
    aliases: ['formaggio', 'formaggi']
  },
  milk: {
    names: ['milk', 'whole milk', 'skim milk', '2% milk'],
    nameIt: 'latte',
    category: 'dairy',
    aliases: ['latte']
  },
  eggs: {
    names: ['egg', 'eggs', 'chicken egg'],
    nameIt: 'uova',
    category: 'dairy',
    aliases: ['uovo', 'uova']
  },
  butter: {
    names: ['butter', 'unsalted butter', 'salted butter'],
    nameIt: 'burro',
    category: 'dairy',
    aliases: ['burro']
  },
  
  // Carne
  chicken: {
    names: ['chicken', 'chicken breast', 'chicken thigh', 'chicken leg', 'poultry'],
    nameIt: 'pollo',
    category: 'meat',
    aliases: ['pollo']
  },
  beef: {
    names: ['beef', 'steak', 'ground beef', 'beef roast'],
    nameIt: 'manzo',
    category: 'meat',
    aliases: ['manzo', 'bovino']
  },
  fish: {
    names: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'seafood'],
    nameIt: 'pesce',
    category: 'meat',
    aliases: ['pesce', 'pesci']
  },
  
  // Cereali
  rice: {
    names: ['rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice'],
    nameIt: 'riso',
    category: 'grains',
    aliases: ['riso']
  },
  pasta: {
    names: ['pasta', 'spaghetti', 'penne', 'macaroni', 'noodles'],
    nameIt: 'pasta',
    category: 'grains',
    aliases: ['pasta']
  },
  bread: {
    names: ['bread', 'white bread', 'whole wheat bread', 'sourdough'],
    nameIt: 'pane',
    category: 'grains',
    aliases: ['pane']
  }
};

export class EnhancedRecognizeService {
  private geminiApiKey: string;
  private visionApiUrl: string;

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.visionApiUrl = process.env.RECOGNIZE_API_URL || 'http://localhost:8000';
  }

  async analyzeImage(imagePath: string): Promise<ProcessedIngredient[]> {
    console.log('🔍 Starting enhanced image analysis for:', imagePath);

    const results = await Promise.allSettled([
      this.analyzeWithGeminiVision(imagePath),
      this.analyzeWithVisionAPI(imagePath),
      this.analyzeWithLocalModel(imagePath)
    ]);

    const allIngredients: ProcessedIngredient[] = [];

    // Combina risultati da tutte le fonti
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        const sources = ['gemini-vision', 'vision-api', 'local-model'] as const;
        console.log(`✅ ${sources[index]} found ${result.value.length} ingredients`);
        allIngredients.push(...result.value);
      } else {
        const sources = ['Gemini Vision', 'Vision API', 'Local Model'];
        console.log(`❌ ${sources[index]} failed or found no ingredients`);
      }
    });

    if (allIngredients.length === 0) {
      console.log('🔄 All services failed, trying smart fallback');
      const fallbackResults = await this.getSmartFallback(imagePath);
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

  private async analyzeWithGeminiVision(imagePath: string): Promise<ProcessedIngredient[]> {
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
                    text: "You are Gemini 2.5 Pro analyzing a food image. Identify ALL visible food ingredients with maximum precision.\n\nReturn ONLY a valid JSON array:\n[{\"name\": \"ingredient_name\", \"nameIt\": \"nome_italiano\", \"confidence\": 0.95}]\n\nGuidelines:\n1. For 'name': Use specific English names (e.g., 'cherry tomatoes', 'red bell pepper', 'ground beef', 'fresh basil leaves')\n2. For 'nameIt': Provide the Italian translation (e.g., 'pomodorini', 'peperone rosso', 'carne macinata', 'foglie di basilico fresco')\n3. Include ONLY actual food ingredients: vegetables, fruits, meat, fish, dairy, grains, legumes, herbs, spices, nuts, oils\n4. EXCLUDE: utensils, containers, packaging, backgrounds, non-food objects\n5. Confidence: 0.1-1.0 based on visual clarity\n6. Return 1-25 ingredients maximum\n7. Include partial/cut ingredients if clearly identifiable\n8. Be thorough - include spices, herbs, seasonings if visible\n9. Distinguish varieties when possible\n\nExample response:\n[{\"name\": \"cherry tomatoes\", \"nameIt\": \"pomodorini\", \"confidence\": 0.95}, {\"name\": \"fresh basil\", \"nameIt\": \"basilico fresco\", \"confidence\": 0.88}]\n\nFocus on actual food ingredients that could be used in cooking."
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
            const processed = this.processGeminiResults(ingredients);
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
            return this.analyzeWithGemini15Fallback(imagePath);
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

  private async analyzeWithGemini15Fallback(imagePath: string): Promise<ProcessedIngredient[]> {
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
                text: "Analyze this food image and identify visible ingredients. Return ONLY a JSON array: [{\"name\": \"ingredient_name\", \"nameIt\": \"nome_italiano\", \"confidence\": 0.95}]. Use specific English names for 'name' and Italian translations for 'nameIt'. Include only food items, confidence 0.1-1.0."
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
      const processed = this.processGeminiResults(ingredients);
      console.log(`✅ Gemini 1.5 fallback found ${processed.length} ingredients`);
      return processed;

    } catch (error) {
      console.error('❌ Gemini 1.5 fallback failed:', error);
      throw error;
    }
  }

  private async analyzeWithVisionAPI(imagePath: string): Promise<ProcessedIngredient[]> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      const response = await fetch(`${this.visionApiUrl}/`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        timeout: 15000
      });

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.status}`);
      }

      const result = await response.json() as RecognitionResult;
      return this.processVisionAPIResults(result);

    } catch (error) {
      console.error('❌ Vision API error:', error);
      throw error;
    }
  }

  private async analyzeWithLocalModel(imagePath: string): Promise<ProcessedIngredient[]> {
    // Placeholder per un modello locale futuro (TensorFlow.js, ONNX, etc.)
    // Per ora ritorna array vuoto
    return [];
  }

  private processGeminiResults(ingredients: any[]): ProcessedIngredient[] {
    const processed: ProcessedIngredient[] = [];

    ingredients.forEach(item => {
      if (item.name && typeof item.confidence === 'number') {
        // Prima verifica se l'ingrediente sembra essere cibo
        if (this.looksLikeFood(item.name)) {
          // Cerca nel nostro database per traduzioni e categorie
          const foodInfo = this.findFoodInDatabase(item.name);
          
          if (foodInfo) {
            // Se trovato nel database, usa le nostre informazioni
            processed.push({
              name: foodInfo.key,
              nameIt: foodInfo.data.nameIt,
              category: foodInfo.data.category,
              confidence: Math.min(item.confidence, 1),
              source: 'gemini-vision'
            });
          } else {
            // Se non trovato nel database, usa la traduzione di Gemini se disponibile
            const category = this.guessCategory(item.name);
            const nameIt = item.nameIt || this.guessItalianTranslation(item.name); // Use Gemini's translation first
            
            processed.push({
              name: item.name.toLowerCase().trim(),
              nameIt,
              category,
              confidence: Math.min(item.confidence * 0.95, 1), // Slightly lower confidence for unknown items
              source: 'gemini-vision'
            });
            
            const translationSource = item.nameIt ? 'Gemini' : 'fallback';
            console.log(`🆕 New ingredient discovered: ${item.name} → ${nameIt} (${category}) [translation: ${translationSource}]`);
          }
        } else {
          console.log(`🚫 Gemini found non-food item: ${item.name}`);
        }
      }
    });

    return processed;
  }

  private processVisionAPIResults(result: RecognitionResult): ProcessedIngredient[] {
    const tags = result.tags || result.english || [];
    const processed: ProcessedIngredient[] = [];

    tags.forEach((tag, index) => {
      // Filtra solo termini che sembrano essere ingredienti alimentari
      if (this.looksLikeFood(tag)) {
        const foodInfo = this.findFoodInDatabase(tag);
        const confidence = Math.max(0.5, 1 - (index * 0.1)) * 0.8; // Reduce confidence for legacy API
        
        if (foodInfo) {
          // Se trovato nel database
          processed.push({
            name: foodInfo.key,
            nameIt: foodInfo.data.nameIt,
            category: foodInfo.data.category,
            confidence,
            source: 'vision-api'
          });
        } else {
          // Se non trovato, accetta comunque se sembra cibo
          const category = this.guessCategory(tag);
          const nameIt = this.guessItalianTranslation(tag);
          
          processed.push({
            name: tag.toLowerCase().trim(),
            nameIt,
            category,
            confidence: confidence * 0.9, // Lower confidence for unknown items from legacy API
            source: 'vision-api'
          });
          
          console.log(`🆕 Legacy API found new ingredient: ${tag} → ${nameIt} (${category})`);
        }
      } else {
        console.log(`🚫 Filtered non-food term: ${tag}`);
      }
    });

    return processed;
  }

  private findFoodInDatabase(query: string): { key: string; data: any } | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Cerca match esatto per chiave
    for (const [key, data] of Object.entries(ENHANCED_FOOD_DATABASE)) {
      // Match sui nomi principali
      if (data.names.some(name => name.toLowerCase() === normalizedQuery)) {
        return { key, data };
      }
      
      // Match sugli alias (traduzioni italiane)
      if (data.aliases.some(alias => alias.toLowerCase() === normalizedQuery)) {
        return { key, data };
      }
    }

    // Fuzzy matching per varianti
    for (const [key, data] of Object.entries(ENHANCED_FOOD_DATABASE)) {
      for (const name of data.names) {
        if (this.fuzzyMatch(normalizedQuery, name.toLowerCase())) {
          return { key, data };
        }
      }
    }

    return null;
  }

  private fuzzyMatch(query: string, target: string): boolean {
    // Match se query è contenuta in target o viceversa
    if (query.length >= 4 && target.includes(query)) return true;
    if (target.length >= 4 && query.includes(target)) return true;
    
    // Levenshtein distance per match simili
    const distance = this.levenshteinDistance(query, target);
    const maxLength = Math.max(query.length, target.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity >= 0.8 && Math.min(query.length, target.length) >= 3;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

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

  private async getSmartFallback(imagePath: string): Promise<ProcessedIngredient[]> {
    console.log('🧠 Using smart fallback analysis...');
    
    // Analisi del nome file per indizi
    const filename = path.basename(imagePath).toLowerCase();
    const possibleIngredients: ProcessedIngredient[] = [];

    // Cerca indizi nel nome del file
    for (const [key, data] of Object.entries(ENHANCED_FOOD_DATABASE)) {
      for (const name of data.names) {
        if (filename.includes(name.toLowerCase().replace(/\s+/g, ''))) {
          possibleIngredients.push({
            name: key,
            nameIt: data.nameIt,
            category: data.category,
            confidence: 0.7,
            source: 'fallback'
          });
        }
      }
    }

    if (possibleIngredients.length > 0) {
      console.log(`📁 Found ${possibleIngredients.length} ingredients from filename analysis`);
      return possibleIngredients.slice(0, 3);
    }

    // Non restituire ingredienti di fallback se non ne abbiamo trovati
    console.log('🚫 No ingredients detected and no filename hints - returning empty result');
    return [];
  }

  async healthCheck(): Promise<{ gemini: boolean; visionApi: boolean; overall: boolean }> {
    const checks = await Promise.allSettled([
      this.checkGeminiHealth(),
      this.checkVisionAPIHealth()
    ]);

    const gemini = checks[0].status === 'fulfilled' && checks[0].value;
    const visionApi = checks[1].status === 'fulfilled' && checks[1].value;

    return {
      gemini,
      visionApi,
      overall: gemini || visionApi
    };
  }

  private async checkGeminiHealth(): Promise<boolean> {
    return !!this.geminiApiKey;
  }

  private async checkVisionAPIHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.visionApiUrl}/`, {
        method: 'OPTIONS',
        timeout: 5000
      });
      return response.status < 500;
    } catch {
      return false;
    }
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

  private guessItalianTranslation(ingredient: string): string {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    
    // Traduzioni comuni che non sono nel database
    const commonTranslations: { [key: string]: string } = {
      // Verdure aggiuntive
      'artichoke': 'carciofo',
      'asparagus': 'asparago',
      'avocado': 'avocado',
      'beetroot': 'barbabietola',
      'beet': 'barbabietola',
      'cabbage': 'cavolo',
      'cauliflower': 'cavolfiore',
      'corn': 'mais',
      'fennel': 'finocchio',
      'kale': 'cavolo riccio',
      'leek': 'porro',
      'okra': 'okra',
      'radish': 'ravanello',
      'turnip': 'rapa',
      
      // Frutta aggiuntiva
      'apricot': 'albicocca',
      'blueberry': 'mirtillo',
      'cantaloupe': 'melone',
      'cherry': 'ciliegia',
      'coconut': 'cocco',
      'cranberry': 'mirtillo rosso',
      'date': 'dattero',
      'fig': 'fico',
      'grape': 'uva',
      'grapefruit': 'pompelmo',
      'kiwi': 'kiwi',
      'lime': 'lime',
      'mango': 'mango',
      'papaya': 'papaya',
      'peach': 'pesca',
      'pear': 'pera',
      'pineapple': 'ananas',
      'plum': 'prugna',
      'raspberry': 'lampone',
      'watermelon': 'anguria',
      
      // Carne aggiuntiva
      'duck': 'anatra',
      'lamb': 'agnello',
      'pork': 'maiale',
      'salmon': 'salmone',
      'shrimp': 'gamberetto',
      'tuna': 'tonno',
      'turkey': 'tacchino',
      'veal': 'vitello',
      
      // Cereali e legumi
      'barley': 'orzo',
      'chickpeas': 'ceci',
      'lentils': 'lenticchie',
      'oats': 'avena',
      'quinoa': 'quinoa',
      'soybeans': 'soia',
      
      // Erbe e spezie
      'cilantro': 'coriandolo',
      'cinnamon': 'cannella',
      'cloves': 'chiodi di garofano',
      'cumin': 'cumino',
      'dill': 'aneto',
      'ginger': 'zenzero',
      'mint': 'menta',
      'nutmeg': 'noce moscata',
      'paprika': 'paprika',
      'rosemary': 'rosmarino',
      'sage': 'salvia',
      'thyme': 'timo',
      'turmeric': 'curcuma',
      'vanilla': 'vaniglia'
    };
    
    // Cerca traduzione diretta
    if (commonTranslations[normalizedIngredient]) {
      return commonTranslations[normalizedIngredient];
    }
    
    // Cerca match parziale
    for (const [english, italian] of Object.entries(commonTranslations)) {
      if (normalizedIngredient.includes(english) || english.includes(normalizedIngredient)) {
        return italian;
      }
    }
    
    // Se non trovata, restituisci il nome originale
    return ingredient;
  }
}
