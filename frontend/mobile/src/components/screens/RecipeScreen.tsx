import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ShareModal } from '../modals/ShareModal';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';
import { ChatAIModal } from '../modals/ChatAIModal';
import { NotificationModal, NotificationType } from '../modals/NotificationModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { StarRating } from '../ui/StarRating';
import { PhotoUploadModal } from '../modals/PhotoUploadModal';
import { HapticService } from '../../services/hapticService';
import HapticTouchableOpacity from '../common/HapticTouchableOpacity';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';
import { uploadService } from '../../services/uploadService';

const { width: screenWidth } = Dimensions.get('window');

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
  stepTimers?: number[]; // Timer in minutes for each step
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  language: 'en' | 'it';
  isSaved?: boolean;
  _id?: string;
  dishPhoto?: string; // Cloudinary URL della foto del piatto (legacy)
  dishPhotos?: Array<{
    url: string;
    publicId: string;
  }>; // Array of dish photos
  cookedAt?: string; // Data e ora in cui è stato cucinato
  createdAt?: string; // Data e ora di creazione della ricetta
  nutrition?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  cookingTips?: Array<{
    step: number;
    tip: string;
    type: 'technique' | 'timing' | 'ingredient' | 'temperature' | 'safety';
  }>;
  // Creator info for public recipes
  userId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  };
  // Rating system
  averageRating?: number;
  totalRatings?: number;
  // Flag for saved public recipes
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
}

interface RecipeScreenProps {
  recipe: Recipe;
  onGoBack: () => void;
  onStartOver: () => void;
  onGoToSaved: () => void;
  onGoToRecipes: () => void;
  onStartCooking?: (recipe: Recipe) => void; // Navigate to cooking mode
  isJustGenerated?: boolean;
  recipes?: Recipe[]; // Array of all recipes for navigation
  currentIndex?: number; // Current recipe index
  onNavigateToRecipe?: (index: number) => void; // Navigate to specific recipe
  onRecipeUpdate?: (updatedRecipe: Recipe) => void; // Handle recipe updates
  isPublic?: boolean; // Flag to indicate if recipe is from public collection
}

