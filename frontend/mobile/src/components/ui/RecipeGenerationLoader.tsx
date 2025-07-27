import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingAnimation } from './LoadingAnimation';
import { ANIMATION_DURATIONS } from '../../constants/animations';

interface RecipeGenerationLoaderProps {
  visible: boolean;
}

export const RecipeGenerationLoader: React.FC<RecipeGenerationLoaderProps> = ({ visible }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = new Animated.Value(0);

  const steps = [
    t('recipe.generating'),
    t('recipe.analyzingIngredients'),
    t('recipe.creatingRecipe'),
    t('recipe.finalizing'),
  ];

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATIONS.STANDARD,
        useNativeDriver: true,
      }).start();

      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, ANIMATION_DURATIONS.LOADING * 4); // 1600ms instead of 2000ms

      return () => clearInterval(interval);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATIONS.STANDARD,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <LoadingAnimation size={80} />
        <Text style={styles.title}>{t('recipe.generatingTitle')}</Text>
        <Text style={styles.subtitle}>{steps[currentStep]}</Text>
        
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentStep === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.primary,
  },
});