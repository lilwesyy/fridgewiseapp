import { SecureFormData as FormData } from '../utils/secureFormData';
import fetch from 'node-fetch';
import fs from 'fs';

interface RecognitionResult {
  tags?: string[];
  english?: string[];
  chinese?: string[];
  confidence?: number;
  model?: string;
}

interface MealDbIngredient {
  idIngredient: string;
  strIngredient: string;
  strDescription?: string;
  strType?: string;
}

interface ProcessedIngredient {
  name: string;
  nameIt: string;
  category: string;
  confidence: number;
  source: 'mealdb-matched';
  mealDbId?: string;
}

export class MealDbRecognizeService {
  private recognizeApiUrl: string;
  private mealDbBaseUrl: string;
  private ingredientsCache: Map<string, MealDbIngredient> = new Map();
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24 ore
  private lastCacheUpdate: number = 0;

  constructor() {
    this.recognizeApiUrl = process.env.RECOGNIZE_API_URL || 'http://localhost:8000';
    this.mealDbBaseUrl = 'https://www.themealdb.com/api/json/v1/1';
  }

  async analyzeImage(imagePath: string): Promise<ProcessedIngredient[]> {
    console.log('🔍 Starting MealDB-enhanced image analysis for:', imagePath);

    try {
      // Step 1: Riconosci oggetti nell'immagine con RecognizeAnything
      const recognitionResults = await this.recognizeWithAPI(imagePath);
      console.log(`📋 RecognizeAnything found ${recognitionResults.length} potential items`);

      if (recognitionResults.length === 0) {
        console.log('❌ No items detected in image - will trigger NoIngredientsModal');
        return [];
      }

      // Step 2: Manda TUTTO a TheMealDB senza filtri preliminari
      console.log(`📤 Sending all ${recognitionResults.length} items to TheMealDB for verification`);

      // Step 3: Confronta con TheMealDB - solo TheMealDB decide cosa è valido
      const processedIngredients = await this.matchWithMealDB(recognitionResults);
      
      if (processedIngredients.length === 0) {
        console.log('❌ No ingredients matched with MealDB - will trigger NoIngredientsModal');
        return [];
      }

      console.log(`🎯 Final results: ${processedIngredients.length} verified ingredients`);
      return processedIngredients;

    } catch (error) {
      console.log('❌ Analysis failed:', error);
      return [];
    }
  }

