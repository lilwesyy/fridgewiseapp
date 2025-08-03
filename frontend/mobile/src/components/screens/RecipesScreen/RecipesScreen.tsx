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
  RecipesHeader,
  RecipeCard,
  RecipesEmptyState,
} from './components';

// Modals
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { NotificationModal, NotificationType } from '../../modals/NotificationModal';
import { ImageViewerModal } from '../../modals/ImageViewerModal';

// Styles
import { getStyles } from './styles';

// Services
import { imageCacheService } from '../../../services/imageCacheService';

interface DishPhoto {
  url: string;
  publicId: string;
}

interface Recipe {
  id: string;
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
  dishPhoto?: DishPhoto;
  dishPhotos?: DishPhoto[];
  cookedAt?: string;
  completionCount?: number;
  createdAt: string;
  isSaved?: boolean;
  averageRating?: number;
  totalRatings?: number;
}

interface RecipesScreenProps {
  onSelectRecipe: (recipe: Recipe, allRecipes: Recipe[], index: number, isPublic?: boolean) => void;
  onGoToCamera: () => void;
}

export const RecipesScreen: React.FC<RecipesScreenProps> = ({ onSelectRecipe, onGoToCamera }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [resetTrigger, setResetTrigger] = useState(0);
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'error' as NotificationType,
    title: '',
    message: '',
  });
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [selectedImageTitle, setSelectedImageTitle] = useState('');

  // Public collections state
  const [activeTab, setActiveTab] = useState<'my-recipes' | 'explore'>('my-recipes');
  const [publicRecipes, setPublicRecipes] = useState<any[]>([]);
  const [filteredPublicRecipes, setFilteredPublicRecipes] = useState<any[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsSearchQuery, setCollectionsSearchQuery] = useState('');
  const [publicDifficultyFilter, setPublicDifficultyFilter] = useState<string>('');
  const [publicTagFilter, setPublicTagFilter] = useState<string>('');

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
    fetchRecipes();
    if (activeTab === 'explore') {
      fetchPublicRecipes();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchPublicRecipes();
    }
  }, [activeTab]);

  useEffect(() => {
    setResetTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, recipes, difficultyFilter, tagFilter]);

  useEffect(() => {
    filterPublicRecipes();
  }, [collectionsSearchQuery, publicRecipes, publicDifficultyFilter, publicTagFilter]);

  useEffect(() => {
    if (activeTab === 'explore') {
      const timeoutId = setTimeout(() => {
        fetchPublicRecipes();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [collectionsSearchQuery]);

  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      setResetTrigger(prev => prev + 1);

      const response = await fetch(`${API_URL}/api/recipe`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        let fetchedRecipes: Recipe[] = [];

        if (data.data && Array.isArray(data.data.recipes)) {
          fetchedRecipes = data.data.recipes;
        } else if (Array.isArray(data.data)) {
          fetchedRecipes = data.data;
        }

        setRecipes(fetchedRecipes);

        // Preload dish photos
        const dishPhotoUrls = fetchedRecipes
          .filter(recipe => recipe.dishPhoto?.url)
          .map(recipe => recipe.dishPhoto!.url);

        if (dishPhotoUrls.length > 0) {
          imageCacheService.preloadImages(dishPhotoUrls).catch(error => {
            console.warn('Failed to preload some images:', error);
          });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch recipes');
      }
    } catch (error) {
      console.log('Error fetching recipes:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipes.fetchError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPublicRecipes = async () => {
    try {
      setCollectionsLoading(true);
      const searchParam = collectionsSearchQuery ? `&search=${encodeURIComponent(collectionsSearchQuery)}` : '';
      const response = await fetch(`${API_URL}/api/recipe/public?sortBy=recent&limit=20${searchParam}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Recipes endpoint not available yet');
          setPublicRecipes([]);
          setFilteredPublicRecipes([]);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const recipes = data.data?.recipes || [];
      setPublicRecipes(recipes);
      setFilteredPublicRecipes(recipes);
    } catch (error) {
      console.log('Error fetching public recipes:', error);
      setPublicRecipes([]);
      setFilteredPublicRecipes([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;
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

  const filterPublicRecipes = () => {
    let filtered = publicRecipes;
    if (collectionsSearchQuery.trim()) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(collectionsSearchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(collectionsSearchQuery.toLowerCase()) ||
        recipe.ingredients.some((ingredient: any) =>
          ingredient.name.toLowerCase().includes(collectionsSearchQuery.toLowerCase())
        )
      );
    }
    if (publicDifficultyFilter) {
      filtered = filtered.filter(recipe => recipe.difficulty === publicDifficultyFilter);
    }
    if (publicTagFilter) {
      filtered = filtered.filter(recipe => recipe.dietaryTags.includes(publicTagFilter));
    }
    setFilteredPublicRecipes(filtered);
  };

  const handleDeleteRequest = (recipe: Recipe) => {
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
      if ((recipeToDelete as any).isSaved) {
        setRecipes(prev => prev.filter(r => {
          const currentRecipeId = (r as any)._id || r.id;
          return currentRecipeId !== recipeId;
        }));
        setNotification({
          visible: true,
          type: 'success',
          title: t('common.success'),
          message: t('recipe.deleteSuccess'),
        });
      } else {
        const deleteResponse = await fetch(`${API_URL}/api/recipe/${recipeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (deleteResponse.ok) {
          setRecipes(prev => prev.filter(r => {
            const currentRecipeId = (r as any)._id || r.id;
            return currentRecipeId !== recipeId;
          }));
          setNotification({
            visible: true,
            type: 'success',
            title: t('common.success'),
            message: t('recipe.deleteSuccess'),
          });
        } else {
          throw new Error('Failed to delete recipe');
        }
      }
    } catch (error) {
      console.log('Error deleting recipe:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipe.deleteError'),
      });
    } finally {
      setRecipeToDelete(null);
    }
  };

  const handlePhotoPress = (imageUrl: string, title: string) => {
    setSelectedImageUrls([imageUrl]);
    setSelectedImageTitle(title);
    setImageViewerVisible(true);
  };

  const renderRecipe = ({ item, index }: { item: Recipe; index: number }) => {
    return (
      <RecipeCard
        recipe={item}
        index={index}
        onPress={() => {
          const idx = filteredRecipes.findIndex(r => {
            const currentRecipeId = (r as any)._id || r.id;
            const itemId = (item as any)._id || item.id;
            return currentRecipeId === itemId;
          });
          onSelectRecipe(item, filteredRecipes, idx, false);
        }}
        onDelete={() => handleDeleteRequest(item)}
        onPhotoPress={handlePhotoPress}
        isPublic={false}
      />
    );
  };

  const renderPublicRecipe = ({ item, index }: { item: Recipe; index: number }) => {
    return (
      <RecipeCard
        recipe={item}
        index={index}
        onPress={() => {
          onSelectRecipe(item, [item], 0, true);
        }}
        onPhotoPress={handlePhotoPress}
        isPublic={true}
      />
    );
  };

  const currentSearchQuery = activeTab === 'my-recipes' ? searchQuery : collectionsSearchQuery;
  const currentRecipes = activeTab === 'my-recipes' ? filteredRecipes : filteredPublicRecipes;
  const hasRecipes = activeTab === 'my-recipes' ? recipes.length > 0 : publicRecipes.length > 0;
  const hasSearchQuery = currentSearchQuery.trim().length > 0;
  const hasFilters = activeTab === 'my-recipes' 
    ? (difficultyFilter || tagFilter)
    : (publicDifficultyFilter || publicTagFilter);
  const currentLoading = activeTab === 'my-recipes' ? isLoading : collectionsLoading;

  return (
    <View style={styles.container}>
      <RecipesHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        collectionsSearchQuery={collectionsSearchQuery}
        onSearchChange={setSearchQuery}
        onCollectionsSearchChange={setCollectionsSearchQuery}
        difficultyFilter={difficultyFilter}
        tagFilter={tagFilter}
        publicDifficultyFilter={publicDifficultyFilter}
        publicTagFilter={publicTagFilter}
        onDifficultyChange={setDifficultyFilter}
        onTagChange={setTagFilter}
        onPublicDifficultyChange={setPublicDifficultyFilter}
        onPublicTagChange={setPublicTagFilter}
      />

      {currentRecipes.length === 0 ? (
        <RecipesEmptyState
          activeTab={activeTab}
          hasRecipes={hasRecipes}
          hasSearchQuery={hasSearchQuery}
          hasFilters={hasFilters}
          isLoading={currentLoading}
          onGoToCamera={onGoToCamera}
        />
      ) : (
        <Animated.View style={[styles.content, listAnimatedStyle]}>
          <FlatList
            data={currentRecipes}
            renderItem={activeTab === 'my-recipes' ? renderRecipe : renderPublicRecipe}
            keyExtractor={(item) => (item as any)._id || item.id}
            style={styles.recipesList}
            showsVerticalScrollIndicator={false}
            refreshing={currentLoading}
            onRefresh={activeTab === 'my-recipes' ? fetchRecipes : fetchPublicRecipes}
            refreshControl={
              <RefreshControl
                refreshing={currentLoading}
                onRefresh={activeTab === 'my-recipes' ? fetchRecipes : fetchPublicRecipes}
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
      />

      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      <ImageViewerModal
        visible={imageViewerVisible}
        imageUrls={selectedImageUrls}
        title={selectedImageTitle}
        onClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
};