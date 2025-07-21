import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Vibration,
  Modal,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path, Circle } from 'react-native-svg';
import { NotificationModal, NotificationType } from './NotificationModal';
import { PhotoUploadModal } from './PhotoUploadModal';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES, ANIMATION_DELAYS } from '../constants/animations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Recipe {
  id?: string;
  _id?: string;
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
}

interface CookingModeScreenProps {
  recipe: Recipe;
  onGoBack: () => void;
  onFinishCooking: () => void;
}

type CookingPhase = 'preparation' | 'cooking' | 'completed';

export const CookingModeScreen: React.FC<CookingModeScreenProps> = (props) => {
  // Ensure props are valid
  if (!props || typeof props !== 'object') {
    console.error('CookingModeScreen: Invalid props received');
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: Invalid props</Text>
      </SafeAreaView>
    );
  }
  
  const { recipe, onGoBack, onFinishCooking } = props;
  
  // Safety check for recipe before any hooks
  if (!recipe || typeof recipe !== 'object') {
    console.error('CookingModeScreen: Recipe is null or undefined');
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: Recipe not found</Text>
        <TouchableOpacity onPress={onGoBack} style={{ marginTop: 16, padding: 12, backgroundColor: '#007AFF', borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Safe translation helper
  const safeT = useCallback((key: string, fallback: string = key) => {
    try {
      if (!t || typeof t !== 'function') {
        console.warn(`Translation function not available, using fallback for key "${key}"`);
        return fallback;
      }
      const translation = t(key);
      if (translation === null || translation === undefined) {
        console.warn(`Translation returned null/undefined for key "${key}", using fallback`);
        return fallback;
      }
      if (typeof translation !== 'string') {
        console.warn(`Translation is not a string for key "${key}":`, typeof translation, translation);
        return fallback;
      }
      return translation;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return fallback;
    }
  }, [t]);

  // Debug logging (only once when component mounts)
  useEffect(() => {
    if (recipe && typeof recipe === 'object') {
      console.log('CookingModeScreen: Recipe received:', {
        title: recipe?.title || 'No title',
        ingredientsCount: Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0,
        instructionsCount: Array.isArray(recipe.instructions) ? recipe.instructions.length : 0,
        stepTimers: Array.isArray(recipe.stepTimers) ? recipe.stepTimers : []
      });
    }
  }, [recipe?.id || recipe?._id]); // Use recipe ID as dependency to avoid excessive logging
  const [currentPhase, setCurrentPhase] = useState<CookingPhase>('preparation');

  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>(
    new Array(recipe?.ingredients?.length || 0).fill(false)
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [dishPhoto, setDishPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [hasAutoStartedTimer, setHasAutoStartedTimer] = useState(false);
  const [showAutoTimerModal, setShowAutoTimerModal] = useState(false);
  const [autoTimerMinutes, setAutoTimerMinutes] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'error' as NotificationType,
    title: '',
    message: '',
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  // Animation values
  const headerOpacity = useSharedValue(1);
  const phaseTransition = useSharedValue(0);
  const stepTransition = useSharedValue(0);
  const timerPulse = useSharedValue(1);

  // Initialize animations
  useEffect(() => {
    headerOpacity.value = withTiming(1, { 
      duration: ANIMATION_DURATIONS.CONTENT,
      easing: Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2)
    });
    phaseTransition.value = withTiming(1, { 
      duration: ANIMATION_DURATIONS.CONTENT,
      easing: Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2)
    });
  }, []);

  // Initialize step animation when entering cooking phase
  useEffect(() => {
    if (currentPhase === 'cooking') {
      stepTransition.value = withTiming(1, { 
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2)
      });
    }
  }, [currentPhase]);

  // Auto-generate timers from instructions if not provided
  const generateTimerFromInstruction = (instruction: string): number => {
    if (typeof instruction !== 'string') return 0;
    
    const lowerInstruction = instruction.toLowerCase();
    
    // Look for explicit time mentions
    const timePatterns = [
      /(\d+)\s*minut[oi]/g, // Italian minutes
      /(\d+)\s*minute?s?/g, // English minutes
      /(\d+)\s*min/g, // min abbreviation
      /(\d+)\s*ore?/g, // Italian hours (convert to minutes)
      /(\d+)\s*hours?/g, // English hours (convert to minutes)
    ];
    
    for (const pattern of timePatterns) {
      const match = pattern.exec(lowerInstruction);
      if (match) {
        const time = parseInt(match[1]);
        // If it's hours, convert to minutes, otherwise use as minutes
        if (lowerInstruction.includes('ore') || lowerInstruction.includes('hour')) {
          return time * 60;
        }
        return time;
      }
    }
    
    // Fallback logic based on cooking keywords
    if (lowerInstruction.includes('cuocere') || lowerInstruction.includes('cook')) {
      return 10; // Default cooking time
    }
    if (lowerInstruction.includes('friggere') || lowerInstruction.includes('fry')) {
      return 5;
    }
    if (lowerInstruction.includes('bollire') || lowerInstruction.includes('boil')) {
      return 8;
    }
    if (lowerInstruction.includes('rosolare') || lowerInstruction.includes('sauté')) {
      return 3;
    }
    if (lowerInstruction.includes('riposare') || lowerInstruction.includes('rest')) {
      return 5;
    }
    
    return 0; // No timer for this step
  };

  // Auto-start timer when step changes
  useEffect(() => {
    if (currentPhase === 'cooking' && recipe?.instructions && currentStep < recipe.instructions.length) {
      let stepTimer: number | null = null;
      
      // First try to get timer from recipe.stepTimers
      if (recipe?.stepTimers && Array.isArray(recipe.stepTimers) && currentStep < recipe.stepTimers.length) {
        stepTimer = recipe.stepTimers[currentStep];
      } else {
        // Generate timer from instruction text
        const instruction = recipe.instructions[currentStep];
        stepTimer = generateTimerFromInstruction(instruction);
      }
      
      if (typeof stepTimer === 'number' && stepTimer > 0 && !hasAutoStartedTimer) {
        // Stop any existing timer first
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        // Auto-start timer for this step
        setTimerSeconds(stepTimer * 60);
        setIsTimerRunning(true);
        setHasAutoStartedTimer(true);
        setAutoTimerMinutes(stepTimer);
        setShowAutoTimerModal(true);
      }
    }
  }, [currentStep, currentPhase, recipe?.stepTimers, recipe?.instructions, hasAutoStartedTimer]);

  // Auto-close NotificationModal after 2.5s
  useEffect(() => {
    if (showAutoTimerModal) {
      const timer = setTimeout(() => {
        setShowAutoTimerModal(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showAutoTimerModal]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timerSeconds === 0) {
      // Timer finished
      setIsTimerRunning(false);
      Vibration.vibrate([500, 200, 500]);
      setNotification({
        visible: true,
        type: 'success',
        title: safeT('cookingMode.timerComplete', 'Timer Complete!'),
        message: safeT('cookingMode.timerCompleteMessage', "Time's up! Check your recipe."),
      });
      timerPulse.value = withSequence(
        withTiming(1.3, { 
          duration: ANIMATION_DURATIONS.QUICK,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
        }),
        withTiming(1, { 
          duration: ANIMATION_DURATIONS.QUICK,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
        })
      );
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const toggleIngredient = (index: number) => {
    const newChecked = [...checkedIngredients];
    newChecked[index] = !newChecked[index];
    setCheckedIngredients(newChecked);
  };

  const allIngredientsChecked = (recipe?.ingredients || []).length === 0 || checkedIngredients.every(checked => checked);

  const startCooking = () => {
    if (!allIngredientsChecked) {
      setNotification({
        visible: true,
        type: 'warning',
        title: safeT('cookingMode.ingredientsNotReady', 'Ingredients not ready'),
        message: safeT('cookingMode.ingredientsNotReadyMessage', 'You need to prepare all ingredients before starting to cook.'),
      });
      return;
    }

    phaseTransition.value = withTiming(1, { 
      duration: ANIMATION_DURATIONS.MODAL,
      easing: Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2)
    });
    setCurrentPhase('cooking');
  };

  const nextStep = () => {
    const instructionsLength = recipe?.instructions?.length || 0;
    if (currentStep < instructionsLength - 1) {
      // Stop current timer and reset states
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsTimerRunning(false);
      setHasAutoStartedTimer(false); // Reset auto-timer flag BEFORE changing step
      
      stepTransition.value = withSequence(
        withTiming(0.8, { 
          duration: ANIMATION_DURATIONS.QUICK,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
        }),
        withTiming(1, { 
          duration: ANIMATION_DURATIONS.QUICK,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
        })
      );
      setCurrentStep(currentStep + 1);
    } else {
      completeCooking();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      // Stop current timer and reset states
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsTimerRunning(false);
      setHasAutoStartedTimer(false); // Reset auto-timer flag BEFORE changing step
      
      stepTransition.value = withSequence(
        withTiming(0.8, { 
          duration: ANIMATION_DURATIONS.QUICK,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
        }),
        withTiming(1, { 
          duration: ANIMATION_DURATIONS.QUICK,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
        })
      );
      setCurrentStep(currentStep - 1);
    }
  };

  const completeCooking = () => {
    setShowFinishModal(true);
  };



  const handlePhotoSelected = async (uri: string) => {
    // This is called when user selects a photo but we're not handling upload here
    // The PhotoUploadModal will handle the upload directly
    setDishPhoto(uri);
  };

  const handlePhotoUploadComplete = async (result: { url: string; publicId: string }) => {
    try {
      // Save recipe with photo URL
      setDishPhoto(result.url);
      await saveDishToCollection();
      
      setNotification({
        visible: true,
        type: 'success',
        title: safeT('cookingMode.photoUpload.success.title', 'Photo Uploaded'),
        message: safeT('cookingMode.photoUpload.success.message', 'Your dish photo has been saved successfully!'),
      });
    } catch (error) {
      console.error('Error saving recipe with photo:', error);
      // Still try to save without photo
      setDishPhoto(null);
      await saveDishToCollection();
      
      setNotification({
        visible: true,
        type: 'warning',
        title: safeT('cookingMode.photoUploadFailed', 'Photo upload failed'),
        message: safeT('cookingMode.photoUploadFailed', 'Photo upload failed, saving without photo'),
      });
    } finally {
      setShowPhotoModal(false);
    }
  };

  const handlePhotoUploadError = async (error: any) => {
    console.error('Photo upload error:', error);
    
    // Track the error for analytics
    if (__DEV__) {
      console.log('[CookingMode] Photo upload failed:', error.type, error.message);
    }
    
    // The PhotoUploadModal will handle showing the error UI
    // We don't need to show additional notifications here
  };

  const handleSkipPhoto = async () => {
    setDishPhoto(null);
    setShowPhotoModal(false);
    
    try {
      await saveDishToCollection();
    } catch (error) {
      console.error('Error saving dish without photo:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error', 'Error'),
        message: safeT('recipe.cookingError', 'Failed to save recipe'),
      });
    }
  };

  const handlePhotoModalClose = () => {
    // Allow closing even during upload since PhotoUploadModal handles its own state
    setShowPhotoModal(false);
  };

  const finishCooking = async () => {
    setShowFinishModal(false);
    // Show photo upload modal after completing all steps
    setShowPhotoModal(true);
  };

  const uploadDishPhoto = async (imageUri: string) => {
    try {
      console.log('🔄 Starting dish photo upload...');
      console.log('📸 Image URI:', imageUri);
      console.log('🔧 Will create FormData...');
      
      const formData = new FormData();
      console.log('✅ FormData created');
      
      // Handle file URI - React Native specific handling (same as avatar)
      const filename = imageUri.split('/').pop() || 'dish-photo.jpg';
      const fileType = filename.split('.').pop() || 'jpg';
      console.log('📝 File info:', { filename, fileType });
      
      formData.append('dishPhoto', {
        uri: imageUri,
        type: `image/${fileType}`,
        name: filename,
      } as any);
      console.log('📎 File appended to FormData');

      console.log('🌐 Uploading to backend...');

      const response = await fetch(`${API_URL}/api/upload/dish-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response status text:', response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dish photo upload successful:', result.data.url);
        return {
          url: result.data.url,
          publicId: result.data.publicId
        };
      } else {
        const errorData = await response.text();
        console.error('❌ Backend response error:', errorData);
        throw new Error(`Dish photo upload failed: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error uploading dish photo:', error);
      throw error;
    }
  };

  const saveDishToCollection = async () => {
    try {
      const recipeId = recipe?.id || recipe?._id || '';
      
      if (!recipeId) {
        throw new Error('Recipe ID not found');
      }

      let dishPhotoData = null;

      // Upload photo to backend if available
      if (dishPhoto) {
        try {
          dishPhotoData = await uploadDishPhoto(dishPhoto);
          
          // Show success notification for photo upload
          setNotification({
            visible: true,
            type: 'success',
            title: safeT('common.success', 'Success'),
            message: safeT('cookingMode.photoUploaded', 'Photo uploaded successfully'),
          });
          
          // Brief delay to show success message
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          
          // Continue without photo if upload fails - graceful degradation
          setNotification({
            visible: true,
            type: 'warning',
            title: safeT('common.warning', 'Warning'),
            message: safeT('cookingMode.photoUploadFailed', 'Photo upload failed, saving recipe without photo'),
          });
          
          // Wait a bit before continuing
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // Prepare request body
      const requestBody = {
        dishPhoto: dishPhotoData,
        cookedAt: new Date().toISOString(),
      };

      // Add recipe to user's collection with photo metadata
      const addToDishesResponse = await fetch(`${API_URL}/api/recipe/save/${recipeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (addToDishesResponse.ok) {
        // Update recipe state to reflect it's now in user's collection
        (recipe as any).isSaved = true;
        (recipe as any).dishPhoto = dishPhotoData;
        (recipe as any).cookedAt = new Date().toISOString();

        // Show success notification
        setNotification({
          visible: true,
          type: 'success',
          title: safeT('cookingMode.recipeSaved', 'Recipe Saved!'),
          message: safeT('cookingMode.recipeAddedToCollection', 'Recipe added to your collection'),
        });

        // Animate to completed phase with enhanced transition
        phaseTransition.value = withSequence(
          withTiming(0.95, { 
            duration: ANIMATION_DURATIONS.QUICK,
            easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
          }),
          withTiming(1, { 
            duration: ANIMATION_DURATIONS.MODAL,
            easing: Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2)
          })
        );
        setCurrentPhase('completed');

        // After showing completion screen, go back to saved recipes
        setTimeout(() => {
          onFinishCooking();
        }, 2500);
      } else {
        const errorData = await addToDishesResponse.text();
        throw new Error(`Failed to add recipe to your dishes: ${errorData}`);
      }
    } catch (error) {
      console.error('Error saving recipe to collection:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error', 'Error'),
        message: safeT('recipe.cookingError', 'Failed to save recipe. Please try again.'),
      });
      
      // Reset upload state on error
      setIsUploadingPhoto(false);
    }
  };

  const handleGoBack = () => {
    if (currentPhase === 'preparation') {
      onGoBack();
    } else {
      setShowExitModal(true);
    }
  };

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
    timerPulse.value = withTiming(1.1, { 
      duration: ANIMATION_DURATIONS.STANDARD,
      easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
    });
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timerSeconds > 60) return colors.success;
    if (timerSeconds > 30) return colors.warning;
    return colors.error;
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const phaseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: phaseTransition.value,
    transform: [{ scale: 0.95 + phaseTransition.value * 0.05 }],
  }));

  const stepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stepTransition.value }],
  }));

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulse.value }],
  }));

  const renderIngredientsList = () => {
    const ingredients = recipe?.ingredients || [];
    if (ingredients.length === 0) {
      return (
        <View style={styles.ingredientsContainer}>
          <Text style={styles.phaseTitle}>{safeT('cookingMode.prepareIngredients', 'Prepare Ingredients')}</Text>
          <Text style={styles.phaseSubtitle}>{safeT('cookingMode.noIngredients', 'No ingredients')}</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{safeT('cookingMode.noIngredientsMessage', 'This recipe has no specified ingredients. You can go directly to cooking.')}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.ingredientsContainer}>
        <Text style={styles.phaseTitle}>{safeT('cookingMode.prepareIngredients', 'Prepare Ingredients')}</Text>
        <Text style={styles.phaseSubtitle}>{safeT('cookingMode.checkOffIngredients', 'Check off ingredients as you prepare them')}</Text>
        <ScrollView style={styles.ingredientsList} showsVerticalScrollIndicator={false}>
          {ingredients.map((ingredient, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.ingredientItem,
                checkedIngredients[index] && styles.ingredientItemChecked
              ]}
              onPress={() => toggleIngredient(index)}
            >
              <View style={styles.ingredientContent}>
                <View style={[
                  styles.checkbox,
                  checkedIngredients[index] && styles.checkboxChecked
                ]}>
                  {checkedIngredients[index] ? (
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 6L9 17L4 12"
                        stroke={colors.buttonText}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : null}
                </View>
                <View style={styles.ingredientText}>
                  <Text style={[
                    styles.ingredientName,
                    checkedIngredients[index] && styles.ingredientNameChecked
                  ]}>
                    {String(ingredient.name || '')}
                  </Text>
                  <Text style={[
                    styles.ingredientAmount,
                    checkedIngredients[index] && styles.ingredientAmountChecked
                  ]}>
                    {String(`${ingredient.amount || ''} ${ingredient.unit || ''}`.trim())}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${Math.round((checkedIngredients.filter(Boolean).length / Math.max(ingredients.length, 1)) * 100)}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {String(`${checkedIngredients.filter(Boolean).length}/${ingredients.length} ${safeT('cookingMode.ingredientsReady', 'ingredients ready')}`)}
          </Text>
        </View>
      </View>
    );
  };

  const renderCookingSteps = () => {
    const stepText = recipe?.instructions?.[currentStep];
    const stepTimer = (recipe?.stepTimers && Array.isArray(recipe.stepTimers) && typeof recipe.stepTimers[currentStep] === 'number') 
      ? recipe.stepTimers[currentStep] 
      : null;
    const presetMinutes = [5, 10, 15, 20];
    // Do not show extra auto-timer button, just show preset and custom buttons

    return (
      <View style={styles.cookingContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepCounter}>
            {String(`${safeT('cookingMode.step', 'Step')} ${currentStep + 1} ${safeT('cookingMode.of', 'of')} ${recipe?.instructions?.length || 0}`)}
          </Text>
          <View style={styles.stepProgress}>
            <View style={[
              styles.stepProgressFill,
              { width: `${Math.round(((currentStep + 1) / (recipe?.instructions?.length || 1)) * 100)}%` }
            ]} />
          </View>
        </View>
        <Animated.View style={[styles.stepContent, stepAnimatedStyle]}>
          <ScrollView style={styles.stepText} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepInstruction}>
              {String(typeof stepText === 'string' && stepText.length > 0 ? stepText : safeT('cookingMode.noInstructions', 'No instructions available'))}
            </Text>
          </ScrollView>
        </Animated.View>
        {/* Timer Section */}
        <View style={styles.timerSection}>
          <View style={styles.timerHeader}>
            <Text style={styles.timerLabel}>{safeT('cookingMode.timer', 'Timer')}</Text>
            {hasAutoStartedTimer && stepTimer && typeof stepTimer === 'number' && stepTimer > 0 ? (
              <View style={styles.autoTimerBadge}>
                <Text style={styles.autoTimerBadgeText}>
                  {String(`${safeT('cookingMode.autoTimer', 'Auto Timer')} (${stepTimer}m)`)}
                </Text>
              </View>
            ) : null}
          </View>
          <Animated.View style={[styles.timerDisplay, timerAnimatedStyle]}>
            <Text style={[styles.timerText, { color: getTimerColor() }]}>{String(formatTime(timerSeconds))}</Text>
          </Animated.View>
          <View style={styles.timerControls}>
            {presetMinutes.map(min => (
              <TouchableOpacity
                key={min}
                style={[styles.timerButton, styles.timerButtonSmall]}
                onPress={() => startTimer(min)}
              >
                <Text style={styles.timerButtonText}>{String(min)}m</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.timerMainControls}>
            {isTimerRunning ? (
              <TouchableOpacity style={styles.timerStopButton} onPress={stopTimer}>
                <Text style={styles.timerStopButtonText}>{safeT('cookingMode.stopTimer', 'Stop Timer')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.timerResetButton} onPress={resetTimer}>
                <Text style={styles.timerResetButtonText}>{safeT('cookingMode.resetTimer', 'Reset Timer')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderCompletedScreen = () => (
    <View style={styles.completedContainer}>
      <View style={styles.completedContent}>
        {dishPhoto ? (
          <View style={styles.dishPhotoContainer}>
            <Image source={{ uri: dishPhoto }} style={styles.dishPhoto} />
          </View>
        ) : (
          <View style={styles.completedIcon}>
            <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke={colors.success} strokeWidth={2} />
              <Path
                d="M9 12L11 14L15 10"
                stroke={colors.success}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        )}
        <Text style={styles.completedTitle}>{safeT('cookingMode.congratulations', 'Congratulations!')}</Text>
        <Text style={styles.completedSubtitle}>
          {String(`${safeT('cookingMode.youHaveCompleted', 'You have completed')} ${recipe?.title || safeT('cookingMode.theRecipe', 'the recipe')}!`)}
        </Text>
        <Text style={styles.completedMessage}>
          {safeT('cookingMode.enjoyMeal', 'Enjoy your meal and bon appétit!')}
        </Text>
      </View>
    </View>
  );

  // Helper function for header subtitle with proper fallbacks
  const getHeaderSubtitle = useCallback(() => {
    switch (currentPhase) {
      case 'preparation':
        return safeT('cookingMode.preparation', 'Preparation');
      case 'cooking':
        return safeT('cookingMode.cooking', 'Cooking');
      case 'completed':
        return safeT('cookingMode.completed', 'Completed');
      default:
        return 'Phase';
    }
  }, [currentPhase, safeT]);

  const headerSubtitle = getHeaderSubtitle();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19L5 12L12 5"
              stroke={colors.text}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{String(recipe?.title || 'Ricetta')}</Text>
          <Text style={styles.headerSubtitle}>{String(headerSubtitle)}</Text>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, phaseAnimatedStyle]}>
        {currentPhase === 'preparation' && renderIngredientsList()}
        {currentPhase === 'cooking' && renderCookingSteps()}
        {currentPhase === 'completed' && renderCompletedScreen()}
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        {currentPhase === 'preparation' && (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !allIngredientsChecked && styles.primaryButtonDisabled
            ]}
            onPress={startCooking}
            disabled={!allIngredientsChecked}
          >
            <Text style={[
              styles.primaryButtonText,
              !allIngredientsChecked && styles.primaryButtonTextDisabled
            ]}>
              {safeT('cookingMode.startCooking', 'Start Cooking')}
            </Text>
          </TouchableOpacity>
        )}

        {currentPhase === 'cooking' && (
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
              onPress={prevStep}
              disabled={currentStep === 0}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M12 19L5 12L12 5"
                  stroke={currentStep === 0 ? colors.border : colors.text}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[
                styles.navButtonText,
                currentStep === 0 && styles.navButtonTextDisabled
              ]}>
                {safeT('cookingMode.previous', 'Previous')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={nextStep}
            >
              <Text style={styles.navButtonText}>
                {String(currentStep === (recipe?.instructions?.length || 1) - 1
                  ? safeT('cookingMode.finish', 'Finish')
                  : safeT('cookingMode.next', 'Next')
                )}
              </Text>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12H19M12 5L19 12L12 19"
                  stroke={colors.text}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        )}

        {currentPhase === 'completed' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onFinishCooking}
          >
            <Text style={styles.primaryButtonText}>
              {safeT('cookingMode.backToRecipes', 'Back to Recipes')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{safeT('cookingMode.exitTitle', 'Exit cooking?')}</Text>
            <Text style={styles.modalMessage}>{safeT('cookingMode.exitMessage', 'Are you sure you want to exit cooking mode? Your progress will be lost.')}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>{safeT('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setShowExitModal(false);
                  onGoBack();
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>{safeT('cookingMode.exitConfirm', 'Exit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Finish Cooking Modal */}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{safeT('cookingMode.finishTitle', 'Complete cooking')}</Text>
            <Text style={styles.modalMessage}>{safeT('cookingMode.finishMessage', 'Congratulations! You finished cooking. Do you want to save this recipe to your dishes?')}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowFinishModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>{safeT('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={finishCooking}
              >
                <Text style={styles.modalButtonTextPrimary}>{safeT('cookingMode.finishConfirm', 'Save to my dishes')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        visible={showPhotoModal}
        onClose={handlePhotoModalClose}
        onPhotoSelected={handlePhotoSelected}
        onSkip={handleSkipPhoto}
        recipeId={recipe?.id || recipe?._id}
        onUploadComplete={handlePhotoUploadComplete}
        onUploadError={handlePhotoUploadError}
      />
      {/* Auto Timer Notification Modal */}
      <NotificationModal
        visible={showAutoTimerModal}
        type="success"
        title={safeT('cookingMode.autoTimerTitle', 'Auto Timer Started')}
        message={`${safeT('cookingMode.timerStartedFor', 'Timer started for')} ${typeof autoTimerMinutes === 'number' ? autoTimerMinutes : 0} ${safeT('cookingMode.minutes', 'minutes')}`}
        onClose={() => setShowAutoTimerModal(false)}
      />
      
      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },

  // Ingredients Phase
  ingredientsContainer: {
    flex: 1,
    padding: 20,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  phaseSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  ingredientsList: {
    flex: 1,
    marginBottom: 20,
  },
  ingredientItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ingredientItemChecked: {
    backgroundColor: colors.card,
    borderColor: colors.success,
    borderWidth: 1,
  },
  ingredientContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  ingredientText: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ingredientNameChecked: {
    color: colors.success,
    textDecorationLine: 'line-through',
  },
  ingredientAmount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ingredientAmountChecked: {
    color: colors.success,
    textDecorationLine: 'line-through',
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  // Cooking Phase
  cookingContainer: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    marginBottom: 20,
  },
  stepCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepProgress: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepText: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'left',
  },

  // Timer Section
  timerSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  autoTimerBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  autoTimerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  timerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  timerButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timerButtonText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
  timerMainControls: {
    alignItems: 'center',
  },
  timerStopButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timerStopButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  timerResetButton: {
    backgroundColor: colors.textSecondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timerResetButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  timerButtonStep: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    width: '100%',
  },

  // Completed Phase
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completedContent: {
    alignItems: 'center',
  },
  completedIcon: {
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
    marginBottom: 12,
  },
  completedSubtitle: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  completedMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dishPhotoContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dishPhoto: {
    width: 200,
    height: 150,
    borderRadius: 16,
  },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: colors.textSecondary,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonDisabled: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: colors.border,
  },

  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.buttonText,
  },

});