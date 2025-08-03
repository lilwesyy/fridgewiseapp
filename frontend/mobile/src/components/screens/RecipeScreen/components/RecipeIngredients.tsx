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

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface RecipeIngredientsProps {
  ingredients: Ingredient[];
}

export const RecipeIngredients: React.FC<RecipeIngredientsProps> = ({
  ingredients
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const ingredientsOpacity = useSharedValue(0);
  const ingredientsTranslateY = useSharedValue(40);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    ingredientsOpacity.value = withDelay(450, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    ingredientsTranslateY.value = withDelay(450, withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
  }, []);

  const ingredientsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ingredientsOpacity.value,
    transform: [{ translateY: ingredientsTranslateY.value }],
  }));

  const renderIngredient = (ingredient: Ingredient, index: number) => (
    <View key={index} style={styles.ingredientItem}>
      <Text style={styles.ingredientAmount}>
        {ingredient.amount} {ingredient.unit}
      </Text>
      <Text style={styles.ingredientName}>
        {ingredient.name}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[styles.container, ingredientsAnimatedStyle]}>
      <Text style={styles.sectionTitle}>{t('recipe.ingredients')}</Text>
      <View style={styles.ingredientsList}>
        {ingredients.map(renderIngredient)}
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  ingredientAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    width: 80,
    marginRight: 12,
    letterSpacing: -0.1,
  },
  ingredientName: {
    fontSize: 16,
    color: '#1D1D1F',
    flex: 1,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});