import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { StarRating } from '../../../ui/StarRating';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  SPRING_CONFIGS, 
  EASING_CURVES 
} from '../../../../constants/animations';

interface DishPhoto {
  url: string;
  publicId: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  language: 'en' | 'it';
  dishPhoto?: DishPhoto;
  dishPhotos?: DishPhoto[];
  cookedAt?: string;
  completionCount?: number;
  createdAt: string;
  isSaved?: boolean;
  averageRating?: number;
  totalRatings?: number;
}

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onPress: () => void;
  onDelete?: () => void;
  onPhotoPress: (imageUrl: string, title: string) => void;
  isPublic?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  index,
  onPress,
  onDelete,
  onPhotoPress,
  isPublic = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );
    const delay = ANIMATION_DURATIONS.CONTENT + (index * 50);
    
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    cardScale.value = withDelay(delay, withSpring(1, SPRING_CONFIGS.STANDARD));
    cardTranslateY.value = withDelay(delay, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, [index]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value }
    ],
  }));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#22C55E'; // Verde più soft
      case 'medium':
        return '#F59E0B'; // Arancione più soft
      case 'hard':
        return '#EF4444'; // Rosso più soft
      default:
        return '#6B7280'; // Grigio neutro
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isRecipePublic = () => {
    return isPublic || (recipe.isSaved && ((recipe.dishPhotos && recipe.dishPhotos.length > 0) || recipe.cookedAt));
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
          <View style={[
            styles.difficultyBadge, 
            { 
              backgroundColor: getDifficultyColor(recipe.difficulty) + '15',
              borderColor: getDifficultyColor(recipe.difficulty) + '30'
            }
          ]}>
            <Text style={[
              styles.difficultyText, 
              { color: getDifficultyColor(recipe.difficulty) }
            ]}>
              {t(`recipes.difficulty.${recipe.difficulty}`)}
            </Text>
          </View>
        </View>

        <Text style={styles.recipeDescription} numberOfLines={3}>
          {recipe.description}
        </Text>

        <View style={styles.recipeMetadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>
              ⏱️ {recipe.cookingTime} min
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>
              👥 {recipe.servings}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>
              🥘 {recipe.ingredients?.length || 0} {t('recipe.ingredients')}
            </Text>
          </View>
          {!!(recipe.completionCount && recipe.completionCount > 0) && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>
                🍽️ {recipe.completionCount}x {t('recipes.cooked')}
              </Text>
            </View>
          )}
        </View>

        {!!(recipe.dietaryTags && recipe.dietaryTags.length > 0) && (
          <View style={styles.dietaryTags}>
            {recipe.dietaryTags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.dietaryTag}>
                <Text style={styles.dietaryTagText}>
                  {t(`recipes.dietary.${tag.replace('-', '')}`)}
                </Text>
              </View>
            ))}
            {!!(recipe.dietaryTags && recipe.dietaryTags.length > 3) && (
              <Text style={styles.moreTagsText}>+{recipe.dietaryTags.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.recipeFooter}>
          <Text style={styles.recipeDate}>{formatDate(recipe.createdAt)}</Text>
          {isRecipePublic() && (
            <View style={styles.ratingContainer}>
              <StarRating
                rating={recipe.averageRating || 0}
                size={16}
                color="#FFD700"
                emptyColor="#E5E5E5"
              />
              <Text style={styles.ratingText}>
                ({recipe.totalRatings || 0})
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 14,
    fontWeight: '400',
    letterSpacing: -0.05,
  },
  recipeMetadata: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metadataItem: {
    marginRight: 16,
    marginBottom: 4,
  },
  metadataLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dietaryTag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  dietaryTagText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.05,
  },
  moreTagsText: {
    fontSize: 11,
    color: '#6B7280',
    alignSelf: 'center',
    fontWeight: '500',
  },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  recipeDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
});