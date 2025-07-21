export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  currentCount?: number;
  maxAllowed?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    preferredLanguage: string;
    dietaryRestrictions: string[];
  };
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  preferredLanguage?: string;
  dietaryRestrictions?: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface IngredientData {
  name: string;
  nameIt?: string;
  category?: string;
  confidence?: number;
}

export interface RecipeData {
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string[];
  cookingTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  dietaryTags?: string[];
  language?: string;
  imageUrl?: string;
  originalIngredients?: string[];
}

export interface AnalysisData {
  ingredients: IngredientData[];
  imageUrl: string;
  processingTime?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface DishPhotoUploadResponse {
  url: string;
  publicId: string;
  originalSize: number;
  compressedSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}