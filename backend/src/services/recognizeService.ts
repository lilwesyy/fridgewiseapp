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

interface ProcessedIngredient {
  name: string;
  nameIt?: string;
  category: string;
  confidence: number;
}

const FOOD_CATEGORIES = {
  vegetables: ['tomato', 'potato', 'onion', 'garlic', 'carrot', 'celery', 'pepper', 'broccoli', 'spinach', 'lettuce', 'cucumber', 'zucchini', 'eggplant', 'mushroom'],
  fruits: ['apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'grape', 'peach', 'pear', 'cherry', 'watermelon', 'pineapple', 'mango'],
  meat: ['chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon', 'sausage', 'turkey', 'ham'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'mozzarella', 'parmesan', 'ricotta', 'eggs', 'egg'],
  grains: ['rice', 'pasta', 'bread', 'flour', 'quinoa', 'oats', 'barley', 'wheat', 'noodles', 'spaghetti'],
  legumes: ['beans', 'lentils', 'chickpeas', 'peas', 'soybeans', 'kidney beans', 'black beans', 'white beans'],
  herbs: ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'mint', 'sage', 'dill'],
  spices: ['salt', 'pepper', 'paprika', 'cumin', 'coriander', 'cinnamon', 'nutmeg', 'ginger', 'turmeric']
};

const INGREDIENT_TRANSLATIONS = {
  'tomato': 'pomodoro',
  'potato': 'patata',
  'onion': 'cipolla',
  'garlic': 'aglio',
  'carrot': 'carota',
  'celery': 'sedano',
  'bell pepper': 'peperone',
  'broccoli': 'broccoli',
  'spinach': 'spinaci',
  'lettuce': 'lattuga',
  'cucumber': 'cetriolo',
  'zucchini': 'zucchina',
  'eggplant': 'melanzana',
  'mushroom': 'fungo',
  'apple': 'mela',
  'banana': 'banana',
  'orange': 'arancia',
  'lemon': 'limone',
  'strawberry': 'fragola',
  'cheese': 'formaggio',
  'milk': 'latte',
  'eggs': 'uova',
  'butter': 'burro',
  'chicken': 'pollo',
  'beef': 'manzo',
  'fish': 'pesce',
  'rice': 'riso',
  'pasta': 'pasta',
  'bread': 'pane',
  'flour': 'farina',
  'beans': 'fagioli',
  'basil': 'basilico',
  'oregano': 'origano',
  'parsley': 'prezzemolo',
  'salt': 'sale',
  'pepper': 'pepe'
};