export const RecipeScreen: React.FC<RecipeScreenProps> = ({
  recipe: initialRecipe,
  onGoBack,
  onStartOver,
  onGoToSaved,
  onGoToRecipes,
  onStartCooking,
  isJustGenerated = false,
  recipes = [],
  currentIndex = 0,
  onNavigateToRecipe,
  onRecipeUpdate,
  isPublic = false,
}) => {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  const [recipe, setRecipe] = useState(initialRecipe);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  const [showChatAIModal, setShowChatAIModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [photoViewIndex, setPhotoViewIndex] = useState(0);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: NotificationType;
    title: string;
    message: string;
  }>({ visible: false, type: 'success', title: '', message: '' });
  const [usersWhoCookedRecipe, setUsersWhoCookedRecipe] = useState<any[]>([]);
  const [loadingCookedByUsers, setLoadingCookedByUsers] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerTranslateY = useSharedValue(-30);

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);

  const nutritionOpacity = useSharedValue(0);
  const nutritionTranslateY = useSharedValue(30);

  const ingredientsOpacity = useSharedValue(0);
  const ingredientsTranslateY = useSharedValue(40);

  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(50);

  // Entrance animations
  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    headerTranslateY.value = withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) });

    // Title animation
    titleOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    titleTranslateY.value = withDelay(150, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));

    // Content animation
    contentOpacity.value = withDelay(300, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    contentTranslateY.value = withDelay(300, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));

    // Nutrition animation
    nutritionOpacity.value = withDelay(375, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    nutritionTranslateY.value = withDelay(375, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));

    // Ingredients animation
    ingredientsOpacity.value = withDelay(450, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    ingredientsTranslateY.value = withDelay(450, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));

    // Buttons animation
    buttonsOpacity.value = withDelay(525, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    buttonsTranslateY.value = withDelay(525, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
  }, [recipe.id]); // Re-animate when recipe changes

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      { scale: headerScale.value },
      { translateY: headerTranslateY.value }
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const nutritionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nutritionOpacity.value,
    transform: [{ translateY: nutritionTranslateY.value }],
  }));

  const ingredientsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ingredientsOpacity.value,
    transform: [{ translateY: ingredientsTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // Sync internal recipe state when initial recipe changes
  React.useEffect(() => {
    console.log('🔄 Recipe state sync:', initialRecipe);
    setRecipe(initialRecipe);
  }, [initialRecipe]);

  // Debug log for recipe state changes
  React.useEffect(() => {
    console.log('📊 Current recipe state:', {
      id: recipe.id || recipe._id,
      photosCount: recipe.dishPhotos?.length || 0,
      photos: recipe.dishPhotos,
      forceUpdateCounter
    });
  }, [recipe, forceUpdateCounter]);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const recipeId = recipe.id || recipe._id;

      if (!recipeId) {
        throw new Error('Recipe ID not found');
      }

      // Fetch updated recipe data from backend
      const response = await fetch(`${API_URL}/api/recipe/${recipeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedRecipeData = await response.json();
        const updatedRecipe = updatedRecipeData.data;

        // Update both internal state and parent state
        setRecipe(updatedRecipe);
        if (onRecipeUpdate) {
          onRecipeUpdate(updatedRecipe);
        }
      } else {
        throw new Error('Failed to refresh recipe data');
      }
    } catch (error) {
      console.log('Error refreshing recipe:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('common.refreshError') || 'Failed to refresh recipe data',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Swipe gestures for navigation
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const { dx, dy } = gestureState;
      const { locationX } = evt.nativeEvent;

      // Respond to horizontal swipes
      return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Optional: Add visual feedback during swipe
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      const { locationX } = evt.nativeEvent;

      // Swipe from left edge to go back
      if (locationX < 50 && dx > 100) {
        // If recipe was just generated but now has an ID, it means it was saved
        // In this case, go to recipes page instead of back to ingredient selection
        if (isJustGenerated && (recipe.id || recipe._id)) {
          onGoToRecipes();
        } else {
          onGoBack();
        }
        return;
      }

      // Recipe navigation (only if we have recipes and navigation function)
      if (recipes.length > 1 && onNavigateToRecipe) {
        if (dx > 100) {
          // Swipe right - go to previous recipe
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : recipes.length - 1;
          onNavigateToRecipe(prevIndex);
        } else if (dx < -100) {
          // Swipe left - go to next recipe
          const nextIndex = currentIndex < recipes.length - 1 ? currentIndex + 1 : 0;
          onNavigateToRecipe(nextIndex);
        }
      }
    },
  });

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


  const handleStartCooking = async () => {
    try {
      const recipeId = recipe.id || recipe._id;

      console.log('🎯 handleStartCooking called');
      console.log('🎯 isJustGenerated:', isJustGenerated);
      console.log('🎯 recipeId:', recipeId);
      console.log('🎯 recipe:', recipe);

      // If recipe is just generated (temporary), save it first and show normal recipe view
      if (isJustGenerated && !recipeId) {
        console.log('🎯 Saving temporary recipe...');

        // Save recipe to database and add to user's collection
        const saveResponse = await fetch(`${API_URL}/api/recipe/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipe),
        });

        console.log('🎯 Save response status:', saveResponse.status);

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.log('🎯 Save response error:', errorText);
          throw new Error('Failed to save recipe to database');
        }

        const savedRecipe = await saveResponse.json();
        console.log('🎯 Saved recipe:', savedRecipe);

        // MongoDB returns _id, but we need to handle both id and _id
        const recipeId = savedRecipe.data._id || savedRecipe.data.id;
        console.log('🎯 Recipe ID from backend:', recipeId);

        const updatedRecipe = {
          ...recipe,
          id: recipeId,
          _id: recipeId,
          isSaved: false // Not in collection yet - will be saved when cooking is finished
        };

        console.log('🎯 Updated recipe:', updatedRecipe);

        // Update recipe with saved data and show normal recipe view
        HapticService.itemSaved();
        if (onRecipeUpdate) {
          console.log('🎯 Calling onRecipeUpdate...');
          onRecipeUpdate(updatedRecipe);
        } else {
          console.log('🎯 No onRecipeUpdate callback available');
        }

        // This will re-render the component with the saved recipe (no longer isJustGenerated)
        return;
      }

      console.log('🎯 Recipe already saved, going to cooking mode');

      // For saved recipes, go directly to cooking mode
      if (onStartCooking) {
        HapticService.recipeCompleted();
        onStartCooking(recipe);
      } else {
        HapticService.itemSaved();
        // Fallback: just go back
        onGoBack();
      }
    } catch (error) {
      console.log('Error starting cooking:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipe.cookingError'),
      });
    }
  };

  // Sostituisci la chiamata Alert.alert per la deleteRecipe con apertura modale
  const deleteRecipe = () => {
    setShowDeleteModal(true);
  };

  // Funzione che esegue la cancellazione vera e propria
  const confirmDeleteRecipe = async () => {
    setShowDeleteModal(false);
    try {
      const recipeId = (recipe as any).id || (recipe as any)._id;
      if (!recipeId) {
        setNotification({
          visible: true,
          type: 'success',
          title: t('common.success'),
          message: t('recipe.deleteSuccess'),
        });
        setTimeout(() => onGoBack(), 1300);
        return;
      }
      if ((recipe as any).isSaved) {
        const unsaveResponse = await fetch(`${API_URL}/api/recipe/saved/${recipeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (unsaveResponse.ok) {
          setNotification({
            visible: true,
            type: 'success',
            title: t('common.success'),
            message: t('recipe.deleteSuccess'),
          });
          setTimeout(() => onGoBack(), 1300);
        } else {
          throw new Error('Failed to unsave recipe');
        }
      } else {
        const deleteResponse = await fetch(`${API_URL}/api/recipe/${recipeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (deleteResponse.ok) {
          setNotification({
            visible: true,
            type: 'success',
            title: t('common.success'),
            message: t('recipe.deleteSuccess'),
          });
          setTimeout(() => onGoBack(), 1300);
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
    }
  };

  const renderIngredient = (ingredient: any, index: number) => (
    <View
      key={index}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow || '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.primary,
          width: 80,
          marginRight: 10,
        }}
      >
        {ingredient.amount} {ingredient.unit}
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: colors.text,
          flex: 1,
          fontWeight: '500',
        }}
      >
        {ingredient.name}
      </Text>
    </View>
  );

  // Photo upload handlers
  const handleAddPhoto = () => {
    setShowPhotoUpload(true);
  };

  const handlePhotoSelected = async (imageUri: string) => {
    try {
      setIsUploadingPhoto(true);
      setShowPhotoUpload(false);

      const recipeId = recipe.id || recipe._id;
      if (!recipeId) {
        throw new Error('Recipe ID not found');
      }

      // Check if we already have 3 photos
      if (recipe.dishPhotos && recipe.dishPhotos.length >= 3) {
        Alert.alert(
          t('common.error'),
          'Maximum 3 photos allowed per recipe',
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Upload photo (this already updates the recipe in the backend)
      const result = await uploadService.uploadDishPhoto(imageUri, recipeId);

      console.log('📸 Photo upload result:', result);

      // Fetch updated recipe data from backend to get the latest state
      const updatedRecipeResponse = await fetch(`${API_URL}/api/recipe/${recipeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (updatedRecipeResponse.ok) {
        const updatedRecipeData = await updatedRecipeResponse.json();
        const updatedRecipe = updatedRecipeData.data;

        console.log('🔄 Updated recipe data:', updatedRecipe);

        // Update both internal state and parent state
        setRecipe(updatedRecipe);
        if (onRecipeUpdate) {
          onRecipeUpdate(updatedRecipe);
        }

        // Force component re-render and update photo index
        setForceUpdateCounter(prev => prev + 1);
        setCurrentPhotoIndex(0); // Reset to first photo
      } else {
        console.log('❌ Failed to fetch updated recipe data');

        // Fallback: add the new photo to local state manually
        const newPhoto = {
          url: result.url,
          publicId: result.publicId || ''
        };

        const updatedRecipe = {
          ...recipe,
          dishPhotos: [...(recipe.dishPhotos || []), newPhoto],
          cookedAt: recipe.cookedAt || new Date().toISOString(),
        };

        console.log('🔧 Fallback updated recipe:', updatedRecipe);

        setRecipe(updatedRecipe);
        if (onRecipeUpdate) {
          onRecipeUpdate(updatedRecipe);
        }

        // Force component re-render and update photo index
        setForceUpdateCounter(prev => prev + 1);
        setCurrentPhotoIndex(0); // Reset to first photo
      }

      setNotification({
        visible: true,
        type: 'success',
        title: t('common.success'),
        message: t('recipes.addPhoto') + ' ' + t('common.success').toLowerCase(),
      });
    } catch (error) {
      console.log('Error uploading photo:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('cookingMode.photoUploadFailed'),
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSkipPhoto = () => {
    setShowPhotoUpload(false);
  };

  const handleViewPhoto = (photoUrl?: string, photoIndex?: number) => {
    if (recipe.dishPhotos && recipe.dishPhotos.length > 0) {
      setPhotoViewIndex(photoIndex || 0);
      setShowImageViewer(true);
    }
  };

  const handleSharePhoto = async () => {
    if (!recipe.dishPhotos?.length) return;

    try {
      const { Share } = await import('react-native');
      await Share.share({
        url: recipe.dishPhotos[0].url,
        message: `${t('recipes.dishPhoto')} - ${recipe.title}`,
      });
    } catch (error) {
      console.log('Error sharing photo:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('common.shareError'),
      });
    }
  };

  const handleDeletePhotoConfirmation = (photoIndex: number) => {
    setPhotoToDelete(photoIndex);
    setShowDeletePhotoModal(true);
  };

  const confirmDeletePhoto = async () => {
    if (photoToDelete === null) return;

    try {
      const recipeId = recipe.id || recipe._id;
      if (!recipeId) {
        throw new Error('Recipe ID not found');
      }

      const photoData = recipe.dishPhotos?.[photoToDelete];
      if (!photoData) {
        throw new Error('Photo not found');
      }

      console.log('🗑️ Deleting photo:', photoData);

      // Call backend to delete the photo
      const response = await fetch(`${API_URL}/api/recipe/${recipeId}/photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicId: photoData.publicId,
          photoIndex: photoToDelete
        }),
      });

      if (response.ok) {
        // Update local state by removing the photo
        const updatedPhotos = (recipe.dishPhotos || []).filter((_, index) => index !== photoToDelete);
        const updatedRecipe = {
          ...recipe,
          dishPhotos: updatedPhotos,
        };

        console.log('✅ Photo deleted successfully');

        setRecipe(updatedRecipe);
        if (onRecipeUpdate) {
          onRecipeUpdate(updatedRecipe);
        }

        // Adjust current photo index if necessary
        if (currentPhotoIndex >= updatedPhotos.length && updatedPhotos.length > 0) {
          setCurrentPhotoIndex(updatedPhotos.length - 1);
        } else if (updatedPhotos.length === 0) {
          setCurrentPhotoIndex(0);
        }

        setForceUpdateCounter(prev => prev + 1);

        setNotification({
          visible: true,
          type: 'success',
          title: t('common.success'),
          message: t('recipes.photoDeleted') || 'Photo deleted successfully',
        });
      } else {
        throw new Error('Failed to delete photo');
      }
    } catch (error) {
      console.log('Error deleting photo:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipes.photoDeleteError') || 'Failed to delete photo',
      });
    } finally {
      setShowDeletePhotoModal(false);
      setPhotoToDelete(null);
    }
  };

  // Auto-close notification after 1.3s
  useEffect(() => {
    if (notification.visible) {
      const timeout = setTimeout(() => {
        setNotification(n => ({ ...n, visible: false }));
      }, 1300);
      return () => clearTimeout(timeout);
    }
  }, [notification.visible]);

  // Load users who cooked this recipe (for public recipes and saved public recipes)
  const fetchUsersWhoCookedRecipe = async () => {
    if ((!isPublic && !recipe.isPublicRecipe) || !recipe._id) return;

    try {
      setLoadingCookedByUsers(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/recipe/${recipe._id}/cooked-by?limit=8`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsersWhoCookedRecipe(data.data.users || []);
        }
      }
    } catch (error) {
      console.log('Error fetching users who cooked recipe:', error);
    } finally {
      setLoadingCookedByUsers(false);
    }
  };

  useEffect(() => {
    if (isPublic || recipe.isPublicRecipe) {
      fetchUsersWhoCookedRecipe();
    }
  }, [isPublic, recipe.isPublicRecipe, recipe._id]);

  return (
    <View
      key={`recipe-${recipe.id || recipe._id}-${forceUpdateCounter}`}
      style={[
        styles.container,
        {
          backgroundColor: colors.background
        }
      ]}
      pointerEvents='auto'
      {...panResponder.panHandlers}>
      <Animated.View style={[styles.header, headerAnimatedStyle, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          // If recipe was just generated but now has an ID, it means it was saved
          // In this case, go to recipes page instead of back to ingredient selection
          if (isJustGenerated && (recipe.id || recipe._id)) {
            onGoToRecipes();
          } else {
            onGoBack();
          }
        }}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{t('recipe.title')}</Text>
          {recipes.length > 1 && (
            <Text style={[styles.recipeCounter, { color: colors.textSecondary }]}>
              {currentIndex + 1} / {recipes.length}
            </Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={() => handleShare()}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View style={[styles.recipeHeader, titleAnimatedStyle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* Dish Photos Section */}
          {(
            isPublic
              ? (recipe.dishPhotos && recipe.dishPhotos.length > 0) // Per ricette pubbliche: mostra solo se ha foto
              : (recipe.cookedAt || (recipe.dishPhotos && recipe.dishPhotos.length > 0)) // Per ricette personali: come prima
          ) && (
              <View
                key={`photos-section-${recipe.dishPhotos?.length || 0}-${forceUpdateCounter}`}
                style={[styles.section, { backgroundColor: 'transparent', marginBottom: 8, paddingTop: 0 }]}
              >
                {(recipe.dishPhotos?.length || 0) > 0 ? (
                  <View style={styles.photoSliderContainer}>
                    {/* Photo Slider */}
                    <ScrollView
                      horizontal
                      pagingEnabled={false}
                      showsHorizontalScrollIndicator={false}
                      style={styles.photoSlider}
                      onScroll={(event) => {
                        const slideWidth = Dimensions.get('window').width - 32; // Considera solo il padding del container interno
                        const slideIndex = Math.round(
                          event.nativeEvent.contentOffset.x / slideWidth
                        );
                        setCurrentPhotoIndex(slideIndex);
                      }}
                      scrollEventThrottle={16}
                      decelerationRate="fast"
                      snapToInterval={Dimensions.get('window').width - 32}
                      snapToAlignment="start"
                      bounces={false}
                    >
                      {(recipe.dishPhotos || []).map((photo, index) => (
                        <View key={`${photo.url}-${index}`} style={styles.photoSlide}>
                          <View style={styles.photoSlideWrapper}>
                            <TouchableOpacity
                              onPress={() => isPublic ? handleViewPhoto(photo.url, index) : null}
                              activeOpacity={isPublic ? 0.8 : 1}
                              style={{ flex: 1 }}
                            >
                              <Image
                                source={{ uri: photo.url }}
                                style={[styles.photoSlideImage, { borderColor: colors.border }]}
                                contentFit="cover"
                                transition={500}
                                cachePolicy="memory-disk"
                                placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
                                testID={`dish-photo-image-${index}`}
                              />
                            </TouchableOpacity>
                            {/* View Photo Overlay */}
                            <TouchableOpacity
                              style={[styles.photoViewOverlay, { backgroundColor: colors.overlay }]}
                              onPress={() => handleViewPhoto(photo.url, index)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="expand-outline" size={18} color="white" />
                            </TouchableOpacity>

                            {/* Delete Photo Overlay */}
                            {!isPublic && !recipe.isPublicRecipe && (
                              <TouchableOpacity
                                style={[styles.photoDeleteOverlay, { backgroundColor: colors.error }]}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhotoConfirmation(index);
                                }}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="trash-outline" size={16} color="white" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      ))}

                      {/* Add Photo Slide */}
                      {!isPublic && !recipe.isPublicRecipe && (recipe.dishPhotos?.length || 0) < 3 && (
                        <View style={styles.photoSlide}>
                          <TouchableOpacity
                            style={styles.addPhotoSlide}
                            onPress={handleAddPhoto}
                            disabled={isUploadingPhoto}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.addPhotoSlideContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                              {isUploadingPhoto ? (
                                <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
                              ) : (
                                <>
                                  <Ionicons name="add-outline" size={40} color={colors.primary} />
                                  <Text style={[styles.addPhotoSlideText, { color: colors.primary }]}>
                                    {t('recipes.addPhoto')}
                                  </Text>
                                </>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}
                    </ScrollView>

                    {/* Page Indicators */}
                    {((recipe.dishPhotos?.length || 0) > 1 || (!isPublic && (recipe.dishPhotos?.length || 0) < 3)) && (
                      <View style={styles.photoIndicators}>
                        {Array.from({ length: (recipe.dishPhotos?.length || 0) + (!isPublic && (recipe.dishPhotos?.length || 0) < 3 ? 1 : 0) }).map((_, index) => (
                          <View
                            key={index}
                            style={[
                              styles.photoIndicator,
                              {
                                backgroundColor: index === currentPhotoIndex ? colors.primary : colors.border,
                                opacity: index === currentPhotoIndex ? 1 : 0.3
                              }
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ) : recipe.cookedAt && !recipe.isPublicRecipe && (
                  <TouchableOpacity
                    style={styles.noPhotoContainer}
                    onPress={handleAddPhoto}
                    disabled={isUploadingPhoto}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.noPhotoPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {isUploadingPhoto ? (
                        <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={48} color={colors.primary} />
                          <Text style={[styles.noPhotoText, { color: colors.primary }]}>
                            {t('recipes.addPhoto')}
                          </Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

          {/* Rating stars above title - Only for public recipes */}
          {isPublic && (
            <View style={styles.titleRatingContainer}>
              <StarRating
                rating={recipe.averageRating || 0}
                size={20}
                color="#FFD700"
                emptyColor="#E5E5E5"
              />
              <Text style={[styles.titleRatingText, { color: colors.textSecondary }]}>
                ({recipe.totalRatings || 0})
              </Text>
            </View>
          )}

          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.recipeTitle, { color: colors.text }]}>{recipe.title}</Text>
            {/* Badge per ricette pubbliche salvate */}
            {recipe.isPublicRecipe && !isPublic && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginTop: 8,
                alignSelf: 'flex-start'
              }}>
                <Text style={{ fontSize: 12, marginRight: 6 }}>🌟</Text>
                <Text style={{ fontSize: 13, color: 'white', fontWeight: '600' }}>
                  {t('saved.publicRecipe')}
                </Text>
                {recipe.originalCreator?.name && (
                  <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', marginLeft: 6 }}>
                    • {recipe.originalCreator.name}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Dietary Tags under title */}
          {(recipe.dietaryTags && recipe.dietaryTags.length > 0) && (
            <View style={styles.dietaryTags}>
              {(recipe.dietaryTags || []).map((tag) => (
                <View key={tag} style={[styles.dietaryTag, { backgroundColor: colors.card }]}>
                  <Text style={[styles.dietaryTagText, { color: colors.primary }]}>
                    {t(`recipes.dietary.${tag.replace('-', '')}`)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.recipeDescription, { color: colors.textSecondary }]}>{recipe.description}</Text>

          {/* AI-Generated Content Disclaimer */}
          <View style={[styles.aiDisclaimer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.aiDisclaimerHeader}>
              <Ionicons name="sparkles-outline" size={16} color={colors.primary} style={styles.aiIcon} />
              <Text style={[styles.aiDisclaimerTitle, { color: colors.primary }]}>{t('recipe.aiGenerated')}</Text>
            </View>
            <Text style={[styles.aiDisclaimerText, { color: colors.textSecondary }]}>{t('recipe.aiDisclaimerText')}</Text>
          </View>

          {/* Recipe Creator Card - For public recipes and saved public recipes */}
          {(isPublic || recipe.isPublicRecipe) && (recipe.userId || recipe.originalCreator) && (
            <View style={[styles.cookedByUserCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
              {(() => {
                // Use originalCreator if available (for saved public recipes), otherwise use userId
                const creator = recipe.originalCreator || recipe.userId;
                if (!creator) return null;

                return (
                  <>
                    <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                      {creator.avatar?.url ? (
                        <Image
                          source={{ uri: creator.avatar.url }}
                          style={styles.userAvatarImage}
                          contentFit="cover"
                          transition={300}
                          cachePolicy="memory-disk"
                          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                        />
                      ) : (
                        <Text style={[styles.userAvatarText, { color: colors.buttonText }]}>
                          {creator.name?.charAt(0).toUpperCase() || 'C'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={[styles.creatorLabel, { color: colors.textSecondary }]}>
                        {t('recipe.createdBy')}
                      </Text>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {creator.name || 'Chef'}
                        {user && creator._id === user.id && (
                          <Text style={[styles.youLabel, { color: colors.primary }]}> ({t('common.you')})</Text>
                        )}
                      </Text>
                    </View>
                    <Text style={[styles.cookedDate, { color: colors.textSecondary }]}>
                      {new Date(recipe.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </>
                );
              })()}
            </View>
          )}

          {/* Indicatore "Già cucinato" con foto */}
          {recipe.cookedAt && (
            <View style={[styles.cookedIndicator, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
              <View style={styles.cookedIndicatorHeader}>
                <View style={styles.cookedIndicatorInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.cookedIndicatorEmoji}>👨‍🍳</Text>
                    <Text style={[styles.cookedIndicatorTitle, { color: 'white' }]}>{t('recipe.alreadyCooked')}</Text>
                  </View>
                  <Text style={[styles.cookedIndicatorDate, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                    {new Date(recipe.cookedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>


        <Animated.View style={[styles.recipeMetadata, contentAnimatedStyle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>{t('recipe.cookingTime')}</Text>
            <Text style={[styles.metadataValue, { color: colors.text }]}>{recipe.cookingTime} min</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>{t('recipe.servings')}</Text>
            <Text style={[styles.metadataValue, { color: colors.text }]}>{recipe.servings}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>{t('recipe.difficultyLabel')}</Text>
            <Text style={[styles.metadataValue, { color: getDifficultyColor(recipe.difficulty) }]}>
              {t(`recipe.difficulty.${recipe.difficulty}`)}
            </Text>
          </View>
        </Animated.View>


        {/* Nutrition Information Section - Moved before ingredients */}
        {recipe.nutrition && (
          <Animated.View style={[styles.section, nutritionAnimatedStyle, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recipe.nutrition')}</Text>
            <View style={[styles.nutritionContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.primary }]}>{recipe.nutrition.calories}</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>{t('nutrition.calories')}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.success }]}>{recipe.nutrition.protein}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>{t('nutrition.protein')}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.warning }]}>{recipe.nutrition.carbohydrates}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>{t('nutrition.carbs')}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.error }]}>{recipe.nutrition.fat}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>{t('nutrition.fat')}</Text>
                </View>
              </View>
              <View style={styles.nutritionSecondaryGrid}>
                <View style={styles.nutritionSecondaryItem}>
                  <Text style={[styles.nutritionSecondaryValue, { color: colors.text }]}>{recipe.nutrition.fiber}g</Text>
                  <Text style={[styles.nutritionSecondaryLabel, { color: colors.textSecondary }]}>{t('nutrition.fiber')}</Text>
                </View>
                <View style={styles.nutritionSecondaryItem}>
                  <Text style={[styles.nutritionSecondaryValue, { color: colors.text }]}>{recipe.nutrition.sugar}g</Text>
                  <Text style={[styles.nutritionSecondaryLabel, { color: colors.textSecondary }]}>{t('nutrition.sugar')}</Text>
                </View>
                <View style={styles.nutritionSecondaryItem}>
                  <Text style={[styles.nutritionSecondaryValue, { color: colors.text }]}>{recipe.nutrition.sodium}mg</Text>
                  <Text style={[styles.nutritionSecondaryLabel, { color: colors.textSecondary }]}>{t('nutrition.sodium')}</Text>
                </View>
              </View>
              <Text style={[styles.nutritionNote, { color: colors.textSecondary }]}>
                {t('nutrition.perServing', { servings: recipe.servings })}
              </Text>
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.section, ingredientsAnimatedStyle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recipe.ingredients')}</Text>
          <View style={styles.ingredientsList}>
            {(recipe.ingredients || []).map(renderIngredient)}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recipe.instructions')}</Text>
          <View style={[styles.instructionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(recipe.instructions || []).map((instruction, index) => (
              <View key={index}>
                <View style={styles.instructionStep}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.stepNumberText, { color: colors.buttonText }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepText, { color: colors.text }]}>
                      {instruction.replace(/(\d+\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?))/gi, (match) => `⏱️ ${match}`)}
                    </Text>
                  </View>
                </View>
                {index < recipe.instructions.length - 1 && (
                  <View style={[styles.stepSeparator, { borderColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Dish Photo Section - MOVED TO TOP */}
        {false && (recipe.cookedAt || recipe.dishPhoto) && (
          <Animated.View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recipes.dishPhoto')}</Text>

            {recipe.dishPhoto ? (
              <View style={styles.dishPhotoContainer}>
                <TouchableOpacity
                  style={styles.dishPhotoWrapper}
                  onPress={() => handleViewPhoto()}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: recipe.dishPhoto }}
                    style={[styles.dishPhotoLarge, { borderColor: colors.border }]}
                    contentFit="cover"
                    testID="dish-photo-image"
                  />
                  <View style={[styles.photoOverlay, { backgroundColor: colors.overlay }]}>
                    <Ionicons name="expand-outline" size={24} color="white" />
                  </View>
                </TouchableOpacity>

                <View style={styles.dishPhotoActions}>
                  <TouchableOpacity
                    style={[styles.photoActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleViewPhoto()}
                  >
                    <Ionicons name="eye-outline" size={16} color={colors.primary} />
                    <Text style={[styles.photoActionText, { color: colors.primary }]}>
                      {t('common.view') || 'View'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.photoActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={handleSharePhoto}
                  >
                    <Ionicons name="share-outline" size={16} color={colors.primary} />
                    <Text style={[styles.photoActionText, { color: colors.primary }]}>
                      {t('common.share')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : recipe.cookedAt && (
              <View style={styles.noPhotoContainer}>
                <View style={[styles.noPhotoPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.noPhotoText, { color: colors.textSecondary }]}>
                    {t('recipes.noPhoto') || 'No photo added'}
                  </Text>
                </View>

                {!isPublic && !recipe.isPublicRecipe && (
                  <TouchableOpacity
                    style={[styles.addPhotoButton, { backgroundColor: colors.primary }]}
                    onPress={handleAddPhoto}
                    disabled={isUploadingPhoto}
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="small" color={colors.buttonText} testID="loading-indicator" />
                    ) : (
                      <>
                        <Ionicons name="add-outline" size={20} color={colors.buttonText} />
                        <Text style={[styles.addPhotoText, { color: colors.buttonText }]}>
                          {t('recipes.addPhoto')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Users Who Cooked This Recipe Section - For public recipes and saved public recipes */}
        {(isPublic || recipe.isPublicRecipe) && usersWhoCookedRecipe.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('recipe.whoCookedThis') || 'Chi ha cucinato questa ricetta'}
            </Text>
            <View style={styles.cookedByUsersContainer}>
              {usersWhoCookedRecipe.map((userCooking, index) => (
                <View key={userCooking.user._id} style={[styles.cookedByUserCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                    {userCooking.user.avatar?.url ? (
                      <Image
                        source={{ uri: userCooking.user.avatar.url }}
                        style={styles.userAvatarImage}
                        contentFit="cover"
                        transition={300}
                        cachePolicy="memory-disk"
                        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                      />
                    ) : (
                      <Text style={[styles.userAvatarText, { color: colors.buttonText }]}>
                        {userCooking.user.name?.charAt(0).toUpperCase() || 'Chef'?.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {userCooking.user.name || 'Chef'}
                      {(() => {
                        const isCurrentUser = user && userCooking.user._id === user.id;
                        console.log('User comparison:', {
                          currentUserId: user?.id,
                          cookingUserId: userCooking.user._id,
                          isCurrentUser
                        });
                        return isCurrentUser;
                      })() && (
                          <Text style={[styles.youLabel, { color: colors.primary }]}> ({t('common.you')})</Text>
                        )}
                    </Text>
                    {userCooking.cookedAt && (
                      <Text style={[styles.cookedDate, { color: colors.textSecondary }]}>
                        {new Date(userCooking.cookedAt).toLocaleDateString()}
                      </Text>
                    )}
                    {(() => {
                      console.log('Rating check:', {
                        hasRating: !!userCooking.rating,
                        rating: userCooking.rating,
                        userCooking
                      });
                      return userCooking.rating;
                    })() && (
                        <View style={styles.userRatingContainer}>
                          <StarRating
                            rating={userCooking.rating}
                            size={14}
                            color="#FFD700"
                            emptyColor="#E5E5E5"
                          />
                          <Text style={[styles.userRatingText, { color: colors.textSecondary }]}>
                            ({userCooking.rating}/5)
                          </Text>
                        </View>
                      )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {!isPublic && (
          <View style={[styles.deleteSection, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: recipe.isPublicRecipe ? colors.warning : colors.error }]}
              onPress={() => setShowDeleteModal(true)}
            >
              <Ionicons
                name={recipe.isPublicRecipe ? "bookmark-outline" : "trash-outline"}
                size={20}
                color="white"
                style={styles.deleteIcon}
              />
              <Text style={styles.deleteButtonText}>
                {recipe.isPublicRecipe ? t('saved.removeFromSaved') : t('recipe.deleteRecipe')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <Animated.View style={[styles.footer, buttonsAnimatedStyle, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {isJustGenerated ? (
          <View style={styles.dualButtonContainer}>
            <HapticTouchableOpacity hapticType="medium" style={[styles.startOverButton, { backgroundColor: colors.textSecondary }]} onPress={onStartOver}>
              <Text style={[styles.startOverButtonText, { color: colors.buttonText }]}>{t('common.startOver')}</Text>
            </HapticTouchableOpacity>
            <HapticTouchableOpacity hapticType="primary" style={[styles.startCookingButton, { backgroundColor: colors.primary }]} onPress={handleStartCooking}>
              <Text style={[styles.startCookingButtonText, { color: colors.buttonText }]}>{t('recipe.saveRecipe')}</Text>
            </HapticTouchableOpacity>
          </View>
        ) : recipe.isSaved === true ? (
          <View style={styles.dualButtonContainer}>
            <TouchableOpacity style={[styles.startCookingButton, { backgroundColor: colors.primary }]} onPress={handleStartCooking}>
              <Text style={[styles.startCookingButtonText, { color: colors.buttonText }]}>
                {(recipe.cookedAt || recipe.isPublicRecipe) ? t('recipe.cookAgain') : t('recipe.startCooking')}
              </Text>
            </TouchableOpacity>
            {!isPublic && !recipe.isPublicRecipe && (
              <TouchableOpacity style={[styles.aiEditButton, { backgroundColor: colors.card }]} onPress={() => setShowChatAIModal(true)}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} style={styles.deleteIcon} />
                <Text style={[styles.aiEditButtonText, { color: colors.primary }]}>{t('common.edit') || 'Modifica'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.dualButtonContainer}>
            <TouchableOpacity style={[styles.startCookingButton, { backgroundColor: colors.primary }]} onPress={handleStartCooking}>
              <Text style={[styles.startCookingButtonText, { color: colors.buttonText }]}>
                {(recipe.cookedAt || recipe.isPublicRecipe) ? t('recipe.cookAgain') : t('recipe.startCooking')}
              </Text>
            </TouchableOpacity>
            {!isPublic && !recipe.isPublicRecipe && (
              <TouchableOpacity style={[styles.aiEditButton, { backgroundColor: colors.card }]} onPress={() => setShowChatAIModal(true)}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} style={styles.deleteIcon} />
                <Text style={[styles.aiEditButtonText, { color: colors.primary }]}>{t('common.edit') || 'Modifica'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
      <ShareModal
        visible={showShareModal}
        recipe={recipe}
        onClose={() => setShowShareModal(false)}
      />
      {!isPublic && (
        <DeleteConfirmationModal
          visible={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteRecipe}
        />
      )}
      {!isPublic && (
        <DeleteConfirmationModal
          visible={showDeletePhotoModal}
          onCancel={() => {
            setShowDeletePhotoModal(false);
            setPhotoToDelete(null);
          }}
          onConfirm={confirmDeletePhoto}
          title={t('common.delete')}
          message={t('recipes.photoDeleteConfirm') || 'Are you sure you want to delete this photo?'}
        />
      )}
      {!isPublic && (
        <ChatAIModal
          visible={showChatAIModal}
          recipe={recipe}
          onClose={() => setShowChatAIModal(false)}
          onRecipeUpdate={onRecipeUpdate}
        />
      )}
      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(n => ({ ...n, visible: false }))}
      />
      <ImageViewerModal
        visible={showImageViewer}
        imageUrls={(recipe.dishPhotos || []).map(photo => photo.url)}
        initialIndex={photoViewIndex}
        title={recipe.title}
        onClose={() => setShowImageViewer(false)}
      />
      {!isPublic && (
        <PhotoUploadModal
          visible={showPhotoUpload}
          onClose={handleSkipPhoto}
          onPhotoSelected={handlePhotoSelected}
          onSkip={handleSkipPhoto}
          recipeId={recipe.id || recipe._id}
          showSkipButton={false}
          onUploadComplete={(result) => {
            // Update recipe with photo URL
            const updatedRecipe = {
              ...recipe,
              dishPhotos: [...(recipe.dishPhotos || []), {
                url: result.url,
                publicId: result.publicId || ''
              }],
              cookedAt: recipe.cookedAt || new Date().toISOString(),
            };
            if (onRecipeUpdate) {
              onRecipeUpdate(updatedRecipe);
            }
          }}
        />
      )}
    </View>
  );
};

const getStyles = (colors: any, insets: { top: number; bottom: number }) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: insets.top + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(22, 163, 74)',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  recipeCounter: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 10,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  recipeHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  titleRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  titleRatingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recipeDescription: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
    marginBottom: 16,
  },
  aiDisclaimer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  aiDisclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiIcon: {
    marginRight: 6,
  },
  aiDisclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiDisclaimerText: {
    fontSize: 12,
    lineHeight: 16,
  },
  cookedIndicator: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  cookedIndicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cookedIndicatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cookedIndicatorEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  cookedIndicatorTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cookedIndicatorDate: {
    fontSize: 12,
    marginTop: 2,
  },
  cookedDishPhoto: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    marginLeft: 12,
  },
  recipeMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  metadataItem: {
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  dietaryTagsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dietaryTag: {
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  dietaryTagText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 8,
  },
  ingredientsList: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  instructionsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
  },
  instructionsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  instructionNumber: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  instructionNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  stepContent: {
    flex: 1,
    flexShrink: 1,
  },
  instructionText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  stepText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
    fontWeight: '400',
  },
  stepSeparator: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 16,
    marginLeft: 48,
    borderTopWidth: 1,
  },
  deleteSection: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 8,
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  dualButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  startOverButton: {
    backgroundColor: '#6C757D',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    flex: 1,
  },
  startOverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startCookingButton: {
    backgroundColor: 'rgb(22, 163, 74)',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    flex: 1,
  },
  startCookingButtonSingle: {
    backgroundColor: 'rgb(22, 163, 74)',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startCookingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#DC3545', // rosso pieno
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 0, // nessun bordo
    width: '100%',
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    color: 'white', // testo bianco
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiEditButton: {
    backgroundColor: '#F1F5FF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
  },
  aiEditButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Dish Photos Styles
  dishPhotosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  dishPhotoContainer: {
    width: '48%', // Two photos per row with some gap
    alignItems: 'center',
  },
  dishPhotoWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    width: '100%',
  },
  addPhotoWrapper: {
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  dishPhotoLarge: {
    width: '100%',
    aspectRatio: 1, // Square aspect ratio for better consistency
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#f5f5f5', // Fallback background color
  },
  addPhotoPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoViewOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDeleteOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Photo Slider Styles
  photoSliderContainer: {
    marginBottom: 16,
    marginHorizontal: -20, // Negative margin per uscire dal padding del parent
  },
  photoSlider: {
    height: 280,
  },
  photoSlide: {
    width: Dimensions.get('window').width - 32, // Screen width minus small padding
    paddingHorizontal: 16, // Internal padding per le foto
    marginHorizontal: 0,
  },
  photoSlideWrapper: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoSlideImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  addPhotoSlide: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16, // Same padding as photo slides
  },
  addPhotoSlideContent: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoSlideText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dishPhotoActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noPhotoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  noPhotoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noPhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    minWidth: 160,
  },

  // Nutrition Styles
  nutritionContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  nutritionSecondaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginBottom: 12,
  },
  nutritionSecondaryItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  nutritionSecondaryValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nutritionSecondaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  nutritionNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Cooked By Users Styles
  cookedByUsersContainer: {
    gap: 12,
  },
  creatorLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cookedByUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cookedDate: {
    fontSize: 12,
    marginTop: 2,
  },
  userRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userRatingText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  youLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});