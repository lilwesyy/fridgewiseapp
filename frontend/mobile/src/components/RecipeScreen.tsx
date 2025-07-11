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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Svg, { Path } from 'react-native-svg';
import { LoadingAnimation } from './LoadingAnimation';
import { ShareModal } from './ShareModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { ChatAIModal } from './ChatAIModal';
import { NotificationModal, NotificationType } from './NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

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
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  language: 'en' | 'it';
  isSaved?: boolean;
  _id?: string;
}

interface RecipeScreenProps {
  recipe: Recipe;
  onGoBack: () => void;
  onStartOver: () => void;
  onGoToSaved: () => void;
  onGoToRecipes: () => void;
  isJustGenerated?: boolean;
  recipes?: Recipe[]; // Array of all recipes for navigation
  currentIndex?: number; // Current recipe index
  onNavigateToRecipe?: (index: number) => void; // Navigate to specific recipe
  onRecipeUpdate?: (updatedRecipe: Recipe) => void; // Handle recipe updates
}

export const RecipeScreen: React.FC<RecipeScreenProps> = ({
  recipe,
  onGoBack,
  onStartOver,
  onGoToSaved,
  onGoToRecipes,
  isJustGenerated = false,
  recipes = [],
  currentIndex = 0,
  onNavigateToRecipe,
  onRecipeUpdate,
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChatAIModal, setShowChatAIModal] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: NotificationType;
    title: string;
    message: string;
  }>({ visible: false, type: 'success', title: '', message: '' });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerTranslateY = useSharedValue(-30);
  
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);
  
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(50);

  // Entrance animations
  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    headerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    
    // Title animation
    titleOpacity.value = withDelay(150, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    titleTranslateY.value = withDelay(150, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    
    // Content animation
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    contentTranslateY.value = withDelay(300, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    
    // Buttons animation
    buttonsOpacity.value = withDelay(450, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    buttonsTranslateY.value = withDelay(450, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
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

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  const handleShare = () => {
    setShowShareModal(true);
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
        onGoBack();
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

  const saveRecipe = async () => {
    setIsSaving(true);
    try {
      if (recipe.isSaved) {
        setNotification({
          visible: true,
          type: 'warning',
          title: t('common.warning'),
          message: t('recipe.alreadySavedMessage'),
        });
        return;
      }

      const recipeId = recipe.id || recipe._id;
      let saveResponse;

      if (recipeId) {
        // Recipe already exists in database, just mark as saved
        saveResponse = await fetch(`${API_URL}/api/recipe/save/${recipeId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } else {
        // Temporary recipe, save it to database
        saveResponse = await fetch(`${API_URL}/api/recipe/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipe),
        });
      }

      if (saveResponse.ok) {
        setNotification({
          visible: true,
          type: 'success',
          title: t('common.success'),
          message: t('recipe.recipeSaved'),
        });
        // Aggiorna lo stato della ricetta per riflettere che è salvata
        if (typeof recipe.isSaved === 'undefined' || recipe.isSaved === false) {
          recipe.isSaved = true;
        }
      } else {
        throw new Error('Failed to save recipe');
      }
    } catch (error) {
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipe.saveError'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartCooking = async () => {
    try {
      const recipeId = recipe.id || recipe._id;
      if (!recipeId) {
        // Temporary recipe, save it to database (but not to user's saved recipes)
        const saveResponse = await fetch(`${API_URL}/api/recipe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipe),
        });
        if (saveResponse.ok) {
          // Recipe saved to general database, now go back
          onGoBack();
        } else {
          throw new Error('Failed to save recipe to database');
        }
      } else {
        // Recipe already exists in database, just go back
        onGoBack();
      }
    } catch (error) {
      console.error('Error saving recipe to database:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipe.saveError'),
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
      console.error('Error deleting recipe:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipe.deleteError'),
      });
    }
  };

  const renderIngredient = (ingredient: any, index: number) => (
    <View key={index} style={styles.ingredientItem}>
      <Text style={styles.ingredientAmount}>
        {ingredient.amount} {ingredient.unit}
      </Text>
      <Text style={styles.ingredientName}>{ingredient.name}</Text>
    </View>
  );

  const renderInstruction = (instruction: string, index: number) => (
    <View key={index} style={styles.instructionItem}>
      <View style={styles.instructionNumber}>
        <Text style={styles.instructionNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.instructionTextContainer}>
        <Text style={styles.instructionText}>{instruction}</Text>
      </View>
    </View>
  );


  // Auto-close notification after 1.3s
  useEffect(() => {
    if (notification.visible) {
      const timeout = setTimeout(() => {
        setNotification(n => ({ ...n, visible: false }));
      }, 1300);
      return () => clearTimeout(timeout);
    }
  }, [notification.visible]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('recipe.title')}</Text>
            {recipes.length > 1 && (
              <Text style={styles.recipeCounter}>
                {currentIndex + 1} / {recipes.length}
              </Text>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={() => handleShare()}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
                  stroke="rgb(22, 163, 74)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveRecipe} disabled={isSaving}>
            {isSaving ? (
              <LoadingAnimation size={20} color="rgb(22, 163, 74)" />
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                  stroke="rgb(22, 163, 74)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M17 21v-8H7v8M7 3v5h8"
                  stroke="rgb(22, 163, 74)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
            </TouchableOpacity>
          </View>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.recipeHeader, titleAnimatedStyle]}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
        </Animated.View>

        <Animated.View style={[styles.recipeMetadata, contentAnimatedStyle]}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>{t('recipe.cookingTime')}</Text>
              <Text style={styles.metadataValue}>{recipe.cookingTime} min</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>{t('recipe.servings')}</Text>
              <Text style={styles.metadataValue}>{recipe.servings}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>{t('recipe.difficultyLabel')}</Text>
              <Text style={[styles.metadataValue, { color: getDifficultyColor(recipe.difficulty) }]}> 
                {t(`recipe.difficulty.${recipe.difficulty}`)}
              </Text>
            </View>
        </Animated.View>

        {recipe.dietaryTags.length > 0 && (
          <Animated.View style={[styles.dietaryTagsContainer, contentAnimatedStyle]}>
              <Text style={styles.sectionTitle}>{t('recipe.dietary')}</Text>
              <View style={styles.dietaryTags}>
                {recipe.dietaryTags.map((tag) => (
                  <View key={tag} style={styles.dietaryTag}>
                    <Text style={styles.dietaryTagText}>
                      {t(`recipes.dietary.${tag.replace('-', '')}`)}
                    </Text>
                  </View>
                ))}
              </View>
          </Animated.View>
        )}

        <Animated.View style={buttonsAnimatedStyle}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recipe.ingredients')}</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map(renderIngredient)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recipe.instructions')}</Text>
            <View style={styles.instructionsList}>
              {recipe.instructions.map(renderInstruction)}
            </View>
          </View>

          <View style={styles.deleteSection}>
            <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.deleteIcon}>
                <Path
                  d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M10 11v6M14 11v6"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.deleteButtonText}>{t('recipe.deleteRecipe')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.footer, buttonsAnimatedStyle]}>
        {isJustGenerated ? (
          <View style={styles.dualButtonContainer}>
            <TouchableOpacity style={styles.startOverButton} onPress={onStartOver}>
              <Text style={styles.startOverButtonText}>{t('common.startOver')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startCookingButton} onPress={handleStartCooking}>
              <Text style={styles.startCookingButtonText}>{t('recipe.startCooking')}</Text>
            </TouchableOpacity>
          </View>
        ) : recipe.isSaved === true ? (
          <View style={styles.dualButtonContainer}>
            <TouchableOpacity style={styles.startCookingButton} onPress={handleStartCooking}>
              <Text style={styles.startCookingButtonText}>{t('recipe.startCooking')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiEditButton} onPress={() => setShowChatAIModal(true)}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.deleteIcon}>
                <Path d="M21 11.5C21 16.1944 16.9706 20 12 20C10.3431 20 8.84315 19.6569 7.58579 19.0711L3 20L4.07107 16.4142C3.34315 15.1569 3 13.6569 3 12C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </Svg>
              <Text style={styles.aiEditButtonText}>{t('common.edit') || 'Modifica'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startCookingButtonSingle} onPress={handleStartCooking}>
            <Text style={styles.startCookingButtonText}>{t('recipe.startCooking')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      
      <ShareModal
        visible={showShareModal}
        recipe={recipe}
        onClose={() => setShowShareModal(false)}
      />
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteRecipe}
      />
      <ChatAIModal
        visible={showChatAIModal}
        recipe={recipe}
        onClose={() => setShowChatAIModal(false)}
        onRecipeUpdate={onRecipeUpdate}
      />
      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(n => ({ ...n, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
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
  saveButton: {
    padding: 10,
  },
  saveButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  recipeHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
  },
  recipeMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
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
    backgroundColor: 'white',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  ingredientsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  ingredientAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    width: 80,
  },
  ingredientName: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
  },
  instructionsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
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
  instructionNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  instructionText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
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
});