export class RecognizeService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.RECOGNIZE_API_URL || 'http://localhost:8000';
  }

  async analyzeImage(imagePath: string): Promise<ProcessedIngredient[]> {
    try {
      console.log('🔍 Starting image analysis for:', imagePath);
      console.log('📡 Recognition API URL:', this.apiUrl);

      // First check if the API is available
      const healthy = await this.healthCheck();
      if (!healthy) {
        console.log('⚠️ Recognition API not available, using mock data');
        return this.getMockIngredients();
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      console.log('📤 Sending request to recognition API...');
      const response = await fetch(`${this.apiUrl}/`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        timeout: 30000 // 30 second timeout
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Recognition API error:', response.status, errorText);
        
        // Fall back to mock data if API fails
        console.log('🔄 Falling back to mock data due to API error');
        return this.getMockIngredients();
      }

      const result = await response.json() as RecognitionResult;
      console.log('✅ Recognition result:', result);
      
      // Verifica che la risposta abbia il formato atteso
      if (!result || (!result.tags && !result.english) || 
          (!Array.isArray(result.tags) && !Array.isArray(result.english))) {
        console.error('❌ Invalid response format from recognition API:', result);
        console.log('🔄 Falling back to mock data due to invalid response');
        return this.getMockIngredients();
      }
      
      const processedIngredients = this.processRecognitionResult(result);
      
      // If no ingredients found, don't fallback to mock data
      if (processedIngredients.length === 0) {
        console.log('🚫 No valid ingredients detected in image');
        return [];
      }
      
      return processedIngredients;
    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      console.log('🔄 Falling back to mock data due to error');
      return this.getMockIngredients();
    }
  }

  private processRecognitionResult(result: RecognitionResult): ProcessedIngredient[] {
    // Usa tags se disponibile, altrimenti usa english
    const tags = result.tags || result.english || [];
    
    if (tags.length === 0) {
      return [];
    }

    const ingredients: ProcessedIngredient[] = [];
    
    // Process each tag and check if it's food-related
    tags.forEach((tag, index) => {
      const foodInfo = this.identifyFoodItem(tag);
      
      if (foodInfo) {
        // Calculate confidence score (higher for items found earlier in the list)
        // Penalizza ingredienti che appaiono dopo la posizione 8 (spesso falsi positivi)
        let confidence = Math.max(0.5, 1 - (index * 0.1));
        
        // Riduce confidence per ingredienti che appaiono in posizione alta ma sono problematici
        const problematicIngredients = ['melon', 'cantaloupe'];
        if (problematicIngredients.includes(tag.toLowerCase()) && index > 3) {
          confidence *= 0.7; // Riduce confidence del 30%
        }
        
        console.log(`✅ Accepted ingredient: ${tag} → ${foodInfo.name} (${foodInfo.category}) - confidence: ${confidence.toFixed(2)}`);
        ingredients.push({
          name: foodInfo.name,
          nameIt: foodInfo.nameIt,
          category: foodInfo.category,
          confidence: Math.min(confidence, 1)
        });
      } else {
        console.log(`❌ Filtered out: ${tag} (generic/non-food)`);
      }
    });

    // Remove duplicates and sort by confidence
    const uniqueIngredients = this.removeDuplicateIngredients(ingredients);
    
    // Filtra per confidence minima e limita risultati
    const filteredIngredients = uniqueIngredients
      .filter(ingredient => ingredient.confidence >= 0.6) // Solo ingredienti con confidence >= 60%
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Limit to top 10 ingredients
    
    console.log(`🎯 Final ingredients (${filteredIngredients.length}):`, 
      filteredIngredients.map(i => `${i.name} (${i.confidence.toFixed(2)})`));
    
    // Verifica se ci sono abbastanza ingredienti validi
    const highConfidenceIngredients = filteredIngredients.filter(i => i.confidence >= 0.75);
    
    if (filteredIngredients.length === 0) {
      console.log('❌ No valid ingredients found');
      return [];
    }
    
    if (filteredIngredients.length < 2 && highConfidenceIngredients.length === 0) {
      console.log('⚠️ Not enough confident ingredients detected');
      return [];
    }
    
    return filteredIngredients;
  }

  private identifyFoodItem(tag: string): { name: string; nameIt?: string; category: string } | null {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Lista di termini generici da escludere
    const genericTerms = [
      'food', 'fruit', 'vegetable', 'produce', 'organic', 'fresh', 'green', 'red', 'yellow',
      'bin', 'box', 'container', 'carton', 'cooler', 'fill', 'bag', 'package', 'wrapper',
      'plate', 'bowl', 'dish', 'kitchen', 'cooking', 'meal', 'diet', 'healthy', 'nutrition',
      'color', 'natural', 'raw', 'ripe', 'sweet', 'juicy', 'crisp', 'crunchy',
      // Aggiungi termini non alimentari comuni
      'man', 'woman', 'person', 'people', 'human', 'face', 'hand', 'body',
      'dark', 'light', 'shadow', 'bright', 'night', 'day', 'morning', 'evening',
      'sky', 'cloud', 'sun', 'moon', 'star', 'weather', 'indoor', 'outdoor',
      'background', 'foreground', 'texture', 'pattern', 'surface', 'material',
      'night view', 'view', 'scene', 'image', 'photo', 'picture'
    ];
    
    // Escludi termini generici
    if (genericTerms.includes(normalizedTag)) {
      return null;
    }
    
    // Check each food category per match esatto
    for (const [category, items] of Object.entries(FOOD_CATEGORIES)) {
      for (const item of items) {
        // Match esatto prioritario
        if (normalizedTag === item) {
          return {
            name: item,
            nameIt: INGREDIENT_TRANSLATIONS[item as keyof typeof INGREDIENT_TRANSLATIONS],
            category
          };
        }
        
        // Fuzzy matching più rigoroso
        const lengthDiff = Math.abs(normalizedTag.length - item.length);
        
        // Solo match se:
        // 1. Il tag contiene l'item come parola completa o sottostringa significativa
        // 2. La differenza di lunghezza non è troppo grande (max 3 caratteri)
        // 3. Il match è all'inizio o alla fine della parola (non nel mezzo)
        if (lengthDiff <= 3) {
          if (normalizedTag.includes(item) && 
              (normalizedTag.startsWith(item) || normalizedTag.endsWith(item)) &&
              normalizedTag.length - item.length <= 3) {
            return {
              name: item,
              nameIt: INGREDIENT_TRANSLATIONS[item as keyof typeof INGREDIENT_TRANSLATIONS],
              category
            };
          }
          
          if (item.includes(normalizedTag) && 
              (item.startsWith(normalizedTag) || item.endsWith(normalizedTag)) &&
              item.length - normalizedTag.length <= 3 &&
              normalizedTag.length >= 3) { // Il tag deve essere almeno 3 caratteri
            return {
              name: item,
              nameIt: INGREDIENT_TRANSLATIONS[item as keyof typeof INGREDIENT_TRANSLATIONS],
              category
            };
          }
        }
      }
    }

    // Match specifici per ingredienti riconosciuti
    // Nota: cantaloupe e melon sono la stessa cosa, usiamo solo "melon"
    const specificMatches: { [key: string]: { name: string; nameIt?: string; category: string } } = {
      'apple': { name: 'apple', nameIt: 'mela', category: 'fruits' },
      'carrot': { name: 'carrot', nameIt: 'carota', category: 'vegetables' },
      'cantaloupe': { name: 'melon', nameIt: 'melone', category: 'fruits' }, // Unifica con melon
      'melon': { name: 'melon', nameIt: 'melone', category: 'fruits' },
      // Rimuoviamo squash perché spesso riconosciuto erroneamente
      // 'squash': { name: 'squash', nameIt: 'zucca', category: 'vegetables' },
      'zucchini': { name: 'zucchini', nameIt: 'zucchina', category: 'vegetables' },
      'pumpkin': { name: 'pumpkin', nameIt: 'zucca', category: 'vegetables' }
    };
    
    if (specificMatches[normalizedTag]) {
      return specificMatches[normalizedTag];
    }

    return null;
  }


  private removeDuplicateIngredients(ingredients: ProcessedIngredient[]): ProcessedIngredient[] {
    const seen = new Set<string>();
    const unique: ProcessedIngredient[] = [];

    // Ordina per confidence prima di rimuovere duplicati
    const sortedIngredients = ingredients.sort((a, b) => b.confidence - a.confidence);

    for (const ingredient of sortedIngredients) {
      const key = ingredient.name.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(ingredient);
        console.log(`🔥 Keeping: ${ingredient.name} (confidence: ${ingredient.confidence.toFixed(2)})`);
      } else {
        console.log(`🗑️ Removing duplicate: ${ingredient.name} (confidence: ${ingredient.confidence.toFixed(2)})`);
      }
    }

    return unique;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Il servizio non ha un endpoint /health, proviamo con OPTIONS su /
      const response = await fetch(`${this.apiUrl}/`, {
        method: 'OPTIONS',
        timeout: 5000
      });
      
      console.log('🩺 Health check response:', response.status);
      return response.status < 500; // Accetta anche 405 Method Not Allowed
    } catch (error) {
      console.error('Recognize API health check failed:', error);
      return false;
    }
  }

  private getMockIngredients(): ProcessedIngredient[] {
    // Mock data for testing when recognition service is not available
    const mockIngredients = [
      { name: 'tomato', nameIt: 'pomodoro', category: 'vegetables', confidence: 0.95 },
      { name: 'cheese', nameIt: 'formaggio', category: 'dairy', confidence: 0.88 },
      { name: 'basil', nameIt: 'basilico', category: 'herbs', confidence: 0.82 },
      { name: 'onion', nameIt: 'cipolla', category: 'vegetables', confidence: 0.76 },
      { name: 'garlic', nameIt: 'aglio', category: 'vegetables', confidence: 0.71 }
    ];

    console.log('🎭 Using mock ingredients:', mockIngredients);
    return mockIngredients;
  }
}