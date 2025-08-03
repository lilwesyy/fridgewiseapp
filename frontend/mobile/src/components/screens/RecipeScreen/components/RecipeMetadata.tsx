import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  EASING_CURVES 
} from '../../../../constants/animations';

interface Recipe {
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface RecipeMetadataProps {
  recipe: Recipe;
}

export const RecipeMetadata: React.FC<RecipeMetadataProps> = ({
  recipe
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    contentOpacity.value = withDelay(300, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    contentTranslateY.value = withDelay(300, withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10B981'; // green-500
      case 'medium':
        return '#F59E0B'; // amber-500
      case 'hard':
        return '#EF4444'; // red-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  return (
    <Animated.View style={[styles.container, contentAnimatedStyle]}>
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
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  metadataItem: {
    alignItems: 'center',
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  metadataValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});