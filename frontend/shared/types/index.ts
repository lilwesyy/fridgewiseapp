export interface User {
  id: string;
  email: string;
  name?: string;
  preferredLanguage: 'en' | 'it';
  dietaryRestrictions: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Ingredient {
  id: string;
  name: string;
  nameIt?: string;
  category: string;
  confidence: number;
}

export interface DishPhoto {
  url: string;
  publicId: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  cookingTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  language: 'en' | 'it';
  userId: string;
  imageUrl?: string;
  dishPhotos: DishPhoto[];
  cookedAt?: Date;
  completionCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface AnalysisResult {
  id: string;
  ingredients: Ingredient[];
  imageUrl: string;
  userId: string;
  createdAt: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RecipeGenerationRequest {
  ingredients: string[];
  language: 'en' | 'it';
  dietaryRestrictions?: string[];
  servings?: number;
  cookingTime?: number;
}

export interface CameraPermission {
  granted: boolean;
  canAskAgain: boolean;
}

export interface AppSettings {
  language: 'en' | 'it';
  notifications: boolean;
  cameraQuality: 'low' | 'medium' | 'high';
  autoSave: boolean;
}