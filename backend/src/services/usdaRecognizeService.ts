import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

interface RecognitionResult {
  tags?: string[];
  english?: string[];
  chinese?: string[];
  confidence?: number;
  model?: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  gtinUpc?: string;
  publishedDate: string;
  brandOwner?: string;
  foodCategory?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  score?: number;
}

interface USDASearchResult {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

interface ProcessedIngredient {
  name: string;
  nameIt: string;
  category: string;
  confidence: number;
  source: 'usda-matched';
  usdaId?: number;
}

export class USDARecognizeService {
  private recognizeApiUrl: string;
  private usdaBaseUrl: string;
  private usdaApiKey: string;

  constructor() {
    this.recognizeApiUrl = process.env.RECOGNIZE_API_URL || 'http://localhost:8000';
    this.usdaBaseUrl = 'https://api.nal.usda.gov/fdc/v1';
    this.usdaApiKey = process.env.USDA_API_KEY || 'YiaRpehMr8tGvEd7Tu0RlP5WRZpcd2g2U8vhZFW7';
  }

  async analyzeImage(imagePath: string): Promise<ProcessedIngredient[]> {
    console.log('🔍 Starting USDA-enhanced image analysis for:', imagePath);

    try {
      // Step 1: Riconosci oggetti nell'immagine con RecognizeAnything
      const recognitionResults = await this.recognizeWithAPI(imagePath);
      console.log(`📋 RecognizeAnything found ${recognitionResults.length} potential items`);

      if (recognitionResults.length === 0) {
        console.log('❌ No items detected in image - will trigger NoIngredientsModal');
        return [];
      }

      // Step 2: Filtra solo parole inglesi e rimuovi duplicati
      const englishOnlyItems = [...new Set(recognitionResults.filter(item => this.isEnglishText(item)).map(item => item.toLowerCase().trim()))];
      console.log(`🔤 Filtered to ${englishOnlyItems.length} English-only items (removed ${recognitionResults.length - englishOnlyItems.length} non-English items)`);

      // Step 3: Cerca ogni ingrediente in USDA FoodData Central
      const processedIngredients = await this.searchIngredientsInUSDA(englishOnlyItems);
      
      if (processedIngredients.length === 0) {
        console.log('❌ No ingredients matched with USDA - will trigger NoIngredientsModal');
        return [];
      }

      console.log(`🎯 Final results: ${processedIngredients.length} verified ingredients`);
      return processedIngredients;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
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
      
      // Combina tutti i tag disponibili (ma filtriamo i cinesi dopo)
      const allTags = [
        ...(result.tags || []),
        ...(result.english || []),
        ...(result.chinese || [])
      ];

      // Rimuovi duplicati e termini vuoti
      return [...new Set(allTags)].filter(tag => tag && tag.trim().length > 0);

    } catch (error) {
      console.error('❌ RecognizeAnything API error:', error);
      throw error;
    }
  }

  private async searchIngredientsInUSDA(items: string[]): Promise<ProcessedIngredient[]> {
    console.log('🔍 Searching ingredients in USDA FoodData Central...');
    
    const matchedIngredients: ProcessedIngredient[] = [];
    const processedTerms = new Set<string>(); // Per evitare di processare duplicati

    // Cerca ogni ingrediente in parallelo (con limite per non sovraccaricare l'API)
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const uniqueBatch = batch.filter(item => !processedTerms.has(item)); // Filtra duplicati
      const batchPromises = uniqueBatch.map(item => {
        processedTerms.add(item); // Segna come processato
        return this.searchSingleIngredient(item);
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          matchedIngredients.push(result.value);
          console.log(`✅ USDA match: ${uniqueBatch[index]} → ${result.value.name}`);
        } else if (uniqueBatch[index]) {
          console.log(`❌ No USDA match found for: ${uniqueBatch[index]}`);
        }
      });

      // Piccola pausa tra i batch per rispettare i rate limits
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return this.deduplicateAndSort(matchedIngredients);
  }

