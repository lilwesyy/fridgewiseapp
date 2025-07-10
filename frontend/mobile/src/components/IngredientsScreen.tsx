import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { RecipeGenerationLoader } from './RecipeGenerationLoader';
import Svg, { Path } from 'react-native-svg';

interface Ingredient {
  name: string;
  nameIt?: string;
  category: string;
  confidence: number;
}

interface IngredientsScreenProps {
  ingredients: Ingredient[];
  onGenerateRecipe: (recipe: any) => void;
  onGoBack: () => void;
  onGoToCamera: (currentIngredients: Ingredient[]) => void;
}

export const IngredientsScreen: React.FC<IngredientsScreenProps> = ({
  ingredients: initialIngredients,
  onGenerateRecipe,
  onGoBack,
  onGoToCamera,
}) => {
  const { t, i18n } = useTranslation();
  const { token, user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);

  // Sync with external ingredient changes (from camera)
  useEffect(() => {
    setIngredients(initialIngredients);
  }, [initialIngredients]);
  const [newIngredient, setNewIngredient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [portions, setPortions] = useState('2');
  const [difficulty, setDifficulty] = useState('easy');
  const [maxTime, setMaxTime] = useState('30');

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  const addIngredient = () => {
    if (newIngredient.trim()) {
      const ingredient: Ingredient = {
        name: newIngredient.trim(),
        category: 'other',
        confidence: 1.0,
      };
      setIngredients([...ingredients, ingredient]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
  };

  const showRecipePreferences = () => {
    if (ingredients.length === 0) {
      Alert.alert(t('common.error'), t('recipe.noIngredientsProvided'));
      return;
    }
    setShowPreferencesModal(true);
  };

  const generateRecipe = async () => {
    setShowPreferencesModal(false);
    setIsGenerating(true);

    try {
      const ingredientNames = ingredients.map(ing => ing.name);
      
      const response = await fetch(`${API_URL}/api/recipe/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredients: ingredientNames,
          language: i18n.language,
          dietaryRestrictions: user?.dietaryRestrictions || [],
          portions: parseInt(portions),
          difficulty: difficulty,
          maxTime: parseInt(maxTime),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Recipe generation failed');
      }

      onGenerateRecipe(data.data);
    } catch (error) {
      console.error('Recipe generation error:', error);
      Alert.alert(t('common.error'), t('recipe.generationFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const renderIngredient = ({ item, index }: { item: Ingredient; index: number }) => (
    <View style={styles.ingredientItem}>
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>
          {i18n.language === 'it' && item.nameIt ? item.nameIt : item.name}
        </Text>
        <Text style={styles.ingredientCategory}>
          {item.category} • {Math.round(item.confidence * 100)}%
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeIngredient(index)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('camera.ingredients')}</Text>
        <TouchableOpacity style={styles.cameraButton} onPress={() => onGoToCamera(ingredients)}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
              stroke="#007AFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
              stroke="#007AFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <View style={styles.addIngredientContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={t('camera.addIngredient')}
          value={newIngredient}
          onChangeText={setNewIngredient}
          onSubmitEditing={addIngredient}
        />
        <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {ingredients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('camera.noIngredientsFound')}</Text>
        </View>
      ) : (
        <FlatList
          data={ingredients}
          renderItem={renderIngredient}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          style={styles.ingredientsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.generateButton, (isGenerating || ingredients.length === 0) && styles.generateButtonDisabled]}
          onPress={showRecipePreferences}
          disabled={isGenerating || ingredients.length === 0}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.generateButtonText}>{t('recipe.generateRecipe')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {isGenerating && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>{t('recipe.generating')}</Text>
        </View>
      )}

      {/* Recipe Preferences Modal */}
      <Modal
        visible={showPreferencesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreferencesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowPreferencesModal(false)}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('recipe.preferences.title')}</Text>
            <View style={styles.modalSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Portions */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceLabel}>{t('recipe.preferences.portions')}</Text>
              <View style={styles.portionsContainer}>
                {['1', '2', '3', '4', '6', '8'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.portionButton,
                      portions === num && styles.portionButtonSelected
                    ]}
                    onPress={() => setPortions(num)}
                  >
                    <Text style={[
                      styles.portionButtonText,
                      portions === num && styles.portionButtonTextSelected
                    ]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceLabel}>{t('recipe.preferences.difficulty')}</Text>
              <View style={styles.difficultyContainer}>
                {['easy', 'medium', 'hard'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level && styles.difficultyButtonSelected
                    ]}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text style={[
                      styles.difficultyButtonText,
                      difficulty === level && styles.difficultyButtonTextSelected
                    ]}>{t(`recipe.difficulty.${level}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Max Time */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceLabel}>{t('recipe.preferences.maxTime')}</Text>
              <View style={styles.timeContainer}>
                {['15', '30', '45', '60', '90', '120'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      maxTime === time && styles.timeButtonSelected
                    ]}
                    onPress={() => setMaxTime(time)}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      maxTime === time && styles.timeButtonTextSelected
                    ]}>{time} min</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.generateModalButton}
              onPress={generateRecipe}
            >
              <Text style={styles.generateModalButtonText}>{t('recipe.generateRecipe')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <RecipeGenerationLoader visible={isGenerating} />
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
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
    flex: 1,
    textAlign: 'center',
  },
  cameraButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  addIngredientContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ingredientsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  ingredientCategory: {
    fontSize: 12,
    color: '#6C757D',
    textTransform: 'capitalize',
  },
  removeButton: {
    backgroundColor: '#DC3545',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  generateButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#6C757D',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalCloseButton: {
    padding: 10,
  },
  modalCloseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  modalSpacer: {
    width: 44,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  preferenceSection: {
    marginBottom: 30,
  },
  preferenceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 15,
  },
  portionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portionButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  portionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  portionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  portionButtonTextSelected: {
    color: 'white',
  },
  difficultyContainer: {
    gap: 10,
  },
  difficultyButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    borderColor: '#28A745',
    backgroundColor: '#28A745',
  },
  difficultyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  difficultyButtonTextSelected: {
    color: 'white',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeButtonSelected: {
    borderColor: '#FFC107',
    backgroundColor: '#FFC107',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  timeButtonTextSelected: {
    color: 'white',
  },
  modalFooter: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  generateModalButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  generateModalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});