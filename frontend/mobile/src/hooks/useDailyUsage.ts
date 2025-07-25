import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface DailyUsageData {
  recipeGenerations: {
    used: number;
    limit: number;
    remaining: number;
  };
  aiChatMessages: {
    used: number;
    limit: number;
    remaining: number;
  };
  imageAnalyses: {
    used: number;
    limit: number;
    remaining: number;
  };
  date: string;
}

export const useDailyUsage = () => {
  const [usage, setUsage] = useState<DailyUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const fetchUsage = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/usage/daily`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch usage data');
      }

      setUsage(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch daily usage:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsage();
    }
  }, [token]);

  const refresh = () => {
    fetchUsage();
  };

  // Admin users have infinite limits
  const isAdmin = user?.role === 'admin';
  const canGenerateRecipe = isAdmin || (usage ? usage.recipeGenerations.remaining > 0 : true);
  const canUseAiChat = isAdmin || (usage ? usage.aiChatMessages.remaining > 0 : true);
  const canAnalyzeImage = isAdmin || (usage ? usage.imageAnalyses.remaining > 0 : true);

  return {
    usage,
    isLoading,
    error,
    refresh,
    canGenerateRecipe,
    canUseAiChat,
    canAnalyzeImage,
  };
};