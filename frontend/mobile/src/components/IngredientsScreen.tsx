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
  Dimensions,
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
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES, ANIMATION_DELAYS } from '../constants/animations';
import { handleRateLimitError, extractErrorFromResponse } from '../utils/rateLimitHandler';
import { DailyUsageIndicator } from './DailyUsageIndicator';
import { useDailyUsage } from '../hooks/useDailyUsage';

const { height: screenHeight } = Dimensions.get('window');

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
    itemOpacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    itemScale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
    itemTranslateY.value = withDelay(delay, withTiming(0, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
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
      <TouchableOpacity activeOpacity={0.7}
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
  const [difficulty, setDifficulty] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
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
  
  const { canGenerateRecipe, usage, refresh: refreshUsage } = useDailyUsage();
  
  // Step wizard logic
  const isLastStep = currentStep === 2;
  const canProceedToNextStep = (() => {
    switch (currentStep) {
      case 0: return portions !== '';
      case 1: return difficulty !== '';
      case 2: return maxTime !== '';
      default: return false;
    }
  })();
  
  const handleNext = () => {
    if (currentStep < 2 && canProceedToNextStep) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const resetModal = () => {
    // Start exit animation first
    modalOpacity.value = withTiming(0, { 
      duration: ANIMATION_DURATIONS.MODAL,
      easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
    });
    modalTranslateY.value = withSpring(1000, {
      damping: 35,
      stiffness: 400,
      mass: 1
    });
    
    // Close modal after animation completes
    setTimeout(() => {
      setCurrentStep(0);
      setPortions('2');
      setDifficulty('');
      setMaxTime('');
      setShowPreferencesModal(false);
    }, ANIMATION_DURATIONS.MODAL);
  };
  
  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return t('recipe.preferences.servings');
      case 1: return t('recipe.preferences.difficulty');
      case 2: return t('recipe.preferences.maxTime');
      default: return '';
    }
  };
  
  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>{t('recipe.preferences.servingsDescription')}</Text>
            <View style={styles.servingsContainer}>
              {['2', '4', '6', '8'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.servingButton,
                    portions === num && styles.servingButtonSelected
                  ]}
                  onPress={() => setPortions(num)}
                >
                  <Text style={[
                    styles.servingButtonText,
                    portions === num && styles.servingButtonTextSelected
                  ]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>{t('recipe.preferences.difficultyDescription')}</Text>
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
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>{t('recipe.preferences.maxTimeDescription')}</Text>
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
        );
      default:
        return null;
    }
  };

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

  // Modal animation values (RatingModal style)
  const modalTranslateY = useSharedValue(1000); // Start from bottom like RatingModal
  const modalOpacity = useSharedValue(0);

  // Entrance animations
  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    headerTranslateY.value = withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) });
    
    // Add section animation
    addSectionOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    addSectionTranslateY.value = withDelay(150, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    
    // List animation
    listOpacity.value = withDelay(300, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    listTranslateY.value = withDelay(300, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    
    // Footer animation
    footerOpacity.value = withDelay(450, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    footerTranslateY.value = withDelay(450, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
  }, []);

  // Modal animation effect (RatingModal style)
  useEffect(() => {
    if (showPreferencesModal) {
      // Reset animation values and start entrance animation
      modalTranslateY.value = 1000;
      modalOpacity.value = 0;
      
      // iOS sheet presentation timing
      modalOpacity.value = withTiming(1, { 
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) 
      });
      modalTranslateY.value = withSpring(0, SPRING_CONFIGS.MODAL);
    }
    // Note: Exit animation is handled manually in resetModal to avoid conflicts
  }, [showPreferencesModal]);

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

  // Modal animated styles (RatingModal style)
  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
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
    // Clear search timeout to prevent interference
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    
    // Clear search state first
    setShowSuggestions(false);
    setSearchResults([]);
    setNewIngredient('');
    
    const ingredient: Ingredient = {
      name: usdaIngredient.name,
      nameIt: usdaIngredient.nameIt,
      category: usdaIngredient.category,
      confidence: usdaIngredient.confidence,
      usdaId: usdaIngredient.usdaId,
    };
    setIngredients([...ingredients, ingredient]);
    
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
    
    // Check daily limit before attempting generation
    if (!canGenerateRecipe) {
      setNotification({
        visible: true,
        type: 'warning',
        title: t('recipe.dailyLimitReached', 'Daily Limit Reached'),
        message: t('recipe.dailyLimitMessage', `You have reached your daily limit of ${usage?.recipeGenerations.limit || 3} recipe generations. Try again tomorrow!`),
      });
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
          portions: parseInt(portions),
          difficulty: difficulty,
          maxTime: parseInt(maxTime),
        }),
      });

      if (!response.ok) {
        const errorData = await extractErrorFromResponse(response);
        throw errorData;
      }

      const data = await response.json();
      onGenerateRecipe(data.data);
      
      // Refresh usage data after successful generation
      refreshUsage();
    } catch (error) {
      console.error('Recipe generation error:', error);
      
      const rateLimitNotification = handleRateLimitError(
        error, 
        t('recipe.rateLimitTitle', 'Too Many Recipe Requests'),
        () => generateRecipe(),
        t
      );
      
      setNotification(rateLimitNotification);
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
        <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('camera.ingredients')}</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.cameraButton} onPress={() => onGoToCamera(ingredients)}>
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
            placeholder={t('ingredients.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={newIngredient}
            onChangeText={handleIngredientInputChange}
            onSubmitEditing={addIngredient}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="none"
            autoComplete="off"
          />
          {isSearching && (
            <ActivityIndicator 
              size="small" 
              color={colors.primary} 
              style={styles.searchIndicator}
            />
          )}
          <TouchableOpacity activeOpacity={0.7} 
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
                <TouchableOpacity activeOpacity={0.7}
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
        <DailyUsageIndicator type="recipeGeneration" showText={true} />
        <TouchableOpacity activeOpacity={0.7}
          style={[styles.generateButton, (isGenerating || ingredients.length === 0 || !canGenerateRecipe) && styles.generateButtonDisabled]}
          onPress={showRecipePreferences}
          disabled={isGenerating || ingredients.length === 0 || !canGenerateRecipe}
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
      {showPreferencesModal && (
        <Modal
          visible={showPreferencesModal}
          transparent
          animationType="none"
          onRequestClose={() => setShowPreferencesModal(false)}
        >
          <Animated.View style={[styles.modalOverlay, modalBackdropStyle]}>
            <Animated.View style={[styles.modalContainer, modalStyle]}>
              <View style={styles.modalHandle} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {getStepTitle()}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {t('recipe.preferences.subtitle')}
                </Text>
                
                {/* Step Indicator */}
                <View style={styles.stepIndicator}>
                  {[0, 1, 2].map((step) => (
                    <View
                      key={step}
                      style={[
                        styles.stepDot,
                        currentStep >= step && styles.stepDotActive
                      ]}
                    />
                  ))}
                </View>
              </View>

              <ScrollView 
                style={styles.modalContent} 
                showsVerticalScrollIndicator={false}
              >
                {getStepContent()}
              </ScrollView>


              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={resetModal}
                  disabled={isGenerating}
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={[styles.button, styles.modalBackButton]}
                    onPress={handleBack}
                    disabled={isGenerating}
                  >
                    <Text style={[styles.buttonText, styles.modalBackButtonText]}>
                      {t('common.back')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    (!canProceedToNextStep || (isLastStep && (!canGenerateRecipe || isGenerating))) && styles.submitButtonDisabled
                  ]}
                  onPress={isLastStep ? generateRecipe : handleNext}
                  disabled={!canProceedToNextStep || (isLastStep && (!canGenerateRecipe || isGenerating))}
                >
                  <Text style={[
                    styles.buttonText,
                    styles.submitButtonText,
                    (!canProceedToNextStep || (isLastStep && (!canGenerateRecipe || isGenerating))) && styles.submitButtonTextDisabled
                  ]}>
                    {isLastStep ? (isGenerating ? t('recipe.generating') : t('recipe.generateRecipe')) : t('common.next')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
      
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
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  suggestionContent: {
    flex: 1,
    marginRight: 12,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  suggestionCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  suggestionSource: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
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
  // Modal styles (RatingModal style)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.5,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.6,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  difficultyButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: 90,
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
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 10,
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
  // Button styles (RatingModal style)
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.text,
  },
  submitButtonText: {
    color: colors.buttonText,
  },
  submitButtonTextDisabled: {
    color: colors.textSecondary,
  },
  // Step wizard styles
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  // Update existing servings container to match new structure
  servingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  servingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  servingButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  servingButtonTextSelected: {
    color: colors.buttonText,
  },
  // Back button styles for modal
  modalBackButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBackButtonText: {
    color: colors.text,
  },
});