  private async searchSingleIngredient(item: string, isRetry: boolean = false): Promise<ProcessedIngredient | null> {
    try {
      const normalizedItem = item.toLowerCase().trim();
      
      // Skip termini troppo generici o non alimentari
      const genericTerms = ['food', 'fruit', 'vegetable', 'meat', 'fish', 'dairy', 'grain', 'container', 'box', 'bin', 'bowl', 'plate', 'cup', 'spoon', 'fork', 'knife', 'table', 'ingredient', 'mixture', 'whisk'];
      if (genericTerms.includes(normalizedItem) || normalizedItem.length < 3) {
        return null;
      }

      const searchUrl = `${this.usdaBaseUrl}/foods/search?api_key=${this.usdaApiKey}`;
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: normalizedItem,
          dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'], // Espandiamo i tipi di dati
          pageSize: 25, // Aumentiamo ulteriormente
          sortBy: 'score',
          sortOrder: 'desc'
        }),
        timeout: 5000
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.error('❌ USDA API key invalid or expired');
        }
        console.error(`❌ USDA API error ${response.status}: ${await response.text()}`);
        return null;
      }

      const searchResult: USDASearchResult = await response.json();
      
      if (!searchResult.foods || searchResult.foods.length === 0) {
        console.log(`❌ No USDA match found for: ${item}`);
        return null;
      }

      // Valuta TUTTI i risultati e trova il migliore match
      let bestMatch: USDAFood | null = null;
      let bestSimilarity = 0;
      
      console.log(`🔍 Evaluating ${searchResult.foods.length} USDA results for "${item}":`);
      
      for (const food of searchResult.foods.slice(0, 15)) { // Valuta i primi 15 risultati
        const foodDescription = food.description.toLowerCase();
        const similarity = this.calculateSimilarity(normalizedItem, foodDescription);
        
        // Bonus se il termine esatto appare nella descrizione
        let adjustedSimilarity = similarity;
        if (foodDescription.includes(normalizedItem)) {
          adjustedSimilarity += 0.3;
        }
        
        // BONUS MEGA se la descrizione è esattamente il termine cercato
        if (foodDescription === normalizedItem) {
          adjustedSimilarity += 5.0; // Bonus enorme per match perfetto
        }
        
        // BONUS MEGA anche per plurali (es: "nut" → "nuts")
        const pluralVariants = [normalizedItem + 's', normalizedItem + 'es'];
        if (pluralVariants.includes(foodDescription)) {
          adjustedSimilarity += 5.0; // Stesso bonus per plurali
        }
        
        // BONUS per singolari (es: "nuts" → "nut")
        if (normalizedItem.endsWith('s') && foodDescription === normalizedItem.slice(0, -1)) {
          adjustedSimilarity += 5.0;
        }
        
        // BONUS EXTRA se la parola esatta è il primo termine della descrizione
        const firstWord = foodDescription.split(',')[0].trim().split(' ')[0];
        if (firstWord === normalizedItem) {
          adjustedSimilarity += 1.0; // Bonus per match esatto come primo termine
        }
        
        // BONUS per plurali come primo termine (es: "nut" → "nuts, pine nuts")
        const pluralFirstWords = [normalizedItem + 's', normalizedItem + 'es'];
        if (pluralFirstWords.includes(firstWord)) {
          adjustedSimilarity += 1.0;
        }
        
        // BONUS se la descrizione inizia esattamente con il termine (es: "Milk," per "milk")
        if (foodDescription.startsWith(normalizedItem + ',') || foodDescription.startsWith(normalizedItem + ' ')) {
          adjustedSimilarity += 1.5; // Bonus molto alto per match perfetto come primo termine
        }
        
        // BONUS per plurali all'inizio (es: "nut" → "nuts, ...")
        const pluralStarts = [normalizedItem + 's,', normalizedItem + 's ', normalizedItem + 'es,', normalizedItem + 'es '];
        if (pluralStarts.some(start => foodDescription.startsWith(start))) {
          adjustedSimilarity += 1.5;
        }
        
        // PENALITÀ FORTE per descrizioni con molte virgole (troppo specifiche)
        const commaCount = (foodDescription.match(/,/g) || []).length;
        if (commaCount > 0) {
          adjustedSimilarity -= commaCount * 1.0; // Penalità molto forte per ogni virgola
        }
        
        // PENALITÀ EXTRA per descrizioni molto specifiche dopo la prima virgola
        if (commaCount > 0) {
          const afterFirstComma = foodDescription.split(',').slice(1).join(',').trim();
          if (afterFirstComma.length > 10) {
            adjustedSimilarity -= 1.5; // Penalità forte per descrizioni lunghe dopo la prima virgola
          }
        }
        
        // BONUS per termini generici (senza specificazioni)
        const isGeneric = !foodDescription.includes(',') && foodDescription.split(' ').length === 1;
        if (isGeneric) {
          adjustedSimilarity += 1.0; // Bonus maggiore per termini singoli senza virgole
        }
        
        // PENALITÀ per parole extra anche senza virgole (es: "almond butter")
        const wordCount = foodDescription.split(' ').length;
        if (wordCount > 1 && !foodDescription.includes(',')) {
          adjustedSimilarity -= (wordCount - 1) * 0.8; // Penalità per ogni parola extra
        }
        
        // BONUS per alimenti semplici/base
        if (this.isSimpleFood(foodDescription)) {
          adjustedSimilarity += 0.3;
        }
        
        // Bonus se sono parole correlate (es: "egg" e "eggs")
        if (this.areRelatedWords(normalizedItem, foodDescription)) {
          adjustedSimilarity += 0.2;
        }
        
        if (adjustedSimilarity > bestSimilarity) {
          bestMatch = food;
          bestSimilarity = adjustedSimilarity;
        }
        
        // Log dei top 5 risultati per debug
        const index = searchResult.foods.indexOf(food);
        if (index < 5) {
          console.log(`  ${index + 1}. "${food.description}" → score: ${adjustedSimilarity.toFixed(2)}`);
        }
      }

      if (!bestMatch || bestSimilarity < 0.3) {
        // Fallback: prova con plurali/singolari se non trovato (solo se non è già un retry)
        if (!isRetry) {
          if (!normalizedItem.endsWith('s')) {
            const pluralQuery = normalizedItem + 's';
            console.log(`  🔄 Trying plural form: "${pluralQuery}"`);
            return this.searchSingleIngredient(pluralQuery, true);
          } else {
            const singularQuery = normalizedItem.slice(0, -1);
            console.log(`  🔄 Trying singular form: "${singularQuery}"`);
            return this.searchSingleIngredient(singularQuery, true);
          }
        }
        
        console.log(`❌ No good USDA match found for: ${item} (best similarity: ${bestSimilarity?.toFixed(2) || 'N/A'})`);
        return null;
      }

      console.log(`✅ USDA match: ${item} → ${bestMatch.description} (similarity: ${bestSimilarity.toFixed(2)})`);

      // Calcola confidence basata su score USDA e similarity
      const confidence = Math.min(0.9, (bestMatch.score || 50) / 100 * bestSimilarity);

      return {
        name: this.cleanFoodDescription(bestMatch.description),
        nameIt: this.cleanFoodDescription(bestMatch.description), // Per ora nessuna traduzione
        category: this.categorizeUSDAFood(bestMatch),
        confidence,
        source: 'usda-matched',
        usdaId: bestMatch.fdcId
      };

    } catch (error) {
      console.error(`❌ Error searching for ${item}:`, error);
      return null;
    }
  }

  private cleanFoodDescription(description: string): string {
    // Rimuovi qualificatori comuni per ottenere il nome base
    return description
      .toLowerCase()
      .replace(/,\s*(raw|cooked|fresh|frozen|canned|dried|organic)\b/g, '')
      .replace(/\b(raw|cooked|fresh|frozen|canned|dried|organic)\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private categorizeUSDAFood(food: USDAFood): string {
    const description = food.description.toLowerCase();
    const category = food.foodCategory?.toLowerCase() || '';

    // Mapping basato su descrizione e categoria USDA (solo categorie valide dal modello)
    if (category.includes('vegetable') || 
        description.match(/\b(tomato|onion|garlic|potato|carrot|pepper|mushroom|spinach|broccoli|lettuce|cucumber)\b/)) {
      return 'vegetables';
    }
    
    if (category.includes('fruit') || 
        description.match(/\b(apple|banana|orange|lemon|strawberry|grape|cherry|melon|cantaloupe)\b/)) {
      return 'fruits';
    }
    
    if (category.includes('dairy') || 
        description.match(/\b(milk|cheese|yogurt|butter|cream)\b/)) {
      return 'dairy';
    }
    
    if (category.includes('meat') || category.includes('poultry') || category.includes('fish') ||
        description.match(/\b(chicken|beef|pork|lamb|fish|salmon|tuna|shrimp)\b/)) {
      return 'meat';
    }
    
    if (category.includes('grain') || category.includes('cereal') ||
        description.match(/\b(rice|pasta|bread|flour|oats|quinoa)\b/)) {
      return 'grains';
    }
    
    if (category.includes('legume') || 
        description.match(/\b(beans|lentils|chickpeas|peas)\b/)) {
      return 'legumes';
    }
    
    if (description.match(/\b(basil|oregano|parsley|thyme|rosemary|sage)\b/)) {
      return 'herbs';
    }
    
    if (description.match(/\b(salt|pepper|paprika|cumin|cinnamon|oil|vinegar|sauce)\b/)) {
      return 'spices';
    }

    return 'other';
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein distance con normalizzazione
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = 1 - (distance / maxLength);
    
    // Bonus se una stringa contiene l'altra
    if (str1.includes(str2) || str2.includes(str1)) {
      return Math.min(1, similarity + 0.2);
    }
    
    return similarity;
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

  private deduplicateAndSort(ingredients: ProcessedIngredient[]): ProcessedIngredient[] {
    const seenIngredients = new Map<string, ProcessedIngredient>();
    
    // Deduplica mantenendo quello con confidence più alta
    ingredients.forEach(ingredient => {
      // Usa il nome pulito come chiave per evitare duplicati come "butter, salted" e "Butter, salted"
      const key = ingredient.name.toLowerCase().trim();
      const existing = seenIngredients.get(key);
      
      if (!existing || ingredient.confidence > existing.confidence) {
        seenIngredients.set(key, ingredient);
      } else if (existing && ingredient.confidence === existing.confidence) {
        // Se stesso confidence, preferisci quello con nome più semplice (meno parole)
        const currentWords = ingredient.name.split(' ').length;
        const existingWords = existing.name.split(' ').length;
        if (currentWords < existingWords) {
          seenIngredients.set(key, ingredient);
        }
      }
    });
    
    // Ordina per confidence decrescente
    return Array.from(seenIngredients.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, parseInt(process.env.VISION_MAX_RESULTS || '12'));
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

  private hasCommonWords(item: string, description: string): boolean {
    const itemWords = item.split(' ').filter(word => word.length > 2);
    const descWords = description.split(' ').filter(word => word.length > 2);
    
    return itemWords.some(itemWord => 
      descWords.some(descWord => 
        itemWord === descWord || 
        descWord.includes(itemWord) || 
        itemWord.includes(descWord)
      )
    );
  }

  private areRelatedWords(item: string, description: string): boolean {
    // Verifica se sono parole correlate (singolare/plurale, variazioni comuni)
    const normalizedItem = item.toLowerCase();
    const normalizedDesc = description.toLowerCase();
    
    // Varianti singolare/plurale comuni
    const variations: string[] = [
      normalizedItem,
      normalizedItem + 's',
      normalizedItem + 'es'
    ];
    
    // Aggiungi varianti solo se applicabili
    if (normalizedItem.endsWith('s')) {
      variations.push(normalizedItem.slice(0, -1));
    }
    if (normalizedItem.endsWith('es')) {
      variations.push(normalizedItem.slice(0, -2));
    }
    if (normalizedItem.endsWith('ies')) {
      variations.push(normalizedItem.slice(0, -3) + 'y');
    }
    
    // Controlla se qualche variante appare nella descrizione
    return variations.some(variant => 
      normalizedDesc.includes(variant) || 
      normalizedDesc.split(' ').some(word => word === variant)
    );
  }

  private isSimpleFood(description: string): boolean {
    // Preferisci alimenti base senza troppi qualificatori
    const complexIndicators = [
      'dessert', 'frozen', 'canned', 'prepared', 'cooked', 'baked', 
      'fried', 'roasted', 'dried', 'processed', 'enriched', 'fortified',
      'creamy', 'chunky', 'sweetened', 'unsweetened', 'reduced fat',
      'low fat', 'fat free', 'organic', 'commercial'
    ];
    
    const lowerDesc = description.toLowerCase();
    return !complexIndicators.some(indicator => lowerDesc.includes(indicator));
  }

  async searchIngredients(query: string, limit: number = 20): Promise<ProcessedIngredient[]> {
    console.log(`🔍 Searching USDA for: "${query}"`);
    
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      if (normalizedQuery.length < 2) {
        return [];
      }

      const searchUrl = `${this.usdaBaseUrl}/foods/search?api_key=${this.usdaApiKey}`;
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: normalizedQuery,
          dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
          pageSize: Math.min(limit * 2, 50),
          sortBy: 'score',
          sortOrder: 'desc'
        }),
        timeout: 8000
      });

      if (!response.ok) {
        console.error(`❌ USDA API error ${response.status}`);
        return [];
      }

      const searchResult: USDASearchResult = await response.json();
      
      if (!searchResult.foods || searchResult.foods.length === 0) {
        return [];
      }

      const processedIngredients: ProcessedIngredient[] = [];
      
      for (const food of searchResult.foods.slice(0, limit)) {
        const confidence = this.calculateSearchConfidence(normalizedQuery, food);
        
        if (confidence > 0.1) {
          processedIngredients.push({
            name: this.cleanFoodDescription(food.description),
            nameIt: this.cleanFoodDescription(food.description),
            category: this.categorizeUSDAFood(food),
            confidence,
            source: 'usda-matched',
            usdaId: food.fdcId
          });
        }
      }

      return processedIngredients
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);

    } catch (error) {
      console.error('❌ Error searching ingredients:', error);
      return [];
    }
  }

  private calculateSearchConfidence(query: string, food: USDAFood): number {
    const description = food.description.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let confidence = 0.3; // Base confidence
    
    // Exact match bonus
    if (description === queryLower) {
      confidence += 0.6;
    } else if (description.includes(queryLower)) {
      confidence += 0.4;
    } else if (description.startsWith(queryLower)) {
      confidence += 0.3;
    }
    
    // USDA score factor
    const usdaScore = (food.score || 50) / 100;
    confidence *= usdaScore;
    
    // Penalize overly specific descriptions
    const commaCount = (description.match(/,/g) || []).length;
    confidence -= commaCount * 0.1;
    
    return Math.min(0.95, confidence);
  }

  async healthCheck(): Promise<{ recognizeApi: boolean; usda: boolean; overall: boolean }> {
    const checks = await Promise.allSettled([
      this.checkRecognizeApiHealth(),
      this.checkUSDAHealth()
    ]);

    const recognizeApi = checks[0].status === 'fulfilled' && checks[0].value;
    const usda = checks[1].status === 'fulfilled' && checks[1].value;

    return {
      recognizeApi,
      usda,
      overall: recognizeApi && usda
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

  private async checkUSDAHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.usdaBaseUrl}/foods/search?api_key=${this.usdaApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'apple',
          pageSize: 1
        }),
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
