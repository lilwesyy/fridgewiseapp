import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserStatistics {
  recipesCreated: number;
  ingredientsScanned: number;
  favoriteRecipes: number;
  totalAnalyses: number;
  lastAnalysisDate?: Date;
  lastRecipeDate?: Date;
}

interface DetailedStatistics {
  recipesByDifficulty: Record<string, number>;
  recipesByDietaryTags: Record<string, number>;
  ingredientsByCategory: Record<string, number>;
  analysisHistory: Record<string, number>;
}

interface RecentRecipe {
  _id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  imageUrl?: string;
  dishPhotos: { url: string; publicId: string }[];
  language: 'en' | 'it';
  originalIngredients: string[];
  createdAt: string;
  updatedAt: string;
  isSaved: boolean;
}

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [detailedStatistics, setDetailedStatistics] = useState<DetailedStatistics | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  const fetchStatistics = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/user/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailedStatistics = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user/statistics/detailed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDetailedStatistics(data);
    } catch (err) {
      console.error('Error fetching detailed statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch detailed statistics');
    }
  };

  const fetchRecentRecipes = async (limit: number = 5, type: 'saved' | 'created' = 'saved') => {
    if (!token) {
      return;
    }

    try {
      setIsLoadingRecipes(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/user/recent-recipes?limit=${limit}&type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRecentRecipes(data);
    } catch (err) {
      console.error('Error fetching recent recipes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent recipes');
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  const refreshStatistics = async () => {
    await Promise.all([
      fetchStatistics(),
      fetchRecentRecipes(3)
    ]);
  };

  useEffect(() => {
    fetchStatistics();
    fetchRecentRecipes(3); // Limit to 3 recent recipes for home screen
  }, [token]);

  return {
    statistics,
    detailedStatistics,
    recentRecipes,
    isLoading,
    isLoadingRecipes,
    error,
    refreshStatistics,
    fetchDetailedStatistics,
    fetchRecentRecipes,
  };
};

export default useStatistics;