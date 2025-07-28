import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  PanResponder,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { VectorIcon, MappedIcon } from '../ui/VectorIcon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';
import { NotificationModal, NotificationType } from '../modals/NotificationModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { StarRating } from '../ui/StarRating';
import Animated,
{
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES } from '../../constants/animations';
import { imageCacheService } from '../../services/imageCacheService';

const { width: screenWidth } = Dimensions.get('window');

const DEFAULT_DELETE_TEXT = 'Delete';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  resetTrigger?: number; // Add reset trigger prop
}

const SwipeableRow: React.FC<SwipeableRowProps> = (props) => {
  const initialValue = 0;
  const translateX = useSharedValue(initialValue);
  const [isRevealed, setIsRevealed] = useState(false);
  const deleteButtonWidth = 100;

  // Reset when props.resetTrigger changes
  useEffect(() => {
    if (props.resetTrigger !== undefined) {
      translateX.value = withSpring(0, SPRING_CONFIGS.STANDARD);
      setIsRevealed(false);
    }
  }, [props.resetTrigger]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        // Swipe left - reveal delete button
        const newTranslateX = Math.max(gestureState.dx, -deleteButtonWidth);
        translateX.value = newTranslateX;
      } else if (gestureState.dx > 0 && isRevealed) {
        // Swipe right when already revealed - hide delete button
        const newTranslateX = Math.min(gestureState.dx - deleteButtonWidth, 0);
        translateX.value = newTranslateX;
      } else if (gestureState.dx > 0 && !isRevealed) {
        // Swipe right when not revealed - keep at 0
        translateX.value = 0;
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        // Swipe left enough to reveal delete button
        translateX.value = withSpring(-deleteButtonWidth, SPRING_CONFIGS.STANDARD);
        runOnJS(setIsRevealed)(true);
      } else if (gestureState.dx > 50 && isRevealed) {
        // Swipe right enough to hide delete button when revealed
        translateX.value = withSpring(0, SPRING_CONFIGS.STANDARD);
        runOnJS(setIsRevealed)(false);
      } else {
        // Snap to appropriate position based on current state
        const targetValue = isRevealed ? -deleteButtonWidth : 0;
        translateX.value = withSpring(targetValue, SPRING_CONFIGS.STANDARD);
      }
    },
  });

  const handleDelete = () => {
    // Animate the deletion
    translateX.value = withTiming(-screenWidth, { duration: ANIMATION_DURATIONS.STANDARD }, (finished) => {
      if (finished) {
        runOnJS(props.onDelete)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity
        style={styles.deleteBackground}
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <MappedIcon icon="delete" size={24} color="white" filled />
        <Text style={styles.deleteText}>
          {DEFAULT_DELETE_TEXT}
        </Text>
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.swipeRow,
          animatedStyle
        ]}
        pointerEvents='auto'
        {...panResponder.panHandlers}
      >
        {props.children}
      </Animated.View>
    </View>
  );
};

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
  // Rating system
  averageRating?: number;
  totalRatings?: number;
}

interface RecipesScreenProps {
  onSelectRecipe: (recipe: Recipe, allRecipes: Recipe[], index: number, isPublic?: boolean) => void;
  onGoToCamera: () => void;
}

interface RecipeItemProps {
  item: Recipe;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  onPhotoPress: (imageUrl: string, title: string) => void;
  resetTrigger: number;
  t: (key: string) => string;
  formatDate: (date: string) => string;
  getDifficultyColor: (difficulty: string) => string;
  isPublic?: boolean;
}

