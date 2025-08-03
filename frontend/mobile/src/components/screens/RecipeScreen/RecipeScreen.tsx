import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  PanResponder,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { Image } from 'expo-image';

// Components
import {
  RecipeHeader,
  RecipeContent,
  RecipeMetadata,
  RecipePhotoSection,
  RecipeNutrition,
  RecipeIngredients,
  RecipeInstructions,
  RecipeDeleteSection,
  RecipeFooter,
} from './components';

// Modals
import { ShareModal } from '../../modals/ShareModal';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { ChatAIModal } from '../../modals/ChatAIModal';
import { NotificationModal, NotificationType } from '../../modals/NotificationModal';
import { ImageViewerModal } from '../../modals/ImageViewerModal';
import { PhotoUploadModal } from '../../modals/PhotoUploadModal';

// Services
import { HapticService } from '../../../services/hapticService';
import { uploadService } from '../../../services/uploadService';

// Styles
import { getStyles } from './styles';

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
  stepTimers?: number[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  language: 'en' | 'it';
  isSaved?: boolean;
  _id?: string;
  dishPhoto?: string;
  dishPhotos?: Array<{
    url: string;
    publicId: string;
  }>;
  cookedAt?: string;
  createdAt?: string;
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
  userId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  };
  averageRating?: number;
  totalRatings?: number;
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
  onStartCooking?: (recipe: Recipe) => void;
  isJustGenerated?: boolean;
  recipes?: Recipe[];
  currentIndex?: number;
  onNavigateToRecipe?: (index: number) => void;
  onRecipeUpdate?: (updatedRecipe: Recipe) => void;
  isPublic?: boolean;
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
  const styles = getStyles(colors);
  
  // State
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

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // Sync internal recipe state when initial recipe changes
  React.useEffect(() => {
    setRecipe(initialRecipe);
  }, [initialRecipe]);

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
      const response = await fetch(`${API_URL}/api/recipe/${recipe._id}/cooked-by?limit=8`);

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

  // Swipe gestures for navigation
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const { dx, dy } = gestureState;
      return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20;
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      const { locationX } = evt.nativeEvent;

      // Swipe from left edge to go back
      if (locationX < 50 && dx > 100) {
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

  // Handlers
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

      const response = await fetch(`${API_URL}/api/recipe/${recipeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedRecipeData = await response.json();
        const updatedRecipe = updatedRecipeData.data;

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

  const handleStartCooking = async () => {
    try {
      const recipeId = recipe.id || recipe._id;

      if (isJustGenerated && !recipeId) {
        const saveResponse = await fetch(`${API_URL}/api/recipe/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipe),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save recipe to database');
        }

        const savedRecipe = await saveResponse.json();
        const savedRecipeId = savedRecipe.data._id || savedRecipe.data.id;

        const updatedRecipe = {
          ...recipe,
          id: savedRecipeId,
          _id: savedRecipeId,
          isSaved: false
        };

        HapticService.itemSaved();
        if (onRecipeUpdate) {
          onRecipeUpdate(updatedRecipe);
        }
        return;
      }

      if (onStartCooking) {
        HapticService.recipeCompleted();
        onStartCooking(recipe);
      } else {
        HapticService.itemSaved();
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

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteRecipe = async () => {
    setShowDeleteModal(false);
    try {
      const recipeId = recipe.id || recipe._id;
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

      if (recipe.isSaved) {
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

  // Photo handlers
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

      if (recipe.dishPhotos && recipe.dishPhotos.length >= 3) {
        Alert.alert(
          t('common.error'),
          'Maximum 3 photos allowed per recipe',
          [{ text: t('common.ok') }]
        );
        return;
      }

      const result = await uploadService.uploadDishPhoto(imageUri, recipeId);

      const updatedRecipeResponse = await fetch(`${API_URL}/api/recipe/${recipeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (updatedRecipeResponse.ok) {
        const updatedRecipeData = await updatedRecipeResponse.json();
        const updatedRecipe = updatedRecipeData.data;

        setRecipe(updatedRecipe);
        if (onRecipeUpdate) {
          onRecipeUpdate(updatedRecipe);
        }

        setForceUpdateCounter(prev => prev + 1);
        setCurrentPhotoIndex(0);
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
        const updatedPhotos = (recipe.dishPhotos || []).filter((_, index) => index !== photoToDelete);
        const updatedRecipe = {
          ...recipe,
          dishPhotos: updatedPhotos,
        };

        setRecipe(updatedRecipe);
        if (onRecipeUpdate) {
          onRecipeUpdate(updatedRecipe);
        }

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

  return (
    <View 
      key={`recipe-${recipe.id || recipe._id}-${forceUpdateCounter}`}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      <RecipeHeader
        onGoBack={onGoBack}
        onShare={handleShare}
        title={t('recipe.title')}
        currentIndex={currentIndex}
        totalRecipes={recipes.length}
        isJustGenerated={isJustGenerated}
        recipeId={recipe.id || recipe._id}
        onGoToRecipes={onGoToRecipes}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <RecipePhotoSection
          recipe={recipe}
          isPublic={isPublic}
          currentPhotoIndex={currentPhotoIndex}
          setCurrentPhotoIndex={setCurrentPhotoIndex}
          forceUpdateCounter={forceUpdateCounter}
          isUploadingPhoto={isUploadingPhoto}
          onAddPhoto={handleAddPhoto}
          onViewPhoto={handleViewPhoto}
          onDeletePhotoConfirmation={handleDeletePhotoConfirmation}
        />

        <RecipeContent
          recipe={recipe}
          isPublic={isPublic}
          user={user}
        />

        <RecipeMetadata recipe={recipe} />

        {recipe.nutrition && (
          <RecipeNutrition 
            nutrition={recipe.nutrition} 
            servings={recipe.servings} 
          />
        )}

        <RecipeIngredients ingredients={recipe.ingredients || []} />

        <RecipeInstructions instructions={recipe.instructions || []} />

        {/* Users Who Cooked This Recipe Section */}
        {(isPublic || recipe.isPublicRecipe) && usersWhoCookedRecipe.length > 0 && (
          <View style={styles.usersSection}>
            <Text style={styles.usersSectionTitle}>
              {t('recipe.whoCookedThis') || 'Chi ha cucinato questa ricetta'}
            </Text>
            <View style={styles.cookedByUsersContainer}>
              {usersWhoCookedRecipe.map((userCooking, index) => (
                <View key={userCooking.user._id} style={styles.cookedByUserCard}>
                  <View style={styles.userAvatar}>
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
                      <Text style={styles.userAvatarText}>
                        {userCooking.user.name?.charAt(0).toUpperCase() || 'Chef'?.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {userCooking.user.name || 'Chef'}
                      {user && userCooking.user._id === user.id && (
                        <Text style={styles.youLabel}> ({t('common.you')})</Text>
                      )}
                    </Text>
                    {userCooking.cookedAt && (
                      <Text style={styles.cookedDate}>
                        {new Date(userCooking.cookedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delete Section - Separate from main actions */}
        <RecipeDeleteSection
          recipe={recipe}
          isPublic={isPublic}
          onDelete={handleDelete}
        />
      </ScrollView>

      <RecipeFooter
        recipe={recipe}
        isJustGenerated={isJustGenerated}
        isPublic={isPublic}
        onStartCooking={handleStartCooking}
        onStartOver={onStartOver}
        onChatAI={() => setShowChatAIModal(true)}
      />

      {/* Modals */}
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