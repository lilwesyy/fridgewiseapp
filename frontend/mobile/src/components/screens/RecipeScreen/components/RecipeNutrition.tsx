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

interface Nutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface RecipeNutritionProps {
  nutrition: Nutrition;
  servings: number;
}

export const RecipeNutrition: React.FC<RecipeNutritionProps> = ({
  nutrition,
  servings
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const nutritionOpacity = useSharedValue(0);
  const nutritionTranslateY = useSharedValue(30);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    nutritionOpacity.value = withDelay(375, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    nutritionTranslateY.value = withDelay(375, withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
  }, []);

  const nutritionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nutritionOpacity.value,
    transform: [{ translateY: nutritionTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, nutritionAnimatedStyle]}>
      <Text style={styles.sectionTitle}>{t('recipe.nutrition')}</Text>
      <View style={styles.nutritionContainer}>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>
              {nutrition.calories}
            </Text>
            <Text style={styles.nutritionLabel}>{t('nutrition.calories')}</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: '#10B981' }]}>
              {nutrition.protein}g
            </Text>
            <Text style={styles.nutritionLabel}>{t('nutrition.protein')}</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: '#F59E0B' }]}>
              {nutrition.carbohydrates}g
            </Text>
            <Text style={styles.nutritionLabel}>{t('nutrition.carbs')}</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: '#EF4444' }]}>
              {nutrition.fat}g
            </Text>
            <Text style={styles.nutritionLabel}>{t('nutrition.fat')}</Text>
          </View>
        </View>
        
        <View style={styles.nutritionSecondaryGrid}>
          <View style={styles.nutritionSecondaryItem}>
            <Text style={styles.nutritionSecondaryValue}>{nutrition.fiber}g</Text>
            <Text style={styles.nutritionSecondaryLabel}>{t('nutrition.fiber')}</Text>
          </View>
          <View style={styles.nutritionSecondaryItem}>
            <Text style={styles.nutritionSecondaryValue}>{nutrition.sugar}g</Text>
            <Text style={styles.nutritionSecondaryLabel}>{t('nutrition.sugar')}</Text>
          </View>
          <View style={styles.nutritionSecondaryItem}>
            <Text style={styles.nutritionSecondaryValue}>{nutrition.sodium}mg</Text>
            <Text style={styles.nutritionSecondaryLabel}>{t('nutrition.sodium')}</Text>
          </View>
        </View>
        
        <Text style={styles.nutritionNote}>
          {t('nutrition.perServing', { servings })}
        </Text>
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  nutritionContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 0,
    backgroundColor: '#F2F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionSecondaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(60, 60, 67, 0.29)',
    marginBottom: 16,
  },
  nutritionSecondaryItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  nutritionSecondaryValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1D1D1F',
    letterSpacing: -0.1,
  },
  nutritionSecondaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nutritionNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#6B7280',
    fontWeight: '400',
  },
});