  private async recognizeWithAPI(imagePath: string): Promise<string[]> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      const response = await fetch(`${this.recognizeApiUrl}/`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        timeout: 15000
      });

      if (!response.ok) {
        throw new Error(`RecognizeAnything API error: ${response.status}`);
      }

      const result = await response.json() as RecognitionResult;
      
      // Combina tutti i tag disponibili
      const allTags = [
        ...(result.tags || []),
        ...(result.english || []),
        ...(result.chinese || [])
      ];

      // Rimuovi duplicati e termini vuoti
      return [...new Set(allTags)].filter(tag => tag && tag.trim().length > 0);

    } catch (error) {
      console.log('❌ RecognizeAnything API error:', error);
      throw error;
    }
  }

  private async matchWithMealDB(allItems: string[]): Promise<ProcessedIngredient[]> {
    console.log('🔍 Matching ALL items with TheMealDB...');
    
    // Filtra solo parole inglesi (no caratteri cinesi o altri script non latini)
    const englishOnlyItems = allItems.filter(item => this.isEnglishText(item));
    console.log(`🔤 Filtered to ${englishOnlyItems.length} English-only items (removed ${allItems.length - englishOnlyItems.length} non-English items)`);
    
    // Assicurati che la cache degli ingredienti sia aggiornata
    await this.updateIngredientsCache();

    const matchedIngredients: ProcessedIngredient[] = [];

    for (const item of englishOnlyItems) {
      const normalizedItem = item.toLowerCase().trim();
      
      // Cerca match esatto
      const exactMatch = this.findExactMatch(normalizedItem);
      if (exactMatch) {
        const ingredient = await this.createIngredientFromMealDb(exactMatch, normalizedItem, 0.9);
        if (ingredient) {
          matchedIngredients.push(ingredient);
          console.log(`✅ Exact match: ${item} → ${exactMatch.strIngredient}`);
          continue;
        }
      }

      // Cerca match parziale
      const partialMatch = this.findPartialMatch(normalizedItem);
      if (partialMatch) {
        const ingredient = await this.createIngredientFromMealDb(partialMatch, normalizedItem, 0.7);
        if (ingredient) {
          matchedIngredients.push(ingredient);
          console.log(`🔄 Partial match: ${item} → ${partialMatch.strIngredient}`);
          continue;
        }
      }

      // Se non trovato in MealDB, ignora l'item (NO FALLBACK)
      console.log(`❌ No MealDB match found for: ${item}`);
    }

    // Rimuovi duplicati e ordina per confidence
    return this.deduplicateAndSort(matchedIngredients);
  }

  private async updateIngredientsCache(): Promise<void> {
    const now = Date.now();
    
    // Aggiorna cache solo se è scaduta
    if (now - this.lastCacheUpdate < this.cacheExpiry && this.ingredientsCache.size > 0) {
      console.log('📋 Using cached MealDB ingredients');
      return;
    }

    try {
      console.log('🔄 Updating MealDB ingredients cache...');
      
      const response = await fetch(`${this.mealDbBaseUrl}/list.php?i=list`, {
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`MealDB API error: ${response.status}`);
      }

      const data = await response.json();
      const ingredients: MealDbIngredient[] = data.meals || [];

      // Popola la cache
      this.ingredientsCache.clear();
      ingredients.forEach(ingredient => {
        const key = ingredient.strIngredient.toLowerCase().trim();
        this.ingredientsCache.set(key, ingredient);
      });

      this.lastCacheUpdate = now;
      console.log(`✅ Cached ${ingredients.length} MealDB ingredients`);

    } catch (error) {
      console.log('❌ Failed to update MealDB cache:', error);
      // Se TheMealDB non è disponibile, il sistema non può funzionare
      throw new Error('TheMealDB API unavailable');
    }
  }

  private findExactMatch(normalizedItem: string): MealDbIngredient | null {
    // Prima cerca match esatto
    const exactMatch = this.ingredientsCache.get(normalizedItem);
    if (exactMatch) {
      return exactMatch;
    }

    // Se non trovato, prova varianti singolare/plurale
    if (normalizedItem.endsWith('s')) {
      // Se è plurale, prova il singolare
      const singular = normalizedItem.slice(0, -1);
      const singularMatch = this.ingredientsCache.get(singular);
      if (singularMatch) {
        return singularMatch;
      }
    } else {
      // Se è singolare, prova il plurale
      const plural = normalizedItem + 's';
      const pluralMatch = this.ingredientsCache.get(plural);
      if (pluralMatch) {
        return pluralMatch;
      }
    }

    return null;
  }

  private findPartialMatch(normalizedItem: string): MealDbIngredient | null {
    // Skip termini troppo generici che potrebbero dare falsi positivi
    const genericTerms = ['food', 'fruit', 'vegetable', 'meat', 'fish', 'dairy', 'grain', 'spice', 'herb'];
    if (genericTerms.includes(normalizedItem)) {
      return null;
    }

    // Cerca corrispondenze parziali - solo se l'item è contenuto nell'ingrediente
    for (const [key, ingredient] of this.ingredientsCache) {
      // Match solo se l'item è contenuto nel nome dell'ingrediente (non viceversa)
      // Questo evita che "vegetable" matchi con "vegetable oil"
      if (key.includes(normalizedItem) && normalizedItem.length >= 3) {
        // Verifica che la somiglianza sia significativa
        const similarity = this.calculateSimilarity(normalizedItem, key);
        if (similarity > 0.6) {
          return ingredient;
        }
      }
    }

    // Fuzzy matching per variazioni di spelling
    for (const [key, ingredient] of this.ingredientsCache) {
      const similarity = this.calculateSimilarity(normalizedItem, key);
      if (similarity > 0.8) {
        return ingredient;
      }
    }

    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async createIngredientFromMealDb(
    mealDbIngredient: MealDbIngredient, 
    originalItem: string, 
    confidence: number
  ): Promise<ProcessedIngredient | null> {
    const italianTranslation = await this.translateToItalian(mealDbIngredient.strIngredient);
    const category = this.categorizeMealDbIngredient(mealDbIngredient);

    return {
      name: mealDbIngredient.strIngredient.toLowerCase(),
      nameIt: italianTranslation,
      category,
      confidence,
      source: 'mealdb-matched',
      mealDbId: mealDbIngredient.idIngredient
    };
  }

  private categorizeMealDbIngredient(ingredient: MealDbIngredient): string {
    const type = ingredient.strType?.toLowerCase() || '';
    const name = ingredient.strIngredient.toLowerCase();

    // Mapping dei tipi MealDB alle nostre categorie
    const typeMapping: { [key: string]: string } = {
      'meat': 'meat',
      'fish': 'meat',
      'seafood': 'meat',
      'vegetable': 'vegetables',
      'fruit': 'fruits',
      'dairy': 'dairy',
      'grain': 'grains',
      'spice': 'spices',
      'herb': 'herbs',
      'oil': 'condiments',
      'sauce': 'condiments'
    };

    if (typeMapping[type]) {
      return typeMapping[type];
    }

    // Fallback basato sul nome
    return this.guessCategory(name);
  }

  private async translateToItalian(ingredient: string): Promise<string> {
    // Nessuna traduzione manuale - restituiamo il nome originale inglese
    return ingredient;
  }

  private guessCategory(ingredient: string): string {
    const normalized = ingredient.toLowerCase();
    
    const categoryPatterns = {
      vegetables: ['tomato', 'onion', 'garlic', 'potato', 'carrot', 'pepper', 'mushroom', 'spinach', 'broccoli'],
      fruits: ['apple', 'banana', 'orange', 'lemon', 'strawberry', 'grape', 'cherry'],
      meat: ['chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp'],
      dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'],
      grains: ['rice', 'pasta', 'bread', 'flour', 'oats', 'quinoa'],
      herbs: ['basil', 'oregano', 'parsley', 'thyme', 'rosemary'],
      spices: ['salt', 'pepper', 'paprika', 'cumin', 'cinnamon']
    };
    
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(pattern => normalized.includes(pattern))) {
        return category;
      }
    }
    
    return 'other';
  }

  private deduplicateAndSort(ingredients: ProcessedIngredient[]): ProcessedIngredient[] {
    const seenIngredients = new Map<string, ProcessedIngredient>();
    
    // Deduplica mantenendo quello con confidence più alta
    ingredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      const existing = seenIngredients.get(key);
      
      if (!existing || ingredient.confidence > existing.confidence) {
        seenIngredients.set(key, ingredient);
      }
    });
    
    // Ordina per confidence decrescente
    return Array.from(seenIngredients.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, parseInt(process.env.VISION_MAX_RESULTS || '12'));
  }

  async healthCheck(): Promise<{ recognizeApi: boolean; mealDb: boolean; overall: boolean }> {
    const checks = await Promise.allSettled([
      this.checkRecognizeApiHealth(),
      this.checkMealDbHealth()
    ]);

    const recognizeApi = checks[0].status === 'fulfilled' && checks[0].value;
    const mealDb = checks[1].status === 'fulfilled' && checks[1].value;

    return {
      recognizeApi,
      mealDb,
      overall: recognizeApi && mealDb
    };
  }

  private async checkRecognizeApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.recognizeApiUrl}/`, {
        method: 'OPTIONS',
        timeout: 5000
      });
      return response.status < 500;
    } catch {
      return false;
    }
  }

  private async checkMealDbHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.mealDbBaseUrl}/list.php?i=list`, {
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private isEnglishText(text: string): boolean {
    // Verifica che il testo contenga solo caratteri latini, numeri, spazi e punteggiatura di base
    const englishPattern = /^[a-zA-Z0-9\s\-'.,!?&()]+$/;
    
    // Se non matcha il pattern base, sicuramente non è inglese
    if (!englishPattern.test(text)) {
      return false;
    }

    // Controlla se contiene caratteri cinesi, arabi, cirillici, etc.
    const nonLatinPattern = /[\u4e00-\u9fff\u0600-\u06ff\u0400-\u04ff\u3040-\u309f\u30a0-\u30ff]/;
    
    return !nonLatinPattern.test(text);
  }
}
