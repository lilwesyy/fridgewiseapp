import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface RecognitionResult {
  tags: string[];
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
  'pepper': 'peperone',
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
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      const response = await fetch(`${this.apiUrl}/`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Recognition API error: ${response.status}`);
      }

      const result = await response.json() as RecognitionResult;
      
      return this.processRecognitionResult(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  }

  private processRecognitionResult(result: RecognitionResult): ProcessedIngredient[] {
    if (!result.tags || result.tags.length === 0) {
      return [];
    }

    const ingredients: ProcessedIngredient[] = [];
    
    // Process each tag and check if it's food-related
    result.tags.forEach((tag, index) => {
      const foodInfo = this.identifyFoodItem(tag);
      
      if (foodInfo) {
        // Calculate confidence score (higher for items found earlier in the list)
        const confidence = Math.max(0.5, 1 - (index * 0.1));
        
        ingredients.push({
          name: foodInfo.name,
          nameIt: foodInfo.nameIt,
          category: foodInfo.category,
          confidence: Math.min(confidence, 1)
        });
      }
    });

    // Remove duplicates and sort by confidence
    const uniqueIngredients = this.removeDuplicateIngredients(ingredients);
    
    return uniqueIngredients
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20); // Limit to top 20 ingredients
  }

  private identifyFoodItem(tag: string): { name: string; nameIt?: string; category: string } | null {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Check each food category
    for (const [category, items] of Object.entries(FOOD_CATEGORIES)) {
      for (const item of items) {
        if (normalizedTag.includes(item) || item.includes(normalizedTag)) {
          return {
            name: item,
            nameIt: INGREDIENT_TRANSLATIONS[item as keyof typeof INGREDIENT_TRANSLATIONS],
            category
          };
        }
      }
    }

    // Check if the tag itself might be a food item (fuzzy matching)
    if (this.isFoodRelated(normalizedTag)) {
      return {
        name: normalizedTag,
        nameIt: INGREDIENT_TRANSLATIONS[normalizedTag as keyof typeof INGREDIENT_TRANSLATIONS],
        category: 'other'
      };
    }

    return null;
  }

  private isFoodRelated(tag: string): boolean {
    const foodKeywords = [
      'food', 'ingredient', 'vegetable', 'fruit', 'meat', 'dairy', 'grain', 'spice', 'herb',
      'fresh', 'organic', 'cooking', 'cuisine', 'dish', 'meal', 'recipe'
    ];

    return foodKeywords.some(keyword => tag.includes(keyword));
  }

  private removeDuplicateIngredients(ingredients: ProcessedIngredient[]): ProcessedIngredient[] {
    const seen = new Set<string>();
    const unique: ProcessedIngredient[] = [];

    for (const ingredient of ingredients) {
      const key = ingredient.name.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(ingredient);
      } else {
        // If we've seen this ingredient before, keep the one with higher confidence
        const existingIndex = unique.findIndex(u => u.name.toLowerCase() === key);
        if (existingIndex !== -1 && ingredient.confidence > unique[existingIndex].confidence) {
          unique[existingIndex] = ingredient;
        }
      }
    }

    return unique;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.error('Recognize API health check failed:', error);
      return false;
    }
  }
}