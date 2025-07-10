import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  Animated, // aggiunto Animated
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Svg, { Path } from 'react-native-svg';
import { LoadingAnimation } from './LoadingAnimation';
import { ShareModal } from './ShareModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

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
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      // Check if recipe already has isSaved = true
      if (recipe.isSaved) {
        Alert.alert(
          t('recipe.alreadySavedTitle'),
          t('recipe.alreadySavedMessage'),
          [
            { text: t('common.ok') }
          ]
        );
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
        Alert.alert(
          t('common.success'),
          t('recipe.recipeSaved'),
          [
            { text: t('common.done'), onPress: onGoToSaved }
          ]
        );
      } else {
        throw new Error('Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert(t('common.error'), t('recipe.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartCooking = async () => {
    try {
      const recipeId = recipe.id || recipe._id;
      
      if (!recipeId) {
        // Temporary recipe, save it to database first
        const saveResponse = await fetch(`${API_URL}/api/recipe/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipe),
        });

        if (saveResponse.ok) {
          // Recipe saved successfully, go to recipes screen
          onGoToRecipes();
        } else {
          throw new Error('Failed to save recipe');
        }
      } else {
        // Recipe already exists, just go back
        onGoBack();
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert(t('common.error'), t('recipe.saveError'));
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
        Alert.alert(
          t('common.success'),
          t('recipe.deleteSuccess'),
          [ { text: t('common.ok'), onPress: onGoBack } ]
        );
        return;
      }
      if ((recipe as any).isSaved) {
        const unsaveResponse = await fetch(`${API_URL}/api/recipe/saved/${recipeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (unsaveResponse.ok) {
          Alert.alert(
            t('common.success'),
            t('recipe.deleteSuccess'),
            [ { text: t('common.ok'), onPress: onGoBack } ]
          );
        } else {
          throw new Error('Failed to unsave recipe');
        }
      } else {
        const deleteResponse = await fetch(`${API_URL}/api/recipe/${recipeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (deleteResponse.ok) {
          Alert.alert(
            t('common.success'),
            t('recipe.deleteSuccess'),
            [ { text: t('common.ok'), onPress: onGoBack } ]
          );
        } else {
          throw new Error('Failed to delete recipe');
        }
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      Alert.alert(t('common.error'), t('recipe.deleteError'));
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
      <Text style={styles.instructionText}>{instruction}</Text>
    </View>
  );

  // Animazioni di ingresso a cascata per le sezioni principali
  const animatedBlocks = [useRef(new Animated.Value(0)), useRef(new Animated.Value(0)), useRef(new Animated.Value(0)), useRef(new Animated.Value(0)), useRef(new Animated.Value(0))];
  useEffect(() => {
    Animated.stagger(90, animatedBlocks.map((ref, i) =>
      Animated.timing(ref.current, {
        toValue: 1,
        duration: 420,
        delay: i * 40,
        useNativeDriver: true,
      })
    )).start();
  }, [recipe]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={{
          opacity: animatedBlocks[0].current,
          transform: [{ translateY: animatedBlocks[0].current.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }}
      >
        <View style={styles.header}>
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
        </View>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: animatedBlocks[1].current,
            transform: [{ translateY: animatedBlocks[1].current.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
          }}
        >
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: animatedBlocks[2].current,
            transform: [{ translateY: animatedBlocks[2].current.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
          }}
        >
          <View style={styles.recipeMetadata}>
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
          </View>
        </Animated.View>

        {recipe.dietaryTags.length > 0 && (
          <Animated.View
            style={{
              opacity: animatedBlocks[3].current,
              transform: [{ translateY: animatedBlocks[3].current.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            }}
          >
            <View style={styles.dietaryTagsContainer}>
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
            </View>
          </Animated.View>
        )}

        <Animated.View
          style={{
            opacity: animatedBlocks[4].current,
            transform: [{ translateY: animatedBlocks[4].current.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
          }}
        >
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

      <View style={styles.footer}>
        {isJustGenerated ? (
          <View style={styles.dualButtonContainer}>
            <TouchableOpacity style={styles.startOverButton} onPress={onStartOver}>
              <Text style={styles.startOverButtonText}>{t('common.startOver')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startCookingButton} onPress={handleStartCooking}>
              <Text style={styles.startCookingButtonText}>{t('recipe.startCooking')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startCookingButtonSingle} onPress={onGoBack}>
            <Text style={styles.startCookingButtonText}>{t('recipe.startCooking')}</Text>
          </TouchableOpacity>
        )}
      </View>
      
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
  instructionText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
    flex: 1,
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
});