import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  EASING_CURVES 
} from '../../../constants/animations';

// Components
import {
  SavedHeader,
  SavedCard,
  SavedEmptyState,
} from './components';

// Modals
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { NotificationModal, NotificationType } from '../../modals/NotificationModal';

// Styles
import { getStyles } from './styles';

interface SavedRecipe {
  id: string;
  _id?: string;
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
  language: 'en' | 'it';
  savedAt: string;
  dishPhotos: { url: string; publicId: string }[];
  cookedAt?: string;
  completionCount?: number;
  isPublicRecipe?: boolean;
  originalCreator?: {
    _id: string;
    name: string;
    email: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  };
  userRating?: number;
  userComment?: string;
}

interface SavedScreenProps {
  onSelectRecipe: (recipe: SavedRecipe, allRecipes: SavedRecipe[], index: number) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ onSelectRecipe }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  // State
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<SavedRecipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [resetTrigger, setResetTrigger] = useState(0);
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<SavedRecipe | null>(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'error' as NotificationType,
    title: '',
    message: '',
  });

  // Animation values
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(40);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // Animation setup
  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    listOpacity.value = withDelay(200, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    listTranslateY.value = withDelay(200, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, []);

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  // Data fetching
  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  useEffect(() => {
    setResetTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, savedRecipes, difficultyFilter, tagFilter]);

  const fetchSavedRecipes = async () => {
    try {
      setIsLoading(true);
      setResetTrigger(prev => prev + 1);

      const response = await fetch(`${API_URL}/api/recipe/saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        let fetchedRecipes: SavedRecipe[] = [];

        if (data.data && Array.isArray(data.data.recipes)) {
          fetchedRecipes = data.data.recipes;
        } else if (Array.isArray(data.data)) {
          fetchedRecipes = data.data;
        }

        setSavedRecipes(fetchedRecipes);
      } else {
        throw new Error(data.error || 'Failed to fetch saved recipes');
      }
    } catch (error) {
      console.log('Error fetching saved recipes:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('saved.fetchError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = savedRecipes;
    if (searchQuery.trim()) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    if (difficultyFilter) {
      filtered = filtered.filter(recipe => recipe.difficulty === difficultyFilter);
    }
    if (tagFilter) {
      filtered = filtered.filter(recipe => recipe.dietaryTags.includes(tagFilter));
    }
    setFilteredRecipes(filtered);
  };

  const handleDeleteRequest = (recipe: SavedRecipe) => {
    setRecipeToDelete(recipe);
    setShowDeleteModal(true);
  };

  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    setShowDeleteModal(false);
    try {
      const recipeId = (recipeToDelete as any)._id || recipeToDelete.id;
      if (!recipeId) {
        setNotification({
          visible: true,
          type: 'error',
          title: t('common.error'),
          message: t('recipe.invalidIdError'),
        });
        return;
      }

      const deleteResponse = await fetch(`${API_URL}/api/recipe/saved/${recipeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (deleteResponse.ok) {
        setSavedRecipes(prev => prev.filter(r => {
          const currentRecipeId = (r as any)._id || r.id;
          return currentRecipeId !== recipeId;
        }));
        setNotification({
          visible: true,
          type: 'success',
          title: t('common.success'),
          message: t('saved.removeSuccess'),
        });
      } else {
        throw new Error('Failed to remove saved recipe');
      }
    } catch (error) {
      console.log('Error removing saved recipe:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('saved.removeError'),
      });
    } finally {
      setRecipeToDelete(null);
    }
  };

  const renderSavedRecipe = ({ item, index }: { item: SavedRecipe; index: number }) => {
    return (
      <SavedCard
        recipe={item}
        index={index}
        onPress={() => {
          const idx = filteredRecipes.findIndex(r => {
            const currentRecipeId = (r as any)._id || r.id;
            const itemId = (item as any)._id || item.id;
            return currentRecipeId === itemId;
          });
          onSelectRecipe(item, filteredRecipes, idx);
        }}
        onDelete={() => handleDeleteRequest(item)}
      />
    );
  };

  const hasRecipes = savedRecipes.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasFilters = difficultyFilter || tagFilter;

  return (
    <View style={styles.container}>
      <SavedHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        difficultyFilter={difficultyFilter}
        tagFilter={tagFilter}
        onDifficultyChange={setDifficultyFilter}
        onTagChange={setTagFilter}
      />

      {filteredRecipes.length === 0 ? (
        <SavedEmptyState
          hasRecipes={hasRecipes}
          hasSearchQuery={hasSearchQuery}
          hasFilters={hasFilters}
          isLoading={isLoading}
        />
      ) : (
        <Animated.View style={[styles.content, listAnimatedStyle]}>
          <FlatList
            data={filteredRecipes}
            renderItem={renderSavedRecipe}
            keyExtractor={(item) => (item as any)._id || item.id}
            style={styles.recipesList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchSavedRecipes}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchSavedRecipes}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        </Animated.View>
      )}

      <DeleteConfirmationModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteRecipe}
        title={t('saved.removeTitle')}
        message={recipeToDelete ? t('saved.removeMessage', { title: recipeToDelete.title }) : ''}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
      />

      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </View>
  );
};