import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationModal, NotificationType } from '../modals/NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../../services/apiService';

interface PendingRecipe {
  _id: string;
  title: string;
  description: string;
  ingredients: Array<{ name: string; amount: string; unit: string }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  cookedAt?: string;
  dishPhotos: Array<{ url: string; publicId: string }>;
  createdAt: string;
  updatedAt: string;
}

interface RecipeApprovalModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RecipeApprovalModal: React.FC<RecipeApprovalModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [pendingRecipes, setPendingRecipes] = useState<PendingRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success' as NotificationType,
    title: '',
    message: '',
  });
  const [selectedRecipe, setSelectedRecipe] = useState<PendingRecipe | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState<PendingRecipe | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fetchPendingRecipes();
      
      // Reset animations
      headerOpacity.value = 0;
      contentOpacity.value = 0;
      
      // Entrance animations
      const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);
      headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
      contentOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    }
  }, [visible]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const fetchPendingRecipes = async () => {
    setIsLoading(true);
    try {
      // Fetch recipes that are cooked but not yet approved/rejected
      // This should include all recipes with cookedAt but no approval status
      let response = await apiService.get('/api/recipe/admin/cooked-pending');
      
      console.log('🔍 RecipeApprovalModal - Response from cooked-pending:', {
        success: response.success,
        dataExists: !!response.data,
        recipesCount: response.data?.recipes?.length || 0,
        fullResponse: response
      });

      if (response.success) {
        const recipes = response.data?.recipes || [];
        console.log('✅ RecipeApprovalModal - Setting recipes:', recipes.length, 'recipes');
        setPendingRecipes(recipes);
      } else {
        // Fallback to old endpoint if new one doesn't exist yet
        console.warn('Cooked-pending endpoint not available, falling back to pending endpoint');
        const fallbackResponse = await apiService.get('/api/recipe/admin/pending');
        
        console.log('🔍 RecipeApprovalModal - Fallback response from pending:', {
          success: fallbackResponse.success,
          dataExists: !!fallbackResponse.data,
          recipesCount: fallbackResponse.data?.recipes?.length || 0,
          fullResponse: fallbackResponse
        });
        
        if (fallbackResponse.success) {
          const recipes = fallbackResponse.data?.recipes || [];
          console.log('✅ RecipeApprovalModal - Setting fallback recipes:', recipes.length, 'recipes');
          setPendingRecipes(recipes);
        } else {
          setNotification({
            visible: true,
            type: 'error',
            title: t('common.error', 'Error'),
            message: fallbackResponse.error || 'Failed to fetch pending recipes',
          });
        }
      }
    } catch (error: any) {
      console.log('Error fetching pending recipes:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error', 'Error'),
        message: error.message || 'Network error. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPendingRecipes();
  };

  const handleApprove = async (recipeId: string) => {
    setIsProcessing(true);
    try {
      const response = await apiService.post(`/api/recipe/admin/approve/${recipeId}`);

      if (response.success) {
        setNotification({
          visible: true,
          type: 'success',
          title: t('admin.recipeApproved', 'Recipe Approved'),
          message: t('admin.recipeApprovedMessage', 'Recipe has been approved and is now public'),
        });
        
        // Remove the approved recipe from the list
        setPendingRecipes(prev => prev.filter(recipe => recipe._id !== recipeId));
      } else {
        setNotification({
          visible: true,
          type: 'error',
          title: t('common.error', 'Error'),
          message: response.error || 'Failed to approve recipe',
        });
      }
    } catch (error: any) {
      console.log('Error approving recipe:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error', 'Error'),
        message: error.message || 'Network error. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecipe || !rejectReason.trim()) {
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error', 'Error'),
        message: t('admin.rejectReasonRequired', 'Please provide a reason for rejection'),
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.post(`/api/recipe/admin/reject/${selectedRecipe._id}`, {
        reason: rejectReason.trim(),
      });

      if (response.success) {
        setNotification({
          visible: true,
          type: 'success',
          title: t('admin.recipeRejected', 'Recipe Rejected'),
          message: t('admin.recipeRejectedMessage', 'Recipe has been rejected'),
        });
        
        // Remove the rejected recipe from the list
        setPendingRecipes(prev => prev.filter(recipe => recipe._id !== selectedRecipe._id));
        
        // Close reject modal
        setShowRejectModal(false);
        setSelectedRecipe(null);
        setRejectReason('');
      } else {
        setNotification({
          visible: true,
          type: 'error',
          title: t('common.error', 'Error'),
          message: response.error || 'Failed to reject recipe',
        });
      }
    } catch (error: any) {
      console.log('Error rejecting recipe:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error', 'Error'),
        message: error.message || 'Network error. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (recipe: PendingRecipe) => {
    setSelectedRecipe(recipe);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const openPreviewModal = (recipe: PendingRecipe) => {
    setPreviewRecipe(recipe);
    setShowPreviewModal(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <TouchableOpacity style={styles.cancelButton} onPress={showPreviewModal ? () => setShowPreviewModal(false) : onClose}>
              <Text style={styles.cancelButtonText}>
                {showPreviewModal ? t('common.back', 'Back') : t('common.cancel', 'Annulla')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {showPreviewModal ? t('admin.recipePreview', 'Recipe Preview') : t('admin.cookedRecipesApproval', 'Cooked Recipes - Approval')}
            </Text>
            <View style={styles.headerRight}>
              {!showPreviewModal && (
                <Text style={styles.countBadge}>
                  {pendingRecipes.length}
                </Text>
              )}
            </View>
          </Animated.View>

          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            {showPreviewModal ? (
              // Preview Content
              <View style={styles.previewContainer}>
                <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={false}>
                {previewRecipe && (
                  <View style={styles.previewCard}>
                    {/* Header */}
                    <View style={styles.previewHeader}>
                      <Text style={styles.previewTitle}>{previewRecipe.title}</Text>
                      <View style={styles.previewMetrics}>
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(previewRecipe.difficulty) + '20' }]}>
                          <Text style={[styles.difficultyText, { color: getDifficultyColor(previewRecipe.difficulty) }]}>
                            {t(`recipe.difficulty.${previewRecipe.difficulty}`, previewRecipe.difficulty)}
                          </Text>
                        </View>
                        <View style={styles.previewTimeContainer}>
                          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                          <Text style={styles.previewTime}>
                            {previewRecipe.cookingTime} min
                          </Text>
                        </View>
                        <View style={styles.previewServingsContainer}>
                          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                          <Text style={styles.previewServings}>
                            {previewRecipe.servings} {t('recipe.servings', 'servings')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.previewDescription}>{previewRecipe.description}</Text>

                    {/* Photos */}
                    {previewRecipe.dishPhotos.length > 0 && (
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.photosContainer}
                      >
                        {previewRecipe.dishPhotos.map((photo, index) => (
                          <Image
                            key={index}
                            source={{ uri: photo.url }}
                            style={styles.previewPhoto}
                            contentFit="cover"
                          />
                        ))}
                      </ScrollView>
                    )}

                    {/* Ingredients */}
                    <View style={styles.previewSection}>
                      <Text style={styles.previewSectionTitle}>
                        {t('recipe.ingredients', 'Ingredients')} ({previewRecipe.ingredients.length})
                      </Text>
                      {previewRecipe.ingredients.map((ingredient, index) => (
                        <View key={index} style={styles.ingredientRow}>
                          <Text style={styles.ingredientAmount}>
                            {ingredient.amount} {ingredient.unit}
                          </Text>
                          <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Instructions */}
                    <View style={styles.previewSection}>
                      <Text style={styles.previewSectionTitle}>
                        {t('recipe.instructions', 'Instructions')}
                      </Text>
                      {previewRecipe.instructions.map((instruction: string, index: number) => (
                        <View key={index} style={styles.instructionRow}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.instructionText}>{instruction}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Author Info */}
                    <View style={styles.previewAuthor}>
                      <Text style={styles.previewAuthorText}>
                        {t('admin.by', 'By')}: {previewRecipe.userId.name}
                      </Text>
                      <Text style={styles.previewDate}>
                        {formatDate(previewRecipe.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons for Preview */}
              {previewRecipe && (
                <View style={styles.previewActionBar}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => {
                      setShowPreviewModal(false);
                      openRejectModal(previewRecipe);
                    }}
                    disabled={isProcessing}
                  >
                    <Ionicons name="close" size={20} color={colors.error} />
                    <Text style={styles.rejectButtonText}>
                      {t('admin.reject', 'Reject')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => {
                      setShowPreviewModal(false);
                      handleApprove(previewRecipe._id);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={colors.buttonText} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color={colors.buttonText} />
                        <Text style={styles.approveButtonText}>
                          {t('admin.approve', 'Approve')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              </View>
            ) : isLoading && !isRefreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  {t('admin.loadingCookedRecipes', 'Loading cooked recipes for approval...')}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                  />
                }
                showsVerticalScrollIndicator={false}
              >
                {pendingRecipes.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                    <Text style={styles.emptyTitle}>
                      {t('admin.noCookedRecipesPending', 'No Cooked Recipes Pending')}
                    </Text>
                    <Text style={styles.emptyMessage}>
                      {t('admin.allCookedRecipesReviewed', 'All cooked recipes have been reviewed! Users need to cook recipes to submit them for public approval.')}
                    </Text>
                  </View>
                ) : (
                  pendingRecipes.map((recipe) => (
                    <View key={recipe._id} 
                      style={styles.recipeCard}
                    >
                      <TouchableOpacity 
                        style={styles.recipeContent}
                        onPress={() => openPreviewModal(recipe)}
                        activeOpacity={0.7}
                      >
                      <View style={styles.recipeHeader}>
                        <Text style={styles.recipeTitle}>{recipe.title}</Text>
                        <View style={styles.recipeMetrics}>
                          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) + '20' }]}>
                            <Text style={[styles.difficultyText, { color: getDifficultyColor(recipe.difficulty) }]}>
                              {t(`recipe.difficulty.${recipe.difficulty}`, recipe.difficulty)}
                            </Text>
                          </View>
                          <Text style={styles.cookingTime}>
                            {recipe.cookingTime} min
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.recipeDescription} numberOfLines={2}>
                        {recipe.description}
                      </Text>

                      <View style={styles.recipeDetails}>
                        <Text style={styles.authorText}>
                          {t('admin.by', 'By')}: {recipe.userId.name}
                        </Text>
                        <Text style={styles.dateText}>
                          {formatDate(recipe.updatedAt)}
                        </Text>
                      </View>

                      <View style={styles.ingredientsPreview}>
                        <Text style={styles.ingredientsTitle}>
                          {t('recipe.ingredients', 'Ingredients')} ({recipe.ingredients.length}):
                        </Text>
                        <Text style={styles.ingredientsList} numberOfLines={2}>
                          {recipe.ingredients.slice(0, 3).map(ing => ing.name).join(', ')}
                          {recipe.ingredients.length > 3 && '...'}
                        </Text>
                      </View>

                      {recipe.dishPhotos.length > 0 && (
                        <View style={styles.photoIndicator}>
                          <Ionicons name="camera" size={16} color={colors.primary} />
                          <Text style={styles.photoCount}>
                            {recipe.dishPhotos.length} {t('admin.photos', 'photos')}
                          </Text>
                        </View>
                      )}
                      </TouchableOpacity>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton, styles.rejectButtonCard]}
                          onPress={() => openRejectModal(recipe)}
                          disabled={isProcessing}
                        >
                          <Ionicons name="close" size={20} color={colors.error} />
                          <Text style={styles.rejectButtonText}>
                            {t('admin.reject', 'Reject')}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => handleApprove(recipe._id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color={colors.buttonText} />
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={20} color={colors.buttonText} />
                              <Text style={styles.approveButtonText}>
                                {t('admin.approve', 'Approve')}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </Animated.View>
        </SafeAreaView>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowRejectModal(false);
          setSelectedRecipe(null);
          setRejectReason('');
        }}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setShowRejectModal(false);
                setSelectedRecipe(null);
                setRejectReason('');
              }}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {t('admin.rejectRecipe', 'Reject Recipe')}
            </Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.rejectContent}>
            <Text style={styles.rejectTitle}>
              {t('admin.rejectingRecipe', 'Rejecting')}: "{selectedRecipe?.title}"
            </Text>
            
            <Text style={styles.rejectLabel}>
              {t('admin.rejectionReason', 'Reason for rejection')}:
            </Text>
            
            <TextInput
              style={styles.rejectInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder={t('admin.rejectionReasonPlaceholder', 'Please provide a clear reason for rejection...')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            
            <Text style={styles.characterCount}>
              {rejectReason.length}/500
            </Text>

            <TouchableOpacity
              style={[styles.confirmRejectButton, !rejectReason.trim() && styles.disabledButton]}
              onPress={handleReject}
              disabled={!rejectReason.trim() || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.buttonText} />
              ) : (
                <Text style={styles.confirmRejectButtonText}>
                  {t('admin.confirmReject', 'Confirm Rejection')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>


      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  countBadge: {
    backgroundColor: colors.primary,
    color: colors.buttonText,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeContent: {
    marginBottom: 16,
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
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  recipeMetrics: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cookingTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ingredientsPreview: {
    marginBottom: 12,
  },
  ingredientsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  ingredientsList: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoCount: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  rejectButtonCard: {
    backgroundColor: colors.card,
  },
  rejectButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  approveButtonText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
  // Reject Modal Styles
  rejectContent: {
    flex: 1,
    padding: 20,
  },
  rejectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  rejectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.inputBackground,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
  },
  confirmRejectButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmRejectButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  // Preview Modal Container
  previewModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Preview Modal Styles
  previewContainer: {
    flex: 1,
  },
  previewContent: {
    flex: 1,
  },
  previewCard: {
    padding: 20,
  },
  previewHeader: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  previewMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewServingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewServings: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  photosContainer: {
    marginBottom: 24,
  },
  previewPhoto: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  ingredientAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    minWidth: 80,
  },
  ingredientName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.buttonText,
  },
  instructionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    flex: 1,
  },
  previewAuthor: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  previewAuthorText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  previewDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewActionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});