import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

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
}

interface RecipeScreenProps {
  recipe: Recipe;
  onGoBack: () => void;
  onStartOver: () => void;
}

export const RecipeScreen: React.FC<RecipeScreenProps> = ({
  recipe,
  onGoBack,
  onStartOver,
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
      // Recipe is already saved when generated, so we just show success
      Alert.alert(
        t('common.success'),
        t('recipe.recipeSaved'),
        [
          { text: t('common.done'), onPress: onStartOver }
        ]
      );
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setIsSaving(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('recipe.title')}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveRecipe} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size=\"small\" color=\"#007AFF\" />
          ) : (
            <Text style={styles.saveButtonText}>💾</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <Text style={styles.recipeDescription}>{recipe.description}</Text>
        </View>

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
            <Text style={styles.metadataLabel}>{t('recipe.difficulty')}</Text>
            <Text style={[styles.metadataValue, { color: getDifficultyColor(recipe.difficulty) }]}>
              {t(`recipe.difficulty.${recipe.difficulty}`)}
            </Text>
          </View>
        </View>

        {recipe.dietaryTags.length > 0 && (
          <View style={styles.dietaryTagsContainer}>
            <Text style={styles.sectionTitle}>{t('recipe.dietary')}</Text>
            <View style={styles.dietaryTags}>
              {recipe.dietaryTags.map((tag, index) => (
                <View key={index} style={styles.dietaryTag}>
                  <Text style={styles.dietaryTagText}>
                    {t(`recipe.dietary.${tag.replace('-', '')}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startOverButton} onPress={onStartOver}>
          <Text style={styles.startOverButtonText}>{t('common.startOver')}</Text>
        </TouchableOpacity>
      </View>
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
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
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
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  startOverButton: {
    backgroundColor: '#6C757D',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startOverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});