const RecipeItem: React.FC<RecipeItemProps> = (props) => {
  const { colors } = useTheme();
  const cardOpacity = useSharedValue(0);

  // Helper function to determine if recipe is public (should show rating)
  const isRecipePublic = () => {
    return props.isPublic || (props.item.isSaved && ((props.item.dishPhotos && props.item.dishPhotos.length > 0) || props.item.cookedAt));
  };
  const cardScale = useSharedValue(0.8);
  const cardTranslateY = useSharedValue(30);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cachedImageUri, setCachedImageUri] = useState<string | null>(null);

  React.useEffect(() => {
    const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);
    const delay = ANIMATION_DURATIONS.CONTENT + (props.index * 50); // Start after list container animation, reduced delay
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    cardScale.value = withDelay(delay, withSpring(1, SPRING_CONFIGS.STANDARD));
    cardTranslateY.value = withDelay(delay, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, [props.index]);

  // Preload and cache dish photo
  React.useEffect(() => {
    if (props.item.dishPhoto?.url) {
      imageCacheService.getCachedImage(props.item.dishPhoto.url)
        .then(cachedUri => {
          setCachedImageUri(cachedUri);
        })
        .catch(error => {
          console.warn('Failed to cache image:', error);
          setCachedImageUri(props.item.dishPhoto!.url); // Fallback to original URL
        });
    }
  }, [props.item.dishPhoto?.url]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value }
    ],
  }));

  const handlePhotoPress = () => {
    if (props.item.dishPhoto?.url) {
      props.onPhotoPress(props.item.dishPhoto.url, props.item.title);
    }
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      {/* <SwipeableRow
        onDelete={props.onDelete}
        resetTrigger={props.resetTrigger}
      > */}
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: colors.shadow || '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={props.onPress}
        activeOpacity={0.7}
      >

        <View style={styles.recipeHeader}>
          <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
            {props.item.title}
          </Text>
          <View style={[styles.difficultyBadge, { backgroundColor: props.getDifficultyColor(props.item.difficulty) }]}>
            <Text style={[styles.difficultyText, { color: colors.buttonText }]}>
              {props.t(`recipes.difficulty.${props.item.difficulty}`)}
            </Text>
          </View>
        </View>
        <Text style={[styles.recipeDescription, { color: colors.textSecondary }]} numberOfLines={3}>
          {props.item.description}
        </Text>
        <View style={styles.recipeMetadata}>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
              {'⏱️'} {props.item.cookingTime} min
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
              {'👥'} {props.item.servings}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
              {'🥘'} {props.item.ingredients?.length || 0} {props.t('recipe.ingredients')}
            </Text>
          </View>
          {!!(props.item.completionCount && props.item.completionCount > 0) && (
            <View style={styles.metadataItem}>
              <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
                {'🍽️'} {props.item.completionCount}x {props.t('recipes.cooked')}
              </Text>
            </View>
          )}
        </View>
        {!!(props.item.dietaryTags && props.item.dietaryTags.length > 0) && (
          <View style={styles.dietaryTags}>
            {props.item.dietaryTags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.dietaryTag, { backgroundColor: colors.card }]}>
                <Text style={[styles.dietaryTagText, { color: colors.primary }]}>
                  {props.t(`recipes.dietary.${tag.replace('-', '')}`)}
                </Text>
              </View>
            ))}
            {!!(props.item.dietaryTags && props.item.dietaryTags.length > 3) && (
              <Text style={[styles.moreTagsText, { color: colors.textSecondary }]}>+{props.item.dietaryTags.length - 3}</Text>
            )}
          </View>
        )}
        <View style={styles.recipeFooter}>
          <Text style={[styles.recipeDate, { color: colors.textSecondary }]}>{props.formatDate(props.item.createdAt)}</Text>
          {isRecipePublic() && (
            <View style={styles.ratingContainer}>
              <StarRating
                rating={props.item.averageRating || 0}
                size={16}
                color="#FFD700"
                emptyColor="#E5E5E5"
              />
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                ({props.item.totalRatings || 0})
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {/* </SwipeableRow> */}
    </Animated.View>
  );
};

