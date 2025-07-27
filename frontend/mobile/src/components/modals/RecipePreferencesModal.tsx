import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES } from '../../constants/animations';

const { height: screenHeight } = Dimensions.get('window');

interface RecipePreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (preferences: { portions: string; difficulty: string; maxTime: string }) => void;
  isGenerating?: boolean;
}

export const RecipePreferencesModal: React.FC<RecipePreferencesModalProps> = ({
  visible,
  onClose,
  onGenerate,
  isGenerating = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  // State
  const [portions, setPortions] = useState('2');
  const [difficulty, setDifficulty] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Animation values
  const modalTranslateY = useSharedValue(1000);
  const modalOpacity = useSharedValue(0);

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
      onClose();
    }, ANIMATION_DURATIONS.MODAL);
  };
  
  const handleGenerate = () => {
    onGenerate({ portions, difficulty, maxTime });
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
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              {t('recipe.preferences.servingsDescription')}
            </Text>
            <View style={styles.servingsContainer}>
              {['2', '4', '6', '8'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.servingButton,
                    { 
                      backgroundColor: colors.card,
                      borderColor: colors.border 
                    },
                    portions === num && { 
                      backgroundColor: colors.primary,
                      borderColor: colors.primary 
                    }
                  ]}
                  onPress={() => setPortions(num)}
                >
                  <Text style={[
                    styles.servingButtonText,
                    { color: colors.text },
                    portions === num && { color: colors.buttonText }
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              {t('recipe.preferences.difficultyDescription')}
            </Text>
            <View style={styles.difficultyContainer}>
              {['easy', 'medium', 'hard'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: colors.inputBorder 
                    },
                    difficulty === level && { 
                      backgroundColor: colors.success,
                      borderColor: colors.success 
                    }
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    { color: colors.text },
                    difficulty === level && { color: colors.buttonText }
                  ]}>
                    {t(`recipe.difficulty.${level}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              {t('recipe.preferences.maxTimeDescription')}
            </Text>
            <View style={styles.timeContainer}>
              {['15', '30', '45', '60', '90', '120'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: colors.inputBorder 
                    },
                    maxTime === time && { 
                      backgroundColor: colors.warning,
                      borderColor: colors.warning 
                    }
                  ]}
                  onPress={() => setMaxTime(time)}
                >
                  <Text style={[
                    styles.timeButtonText,
                    { color: colors.text },
                    maxTime === time && { color: colors.buttonText }
                  ]}>
                    {time} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // Modal animation effect
  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  // Animated styles
  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const styles = StyleSheet.create({
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
    },
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
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
      paddingHorizontal: 20,
    },
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
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    servingButtonText: {
      fontSize: 18,
      fontWeight: '600',
    },
    difficultyContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    difficultyButton: {
      borderWidth: 2,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 16,
      alignItems: 'center',
      minWidth: 90,
    },
    difficultyButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    timeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 10,
    },
    timeButton: {
      borderWidth: 2,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      alignItems: 'center',
    },
    timeButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
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
    modalBackButton: {
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
    modalBackButtonText: {
      color: colors.text,
    },
    submitButtonText: {
      color: colors.buttonText,
    },
    submitButtonTextDisabled: {
      color: colors.textSecondary,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={resetModal}
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
                (!canProceedToNextStep || (isLastStep && isGenerating)) && styles.submitButtonDisabled
              ]}
              onPress={isLastStep ? handleGenerate : handleNext}
              disabled={!canProceedToNextStep || (isLastStep && isGenerating)}
            >
              <Text style={[
                styles.buttonText,
                styles.submitButtonText,
                (!canProceedToNextStep || (isLastStep && isGenerating)) && styles.submitButtonTextDisabled
              ]}>
                {isLastStep ? (isGenerating ? t('recipe.generating') : t('recipe.generateRecipe')) : t('common.next')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};