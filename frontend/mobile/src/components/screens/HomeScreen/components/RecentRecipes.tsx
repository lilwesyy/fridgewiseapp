import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';  
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import HapticTouchableOpacity from '../../../common/HapticTouchableOpacity';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS,
  EASING_CURVES,
  ANIMATION_DELAYS,
} from '../../../../constants/animations';

interface RecentRecipesProps {
  recipes: any[];
  isLoading: boolean;
  onRecipePress: (recipe: any, index: number) => void;
  onShareRecipe: (recipe: any, event: any) => void;
}

export const RecentRecipes: React.FC<RecentRecipesProps> = ({
  recipes,
  isLoading,
  onRecipePress,
  onShareRecipe,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const featuresOpacity = useSharedValue(0);
  const featuresTranslateY = useSharedValue(30);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_EASE_OUT.x1,
      EASING_CURVES.IOS_EASE_OUT.y1,
      EASING_CURVES.IOS_EASE_OUT.x2,
      EASING_CURVES.IOS_EASE_OUT.y2
    );

    featuresOpacity.value = withDelay(
      ANIMATION_DELAYS.STAGGER_3,
      withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD })
    );

    featuresTranslateY.value = withDelay(
      ANIMATION_DELAYS.STAGGER_3,
      withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing })
    );
  }, []);

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
    transform: [{ translateY: featuresTranslateY.value }],
  }));

  const renderRecipeCard = (recipe: any, index: number) => {
    const firstPhoto = recipe.dishPhotos?.[0];
    
    return (
      <HapticTouchableOpacity
        hapticType="light"
        activeOpacity={0.7}
        key={recipe._id}
        style={styles.recipeCard}
        onPress={() => onRecipePress(recipe, index)}
      >
        <View style={styles.recipeImagePlaceholder}>
          {firstPhoto?.url ? (
            <Image
              source={{ uri: firstPhoto.url }}
              style={styles.recipeImage}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="book" size={32} color={colors.success} />
          )}
        </View>
        <View style={styles.recipeInfo}>
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeTitle} numberOfLines={2}>
              {recipe.title}
            </Text>
            <HapticTouchableOpacity
              hapticType="light"
              activeOpacity={0.7}
              style={styles.recipeShareButton}
              onPress={(event) => onShareRecipe(recipe, event)}
            >
              <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            </HapticTouchableOpacity>
          </View>
          <Text style={styles.recipeDetails}>
            {recipe.cookingTime} min • {recipe.servings} {t('recipe.servings')}
          </Text>
          <View style={styles.recipeTags}>
            <Text style={styles.difficultyTag}>
              {t(`recipe.difficulty.${recipe.difficulty}`)}
            </Text>
            {recipe.dietaryTags.length > 0 && (
              <Text style={styles.dietaryTag}>{recipe.dietaryTags[0]}</Text>
            )}
          </View>
        </View>
      </HapticTouchableOpacity>
    );
  };

  const renderLoadingSkeleton = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <View key={index} style={[styles.recipeCard, styles.recipeCardSkeleton]}>
        <View style={styles.recipeSkeleton} />
      </View>
    ));
  };

  return (
    <Animated.View style={[styles.section, featuresStyle]}>
      <Text style={styles.sectionTitle}>{t('home.recentRecipes')}</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recipesScrollContainer}
      >
        {isLoading ? renderLoadingSkeleton() : recipes.map(renderRecipeCard)}
      </ScrollView>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  recipesScrollContainer: {
    paddingRight: 20,
  },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeCardSkeleton: {
    backgroundColor: colors.card,
  },
  recipeSkeleton: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 120,
  },
  recipeImagePlaceholder: {
    backgroundColor: colors.card,
    borderRadius: 8,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  recipeShareButton: {
    padding: 4,
    borderRadius: 4,
  },
  recipeDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  difficultyTag: {
    backgroundColor: colors.card,
    color: colors.primary,
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  dietaryTag: {
    backgroundColor: colors.card,
    color: colors.success,
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
});