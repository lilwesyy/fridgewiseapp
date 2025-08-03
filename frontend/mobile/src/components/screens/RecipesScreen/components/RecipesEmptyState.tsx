import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

interface RecipesEmptyStateProps {
  activeTab: 'my-recipes' | 'explore';
  hasRecipes: boolean;
  hasSearchQuery: boolean;
  hasFilters: boolean;
  isLoading: boolean;
  onGoToCamera?: () => void;
}

export const RecipesEmptyState: React.FC<RecipesEmptyStateProps> = ({
  activeTab,
  hasRecipes,
  hasSearchQuery,
  hasFilters,
  isLoading,
  onGoToCamera,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const emptyOpacity = useSharedValue(0);
  const emptyScale = useSharedValue(0.8);
  const emptyTranslateY = useSharedValue(40);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    emptyOpacity.value = withDelay(200, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    emptyScale.value = withDelay(200, withSpring(1, SPRING_CONFIGS.GENTLE));
    emptyTranslateY.value = withDelay(200, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, []);

  const emptyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value,
    transform: [
      { scale: emptyScale.value },
      { translateY: emptyTranslateY.value }
    ],
  }));

  if (isLoading) {
    return (
      <Animated.View style={[styles.emptyContainer, emptyAnimatedStyle]}>
        <Text style={styles.emptyTitle}>
          {activeTab === 'my-recipes' ? t('recipes.loading') : t('recipes.loadingCollections')}
        </Text>
      </Animated.View>
    );
  }

  const getEmptyContent = () => {
    if (activeTab === 'my-recipes') {
      if (!hasRecipes) {
        // No recipes at all
        return {
          icon: 'restaurant-outline',
          title: t('recipes.noRecipes'),
          subtitle: t('recipes.startCreating'),
          showButton: true,
          buttonText: t('recipes.scanIngredients') || 'Scansiona Ingredienti',
        };
      } else if (hasSearchQuery || hasFilters) {
        // Has recipes but search/filter returned empty
        return {
          icon: 'search-outline',
          title: t('recipes.noResults'),
          subtitle: t('recipes.tryDifferentSearch'),
          showButton: false,
        };
      }
    } else {
      // Explore tab
      if (hasSearchQuery || hasFilters) {
        return {
          icon: 'search-outline',
          title: t('recipes.noResults'),
          subtitle: t('recipes.tryDifferentSearch'),
          showButton: false,
        };
      } else {
        return {
          icon: 'restaurant-outline',
          title: t('recipes.noPublicRecipes'),
          subtitle: t('recipes.noPublicRecipesDesc'),
          showButton: false,
        };
      }
    }

    return null;
  };

  const content = getEmptyContent();
  if (!content) return null;

  return (
    <Animated.View style={[styles.emptyContainer, emptyAnimatedStyle]}>
      <View style={styles.iconContainer}>
        <Ionicons name={content.icon} size={72} color="#6B7280" />
      </View>
      
      <Text style={styles.emptyTitle}>{content.title}</Text>
      <Text style={styles.emptySubtitle}>{content.subtitle}</Text>
      
      {content.showButton && onGoToCamera && (
        <TouchableOpacity 
          activeOpacity={0.8} 
          style={styles.scanButton} 
          onPress={onGoToCamera}
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.scanButtonText}>{content.buttonText}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '400',
    letterSpacing: -0.05,
    maxWidth: 280,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 12,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.2,
  },
});