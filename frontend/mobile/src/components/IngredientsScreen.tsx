import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

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
}

export const IngredientsScreen: React.FC<IngredientsScreenProps> = ({
  ingredients: initialIngredients,
  onGenerateRecipe,
  onGoBack,
}) => {
  const { t, i18n } = useTranslation();
  const { token, user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [newIngredient, setNewIngredient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      Alert.alert(t('common.error'), t('recipe.noIngredientsProvided'));
      return;
    }

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
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={generateRecipe}
          disabled={isGenerating || ingredients.length === 0}
        >
          {isGenerating ? (
            <ActivityIndicator size=\"small\" color=\"white\" />
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
});