export const RecipesScreen: React.FC<RecipesScreenProps> = ({ onSelectRecipe, onGoToCamera }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [resetTrigger, setResetTrigger] = useState(0);
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

  const dietaryTags = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'
  ];

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerTranslateY = useSharedValue(-30);

  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(20);

  const filtersOpacity = useSharedValue(0);
  const filtersTranslateX = useSharedValue(-50);

  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(40);

  // Entrance animations with iOS standards
  useEffect(() => {
    const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);

    // Header animation - immediate
    headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    headerScale.value = withSpring(1, SPRING_CONFIGS.GENTLE);
    headerTranslateY.value = withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing });

    // Search bar animation - quick delay
    searchOpacity.value = withDelay(100, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    searchTranslateY.value = withDelay(100, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));

    // Filters animation - quick stagger
    filtersOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    filtersTranslateX.value = withDelay(150, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));

    // List animation - final stagger
    listOpacity.value = withDelay(200, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    listTranslateY.value = withDelay(200, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      { scale: headerScale.value },
      { translateY: headerTranslateY.value }
    ],
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ translateY: searchTranslateY.value }],
  }));

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    opacity: filtersOpacity.value,
    transform: [{ translateX: filtersTranslateX.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

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

  // Reset swipe states when component becomes visible
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
      }, 500); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [collectionsSearchQuery]);

  // FIX: estrai array corretto da data.data.recipes
  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      // Reset all swipe states when refreshing
      setResetTrigger(prev => prev + 1);

      const response = await fetch(`${API_URL}/api/recipe`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // FIX: controlla se data.data.recipes esiste (nuova struttura paginata)
      if (response.ok) {
        let fetchedRecipes: Recipe[] = [];

        if (data.data && Array.isArray(data.data.recipes)) {
          fetchedRecipes = data.data.recipes;
        } else if (Array.isArray(data.data)) {
          fetchedRecipes = data.data;
        }

        setRecipes(fetchedRecipes);

        // Preload dish photos for better UX
        const dishPhotoUrls = fetchedRecipes
          .filter(recipe => recipe.dishPhoto?.url)
          .map(recipe => recipe.dishPhoto!.url);

        if (dishPhotoUrls.length > 0) {
          // Preload images in background (don't await to avoid blocking UI)
          imageCacheService.preloadImages(dishPhotoUrls).catch(error => {
            console.warn('Failed to preload some images:', error);
          });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch recipes');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
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
        // If endpoint doesn't exist yet, show empty state instead of error
        if (response.status === 404) {
          console.log('Recipes endpoint not available yet');
          setPublicRecipes([]);
          setFilteredPublicRecipes([]);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Public recipes data:', data.data?.recipes || []);
      const recipes = data.data?.recipes || [];
      setPublicRecipes(recipes);
      setFilteredPublicRecipes(recipes);
    } catch (error) {
      console.error('Error fetching public recipes:', error);

      // Always show empty state for network errors, but log them
      console.log('Network error - showing empty state:', error instanceof Error ? error.message : String(error));
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#28A745';
      case 'medium':
        return '#FFC107';
      case 'hard':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
      console.error('Error deleting recipe:', error);
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
      <RecipeItem
        item={item}
        index={index}
        onPress={() => {
          const idx = filteredRecipes.findIndex(r => {
            const currentRecipeId = (r as any)._id || r.id;
            const itemId = (item as any)._id || item.id;
            return currentRecipeId === itemId;
          });
          onSelectRecipe(item, filteredRecipes, idx, false); // false = not public
        }}
        onDelete={() => handleDeleteRequest(item)}
        onPhotoPress={handlePhotoPress}
        resetTrigger={resetTrigger}
        t={t}
        formatDate={formatDate}
        getDifficultyColor={getDifficultyColor}
        isPublic={false}
      />
    );
  };

  const renderPublicRecipe = ({ item, index }: { item: Recipe; index: number }) => {
    return (
      <RecipeItem
        item={item}
        index={index}
        onPress={() => {
          onSelectRecipe(item, [item], 0, true); // true = is public
        }}
        onDelete={() => { }} // No delete action for public recipes
        onPhotoPress={handlePhotoPress}
        resetTrigger={resetTrigger}
        t={t}
        formatDate={formatDate}
        getDifficultyColor={getDifficultyColor}
        isPublic={true}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, headerAnimatedStyle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('recipes.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('recipes.subtitle')}</Text>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-recipes' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('my-recipes')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'my-recipes' ? colors.buttonText : colors.text }]}>
              {t('recipes.myRecipes')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'explore' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('explore')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'explore' ? colors.buttonText : colors.text }]}>
              {t('recipes.explore')}
            </Text>
          </TouchableOpacity>
        </View>
        <Animated.View style={[styles.searchBarContainer, searchAnimatedStyle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MappedIcon icon="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={activeTab === 'my-recipes' ? t('recipes.searchPlaceholder') : t('recipes.searchCollections')}
            value={activeTab === 'my-recipes' ? searchQuery : collectionsSearchQuery}
            onChangeText={activeTab === 'my-recipes' ? setSearchQuery : setCollectionsSearchQuery}
            placeholderTextColor={colors.textSecondary}
            textContentType="none"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Animated.View>
        {/* Filters for both tabs */}
        <Animated.View style={filtersAnimatedStyle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersScrollContent}>
            {/* Difficoltà */}
            <TouchableOpacity activeOpacity={0.7}
              style={[styles.filterBadge, {
                backgroundColor: !(activeTab === 'my-recipes' ? difficultyFilter : publicDifficultyFilter) ? colors.primary : colors.card,
                borderColor: !(activeTab === 'my-recipes' ? difficultyFilter : publicDifficultyFilter) ? colors.primary : 'transparent'
              }]}
              onPress={() => activeTab === 'my-recipes' ? setDifficultyFilter('') : setPublicDifficultyFilter('')}
            >
              <Text style={[styles.filterBadgeText, {
                color: !(activeTab === 'my-recipes' ? difficultyFilter : publicDifficultyFilter) ? colors.buttonText : colors.text
              }]}>{t('common.all')}</Text>
            </TouchableOpacity>
            {['easy', 'medium', 'hard'].map(diff => (
              <TouchableOpacity activeOpacity={0.7}
                key={diff}
                style={[styles.filterBadge, {
                  backgroundColor: (activeTab === 'my-recipes' ? difficultyFilter : publicDifficultyFilter) === diff ? colors.primary : colors.card,
                  borderColor: (activeTab === 'my-recipes' ? difficultyFilter : publicDifficultyFilter) === diff ? colors.primary : 'transparent'
                }]}
                onPress={() => activeTab === 'my-recipes' ? setDifficultyFilter(diff) : setPublicDifficultyFilter(diff)}
              >
                <Text style={[styles.filterBadgeText, {
                  color: (activeTab === 'my-recipes' ? difficultyFilter : publicDifficultyFilter) === diff ? colors.buttonText : colors.text
                }]}>{t(`recipes.difficulty.${diff}`)}</Text>
              </TouchableOpacity>
            ))}
            {/* Tag dietetici */}
            {dietaryTags.map(tag => (
              <TouchableOpacity activeOpacity={0.7}
                key={tag}
                style={[styles.filterBadge, {
                  backgroundColor: (activeTab === 'my-recipes' ? tagFilter : publicTagFilter) === tag ? colors.primary : colors.card,
                  borderColor: (activeTab === 'my-recipes' ? tagFilter : publicTagFilter) === tag ? colors.primary : 'transparent'
                }]}
                onPress={() => activeTab === 'my-recipes' ? setTagFilter(tag) : setPublicTagFilter(tag)}
              >
                <Text style={[styles.filterBadgeText, {
                  color: (activeTab === 'my-recipes' ? tagFilter : publicTagFilter) === tag ? colors.buttonText : colors.text
                }]}>{t(`recipes.dietary.${tag.replace('-', '')}`)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {activeTab === 'my-recipes' ? (
        filteredRecipes.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, listAnimatedStyle]}>
            <View style={{ marginBottom: 16 }}>
              <Ionicons name="restaurant-outline" size={64} color={colors.primary} />
            </View>
            {recipes.length === 0 ? (
              <>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('recipes.noRecipes')}</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('recipes.startCreating')}</Text>
                <TouchableOpacity activeOpacity={0.7} style={[styles.scanButton, { backgroundColor: colors.primary }]} onPress={onGoToCamera}>
                  <Text style={[styles.scanButtonText, { color: colors.buttonText }]}>{t('recipes.scanIngredients') || 'Scansiona Ingredienti'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? t('recipes.noResults') : t('recipes.noRecipes')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {searchQuery ? t('recipes.tryDifferentSearch') : t('recipes.startCreating')}
                </Text>
              </>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
            <FlatList
              data={filteredRecipes}
              renderItem={renderRecipe}
              keyExtractor={(item) => (item as any)._id || item.id}
              style={styles.recipesList}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={fetchRecipes}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={fetchRecipes}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          </Animated.View>
        )
      ) : (
        // Public Collections Tab
        collectionsLoading ? (
          <Animated.View style={[styles.emptyContainer, listAnimatedStyle]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('recipes.loadingCollections')}</Text>
          </Animated.View>
        ) : filteredPublicRecipes.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, listAnimatedStyle]}>
            <View style={{ marginBottom: 16 }}>
              <Ionicons name="restaurant-outline" size={64} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {collectionsSearchQuery || publicDifficultyFilter || publicTagFilter ? t('recipes.noResults') : t('recipes.noPublicRecipes')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {collectionsSearchQuery || publicDifficultyFilter || publicTagFilter ? t('recipes.tryDifferentSearch') : t('recipes.noPublicRecipesDesc')}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
            <FlatList
              data={filteredPublicRecipes}
              renderItem={({ item, index }) => renderPublicRecipe({ item, index })}
              keyExtractor={(item) => item._id}
              style={styles.recipesList}
              showsVerticalScrollIndicator={false}
              refreshing={collectionsLoading}
              onRefresh={fetchPublicRecipes}
              refreshControl={
                <RefreshControl
                  refreshing={collectionsLoading}
                  onRefresh={fetchPublicRecipes}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          </Animated.View>
        )
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F8F9FA', // rimosso, ora gestito dal tema
  },
  header: {
    padding: 20,
    paddingTop: 60,
    // backgroundColor: 'white', // rimosso, ora gestito dal tema
    borderBottomWidth: 1,
    // borderBottomColor: '#E9ECEF', // rimosso, ora gestito dal tema
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    // color: '#212529', // rimosso, ora gestito dal tema
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    // color: '#6B7280', // rimosso, ora gestito dal tema
    marginBottom: 10,
    textAlign: 'left',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#F8F9FA', // rimosso, ora gestito dal tema
    borderWidth: 1,
    // borderColor: '#DEE2E6', // rimosso, ora gestito dal tema
    borderRadius: 12,
    marginBottom: 14,
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    // color: '#212529', // rimosso, ora gestito dal tema
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgb(22, 163, 74)',
    fontWeight: '500',
  },
  recipesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  recipeCard: {
    // backgroundColor: 'white', // rimosso, ora gestito dal tema
    borderRadius: 12,
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    // color: '#212529', // rimosso, ora gestito dal tema
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    // color: 'white', // rimosso, ora gestito dal tema
    fontSize: 12,
    fontWeight: '600',
  },
  recipeDescription: {
    fontSize: 14,
    // color: '#6C757D', // rimosso, ora gestito dal tema
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeMetadata: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metadataItem: {
    marginRight: 16,
  },
  metadataLabel: {
    fontSize: 12,
    // color: '#495057', // rimosso, ora gestito dal tema
    fontWeight: '500',
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dietaryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  dietaryTagText: {
    // color: '#007AFF', // rimosso, ora gestito dal tema
    fontSize: 10,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 10,
    // color: '#6C757D', // rimosso, ora gestito dal tema
    alignSelf: 'center',
  },
  recipeDate: {
    fontSize: 11,
    // color: '#ADB5BD', // rimosso, ora gestito dal tema
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  // Dish Photo Styles
  dishPhotoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dishPhotoTouchable: {
    position: 'relative',
  },
  dishPhotoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
  },
  dishPhotoPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishPhotoOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cookedDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // color: '#495057', // rimosso, ora gestito dal tema
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    // color: '#6C757D', // rimosso, ora gestito dal tema
    textAlign: 'center',
    lineHeight: 20,
  },
  filtersScroll: {
    marginTop: 0,
    marginBottom: 8,
    maxHeight: 44,
  },
  filtersScrollContent: {
    alignItems: 'center',
    paddingRight: 10,
  },
  filterBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBadgeActive: {
    // backgroundColor e borderColor gestiti inline
  },
  filterBadgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadgeTextActive: {
    // color gestito inline
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#16A34A', // rimosso, ora gestito dal tema
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 28,
  },
  scanButtonText: {
    // color: 'white', // rimosso, ora gestito dal tema
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    flex: 0,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  swipeRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DC3545',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 100,
  },
  deleteText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  rowContent: {
    flex: 1,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Collection styles
  collectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  collectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  collectionMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  collectionMeta: {
    fontSize: 12,
  },
  collectionCreator: {
    fontSize: 12,
    fontWeight: '600',
  },
});