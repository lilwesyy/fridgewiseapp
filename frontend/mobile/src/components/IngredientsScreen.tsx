import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { RecipeGenerationLoader } from './RecipeGenerationLoader';
import { NotificationModal, NotificationType } from './NotificationModal';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface Ingredient {
  name: string;
  nameIt?: string;
  category: string;
  confidence: number;
  usdaId?: number;
}

interface USDAIngredient {
  name: string;
  nameIt: string;
  category: string;
  confidence: number;
  source: string;
  usdaId?: number;
}

interface IngredientsScreenProps {
  ingredients: Ingredient[];
  onGenerateRecipe: (recipe: any) => void;
  onGoBack: () => void;
  onGoToCamera: (currentIngredients: Ingredient[]) => void;
}

interface IngredientItemProps {
  item: Ingredient;
  index: number;
  onRemove: () => void;
  language: string;
}

const IngredientItem: React.FC<IngredientItemProps> = ({ item, index, onRemove, language }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const itemOpacity = useSharedValue(0);
  const itemScale = useSharedValue(0.8);
  const itemTranslateY = useSharedValue(20);

  React.useEffect(() => {
    const delay = 600 + (index * 100); // Start after list container animation
    itemOpacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    itemScale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
    itemTranslateY.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, [index]);

  const itemAnimatedStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
    transform: [
      { scale: itemScale.value },
      { translateY: itemTranslateY.value }
    ],
  }));

  return (
    <Animated.View style={[styles.ingredientItem, itemAnimatedStyle]}>
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>
          {language === 'it' && item.nameIt ? item.nameIt : item.name}
        </Text>
        <Text style={styles.ingredientCategory}>
          {item.category} • {Math.round(item.confidence * 100)}%
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const IngredientsScreen: React.FC<IngredientsScreenProps> = ({
  ingredients: initialIngredients,
  onGenerateRecipe,
  onGoBack,
  onGoToCamera,
}) => {
  const { t, i18n } = useTranslation();
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
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
  const [searchResults, setSearchResults] = useState<USDAIngredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'error' as NotificationType,
    title: '',
    message: '',
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerTranslateY = useSharedValue(-30);
  
  const addSectionOpacity = useSharedValue(0);
  const addSectionTranslateY = useSharedValue(30);
  
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(40);
  
  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(50);

  // Entrance animations
  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    headerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    
    // Add section animation
    addSectionOpacity.value = withDelay(150, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    addSectionTranslateY.value = withDelay(150, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    
    // List animation
    listOpacity.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    listTranslateY.value = withDelay(300, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    
    // Footer animation
    footerOpacity.value = withDelay(450, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    footerTranslateY.value = withDelay(450, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      { scale: headerScale.value },
      { translateY: headerTranslateY.value }
    ],
  }));

  const addSectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: addSectionOpacity.value,
    transform: [{ translateY: addSectionTranslateY.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  const searchUSDAIngredients = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_URL}/api/analysis/search-ingredients?query=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data.ingredients);
        setShowSuggestions(data.data.ingredients.length > 0);
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleIngredientInputChange = (text: string) => {
    setNewIngredient(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchUSDAIngredients(text);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const addIngredientFromUSDA = (usdaIngredient: USDAIngredient) => {
    const ingredient: Ingredient = {
      name: usdaIngredient.name,
      nameIt: usdaIngredient.nameIt,
      category: usdaIngredient.category,
      confidence: usdaIngredient.confidence,
      usdaId: usdaIngredient.usdaId,
    };
    setIngredients([...ingredients, ingredient]);
    setNewIngredient('');
    setShowSuggestions(false);
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const addIngredient = () => {
    // Non permettere aggiunta manuale - solo da USDA API
    if (searchResults.length > 0) {
      // Se ci sono risultati di ricerca, aggiungi il primo
      addIngredientFromUSDA(searchResults[0]);
    }
  };

  const removeIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
  };

  const showRecipePreferences = () => {
    if (ingredients.length === 0) {
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipe.noIngredientsProvided'),
      });
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
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('recipe.generationFailed'),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderIngredient = ({ item, index }: { item: Ingredient; index: number }) => {
    return (
      <IngredientItem 
        item={item} 
        index={index} 
        onRemove={() => removeIngredient(index)}
        language={i18n.language}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('camera.ingredients')}</Text>
        <TouchableOpacity style={styles.cameraButton} onPress={() => onGoToCamera(ingredients)}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.addIngredientContainer, addSectionAnimatedStyle]}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Cerca ingredienti USDA..."
            placeholderTextColor={colors.textSecondary}
            value={newIngredient}
            onChangeText={handleIngredientInputChange}
            onSubmitEditing={addIngredient}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator 
              size="small" 
              color={colors.primary} 
              style={styles.searchIndicator}
            />
          )}
          <TouchableOpacity 
            style={[
              styles.addButton, 
              searchResults.length === 0 && styles.addButtonDisabled
            ]} 
            onPress={addIngredient}
            disabled={searchResults.length === 0}
          >
            <Text style={[
              styles.addButtonText,
              searchResults.length === 0 && styles.addButtonTextDisabled
            ]}>+</Text>
          </TouchableOpacity>
        </View>
        
        {showSuggestions && searchResults.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => addIngredientFromUSDA(item)}
                >
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionCategory}>{item.category}</Text>
                  </View>
                  <Text style={styles.suggestionSource}>USDA</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </Animated.View>

      {ingredients.length === 0 ? (
        <Animated.View style={[styles.emptyContainer, listAnimatedStyle]}>
          <Text style={styles.emptyText}>{t('camera.noIngredientsFound')}</Text>
        </Animated.View>
      ) : (
        <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
          <FlatList
            data={ingredients}
            renderItem={renderIngredient}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            style={styles.ingredientsList}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}

      <Animated.View style={[styles.footer, footerAnimatedStyle]}>
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
      </Animated.View>

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
        <SafeAreaView style={styles.modalContainer}>
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

          <View style={{ flex: 1, paddingBottom: 100 }}>
            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
            >
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
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.generateModalButton}
              onPress={generateRecipe}
            >
              <Text style={styles.generateModalButtonText}>{t('recipe.generateRecipe')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      
      <RecipeGenerationLoader visible={isGenerating} />
      
      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </View>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  cameraButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  addIngredientContainer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  addButtonText: {
    color: colors.buttonText,
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButtonDisabled: {
    backgroundColor: colors.border,
  },
  addButtonTextDisabled: {
    color: colors.textSecondary,
  },
  searchIndicator: {
    position: 'absolute',
    right: 70,
    zIndex: 1,
  },
  suggestionsContainer: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  suggestionCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  suggestionSource: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ingredientsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: colors.shadow || '#000',
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
    color: colors.text,
    marginBottom: 4,
  },
  ingredientCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  removeButton: {
    backgroundColor: colors.error,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.buttonText,
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  generateButton: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  generateButtonText: {
    color: colors.buttonText,
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
    color: colors.textSecondary,
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
    color: colors.buttonText,
    fontSize: 16,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    padding: 10,
  },
  modalCloseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  modalSpacer: {
    width: 44,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
  },
  preferenceSection: {
    marginBottom: 30,
  },
  preferenceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  portionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portionButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  portionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  portionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  portionButtonTextSelected: {
    color: colors.buttonText,
  },
  difficultyContainer: {
    gap: 10,
  },
  difficultyButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  difficultyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  difficultyButtonTextSelected: {
    color: colors.buttonText,
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeButtonSelected: {
    borderColor: colors.warning,
    backgroundColor: colors.warning,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeButtonTextSelected: {
    color: colors.buttonText,
  },
  modalFooter: {
    position: 'absolute',
    top: '85%', // Posizionato più in basso
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  generateModalButton: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  generateModalButtonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});