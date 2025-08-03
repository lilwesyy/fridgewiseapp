import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Image } from 'expo-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StarRating } from '../../../ui/StarRating';
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
  id?: string;
  _id?: string;
  title: string;
  description: string;
  dietaryTags?: string[];
  cookedAt?: string;
  createdAt?: string;
  averageRating?: number;
  totalRatings?: number;
  isPublicRecipe?: boolean;
  userId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  };
  originalCreator?: {
    _id: string;
    name: string;
    email: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  };
}

interface RecipeContentProps {
  recipe: Recipe;
  isPublic?: boolean;
  user?: any;
}

export const RecipeContent: React.FC<RecipeContentProps> = ({
  recipe,
  isPublic = false,
  user
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    titleOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    titleTranslateY.value = withDelay(150, withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
  }, [recipe.id]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, titleAnimatedStyle]}>
      {/* Rating stars above title - Only for public recipes */}
      {isPublic && (
        <View style={styles.titleRatingContainer}>
          <StarRating
            rating={recipe.averageRating || 0}
            size={20}
            color="#FFD700"
            emptyColor="#E5E5E5"
          />
          <Text style={styles.titleRatingText}>
            ({recipe.totalRatings || 0})
          </Text>
        </View>
      )}

      <View style={styles.titleSection}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        
        {/* Badge per ricette pubbliche salvate */}
        {recipe.isPublicRecipe && !isPublic && (
          <View style={styles.publicRecipeBadge}>
            <Text style={styles.publicRecipeEmoji}>🌟</Text>
            <Text style={styles.publicRecipeText}>
              {t('saved.publicRecipe')}
            </Text>
            {recipe.originalCreator?.name && (
              <Text style={styles.publicRecipeCreator}>
                • {recipe.originalCreator.name}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Dietary Tags under title */}
      {(recipe.dietaryTags && recipe.dietaryTags.length > 0) && (
        <View style={styles.dietaryTags}>
          {(recipe.dietaryTags || []).map((tag) => (
            <View key={tag} style={styles.dietaryTag}>
              <Text style={styles.dietaryTagText}>
                {t(`recipes.dietary.${tag.replace('-', '')}`)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.recipeDescription}>{recipe.description}</Text>

      {/* AI-Generated Content Disclaimer */}
      <View style={styles.aiDisclaimer}>
        <View style={styles.aiDisclaimerHeader}>
          <Ionicons name="sparkles-outline" size={16} color={colors.primary} style={styles.aiIcon} />
          <Text style={styles.aiDisclaimerTitle}>{t('recipe.aiGenerated')}</Text>
        </View>
        <Text style={styles.aiDisclaimerText}>{t('recipe.aiDisclaimerText')}</Text>
      </View>

      {/* Recipe Creator Card - For public recipes and saved public recipes */}
      {(isPublic || recipe.isPublicRecipe) && (recipe.userId || recipe.originalCreator) && (
        <View style={styles.cookedByUserCard}>
          {(() => {
            // Use originalCreator if available (for saved public recipes), otherwise use userId
            const creator = recipe.originalCreator || recipe.userId;
            if (!creator) return null;

            return (
              <>
                <View style={styles.userAvatar}>
                  {creator.avatar?.url ? (
                    <Image
                      source={{ uri: creator.avatar.url }}
                      style={styles.userAvatarImage}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                    />
                  ) : (
                    <Text style={styles.userAvatarText}>
                      {creator.name?.charAt(0).toUpperCase() || 'C'}
                    </Text>
                  )}
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.creatorLabel}>
                    {t('recipe.createdBy')}
                  </Text>
                  <Text style={styles.userName}>
                    {creator.name || 'Chef'}
                    {user && creator._id === user.id && (
                      <Text style={styles.youLabel}> ({t('common.you')})</Text>
                    )}
                  </Text>
                </View>
                <Text style={styles.cookedDate}>
                  {new Date(recipe.createdAt || Date.now()).toLocaleDateString()}
                </Text>
              </>
            );
          })()}
        </View>
      )}

      {/* Indicatore "Già cucinato" con foto */}
      {recipe.cookedAt && (
        <View style={styles.cookedIndicator}>
          <View style={styles.cookedIndicatorHeader}>
            <View style={styles.cookedIndicatorInfo}>
              <View style={styles.cookedIndicatorTitleRow}>
                <Text style={styles.cookedIndicatorEmoji}>👨‍🍳</Text>
                <Text style={styles.cookedIndicatorTitle}>{t('recipe.alreadyCooked')}</Text>
              </View>
              <Text style={styles.cookedIndicatorDate}>
                {new Date(recipe.cookedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
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
  titleRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  titleRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  titleSection: {
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  publicRecipeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  publicRecipeEmoji: {
    fontSize: 12,
    marginRight: 6,
  },
  publicRecipeText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  publicRecipeCreator: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    fontWeight: '500',
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  dietaryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dietaryTagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  aiDisclaimer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  aiDisclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiIcon: {
    marginRight: 6,
  },
  aiDisclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.1,
  },
  aiDisclaimerText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  cookedByUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  creatorLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: -0.1,
  },
  cookedDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  youLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.primary,
  },
  cookedIndicator: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: colors.success + '15',
    borderColor: colors.success,
  },
  cookedIndicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cookedIndicatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cookedIndicatorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cookedIndicatorEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  cookedIndicatorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    letterSpacing: -0.1,
  },
  cookedIndicatorDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginLeft: 16,
  },
});