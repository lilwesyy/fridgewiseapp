import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useStatistics } from '../../hooks/useStatistics';
import { ShareModal } from '../modals/ShareModal';
import { HapticService } from '../../services/hapticService';
import HapticTouchableOpacity from '../common/HapticTouchableOpacity';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LogoComponent } from '../ui/LogoComponent';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES, ANIMATION_DELAYS, SCALE_VALUES } from '../../constants/animations';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigateToCamera: () => void;
  onSelectRecipe?: (recipe: any, allRecipes: any[], index: number) => void;
}


export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToCamera, onSelectRecipe }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { statistics, isLoading: statsLoading, recentRecipes, isLoadingRecipes, refreshStatistics } = useStatistics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  // Calculate safe area top offset for pull-to-refresh
  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      // Use Constants.statusBarHeight for iOS, fallback to 44 for devices with notch
      const statusBarHeight = Constants.statusBarHeight;
      // For devices without notch (like iPhone 8), statusBarHeight is 20
      // For devices with notch (like iPhone X and newer), it's around 44-50
      return statusBarHeight > 20 ? statusBarHeight : 44;
    }
    return StatusBar.currentHeight || 0;
  };

  const fadeIn = useSharedValue(0);
  const slideIn = useSharedValue(50);
  const scale = useSharedValue(0.8);
  const buttonScale = useSharedValue(1);
  const logoScale = useSharedValue(1);
  const cardScales = Array.from({ length: 4 }, () => useSharedValue(0.8));
  const cardOpacities = Array.from({ length: 4 }, () => useSharedValue(0));
  const tipCardScale = useSharedValue(0.9);
  const tipCardOpacity = useSharedValue(0);
  const statsScale = useSharedValue(0.95);
  const statsOpacity = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);

    // Main content entrance - iOS standard timing
    fadeIn.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    slideIn.value = withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    scale.value = withSpring(1, SPRING_CONFIGS.GENTLE);

    // Logo pulse effect - more subtle, iOS-like
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: ANIMATION_DURATIONS.STANDARD * 3, easing }),
        withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD * 3, easing })
      ),
      -1,
      false
    );

    // Stagger card animations - iOS standard timing
    cardScales.forEach((cardScale, index) => {
      cardScale.value = withDelay(
        ANIMATION_DELAYS.LIST_BASE + index * ANIMATION_DELAYS.LIST_ITEM,
        withSpring(1, SPRING_CONFIGS.LIST)
      );
    });

    cardOpacities.forEach((cardOpacity, index) => {
      cardOpacity.value = withDelay(
        ANIMATION_DELAYS.LIST_BASE + index * ANIMATION_DELAYS.LIST_ITEM,
        withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing })
      );
    });

    // Animate tip card - iOS delay pattern
    tipCardScale.value = withDelay(
      ANIMATION_DELAYS.LIST_BASE + ANIMATION_DELAYS.STAGGER_3,
      withSpring(1, SPRING_CONFIGS.LIST)
    );
    tipCardOpacity.value = withDelay(
      ANIMATION_DELAYS.LIST_BASE + ANIMATION_DELAYS.STAGGER_3,
      withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing })
    );

    // Animate stats section - earlier entry for better UX
    statsScale.value = withDelay(
      ANIMATION_DELAYS.STAGGER_1,
      withSpring(1, SPRING_CONFIGS.LIST)
    );
    statsOpacity.value = withDelay(
      ANIMATION_DELAYS.STAGGER_1,
      withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing })
    );
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('home.goodMorning');
    if (hour >= 12 && hour < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const getRandomQuote = () => {
    const quoteKeys = [
      'home.quote1',
      'home.quote2',
      'home.quote3',
      'home.quote4',
      'home.quote5'
    ];

    // Use date as seed for consistent quote during the same day
    const today = new Date();
    const seed = today.getDate() + today.getMonth() + today.getFullYear();
    const randomIndex = seed % quoteKeys.length;

    return t(quoteKeys[randomIndex]);
  };

  const userName = user?.name || user?.email?.split('@')[0] || t('home.user');

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [
      { translateY: slideIn.value },
      { scale: scale.value },
    ],
  }));

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: withDelay(ANIMATION_DELAYS.STAGGER_1, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD })),
    transform: [
      {
        translateY: withDelay(ANIMATION_DELAYS.STAGGER_1, withTiming(0, {
          duration: ANIMATION_DURATIONS.STANDARD,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
        }))
      },
    ],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    opacity: withDelay(ANIMATION_DELAYS.STAGGER_2, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD })),
    transform: [
      { scale: withDelay(ANIMATION_DELAYS.STAGGER_2, withSpring(1, SPRING_CONFIGS.GENTLE)) },
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
    ],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
    ],
  }));

  const createCardStyle = (index: number) => useAnimatedStyle(() => ({
    opacity: cardOpacities[index].value,
    transform: [
      { scale: cardScales[index].value },
      {
        translateY: interpolate(
          cardOpacities[index].value,
          [0, 1],
          [30, 0]
        )
      },
    ],
  }));

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: withDelay(ANIMATION_DELAYS.STAGGER_3, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD })),
    transform: [
      {
        translateY: withDelay(ANIMATION_DELAYS.STAGGER_3, withTiming(0, {
          duration: ANIMATION_DURATIONS.STANDARD,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
        }))
      },
    ],
  }));

  const tipCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tipCardOpacity.value,
    transform: [
      { scale: tipCardScale.value },
      {
        translateY: interpolate(
          tipCardOpacity.value,
          [0, 1],
          [20, 0]
        )
      },
    ],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [
      { scale: statsScale.value },
      {
        translateY: interpolate(
          statsOpacity.value,
          [0, 1],
          [15, 0]
        )
      },
    ],
  }));

  const handleCameraPress = () => {
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 20, stiffness: 300 }),
      withSpring(1, { damping: 20, stiffness: 300 })
    );
    onNavigateToCamera();
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(SCALE_VALUES.BUTTON_PRESS, SPRING_CONFIGS.BUTTON);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, SPRING_CONFIGS.BUTTON);
  };

  const handleRefresh = async () => {
    HapticService.refreshTriggered();
    setIsRefreshing(true);
    try {
      await refreshStatistics();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRecipePress = (recipe: any, index: number) => {
    if (onSelectRecipe) {
      // Convert MongoDB _id to id format expected by RecipeScreen
      const convertedRecipe = {
        ...recipe,
        id: recipe._id
      };

      // Convert all recipes in the array for navigation
      const convertedRecipes = recentRecipes.map(r => ({
        ...r,
        id: r._id
      }));

      onSelectRecipe(convertedRecipe, convertedRecipes, index);
    }
  };

  const handleShareRecipe = (recipe: any, event: any) => {
    event.stopPropagation(); // Prevent opening recipe detail
    const convertedRecipe = {
      ...recipe,
      id: recipe._id
    };
    setSelectedRecipe(convertedRecipe);
    setShowShareModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView
      style={[styles.container, animatedStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          progressViewOffset={getStatusBarHeight()}
        />
      }
    >
      {/* Welcome Banner */}
      <Animated.View style={[styles.welcomeBanner, bannerStyle]}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Text style={{ ...styles.greeting, color: '#fff' }}>{getGreeting()}</Text>
            <Text style={{ ...styles.userName, color: '#fff' }}>{userName}!</Text>
            <Text style={{ ...styles.bannerQuote, color: '#fff' }}>{getRandomQuote()}</Text>
          </View>
          <Animated.View style={[styles.bannerRight, logoAnimatedStyle]}>
            <LogoComponent width={80} height={72} color="#fff" />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Quick Stats */}
      <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {statsLoading ? '...' : statistics?.recipesCreated || 0}
          </Text>
          <Text style={styles.statLabel}>{t('home.recipesCreated')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {statsLoading ? '...' : statistics?.ingredientsScanned || 0}
          </Text>
          <Text style={styles.statLabel}>{t('home.ingredientsScanned')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {statsLoading ? '...' : statistics?.favoriteRecipes || 0}
          </Text>
          <Text style={styles.statLabel}>{t('home.favoriteRecipes')}</Text>
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View style={[styles.section, actionStyle]}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <Animated.View style={buttonAnimatedStyle}>
          <HapticTouchableOpacity
            hapticType="primary"
            activeOpacity={0.8}
            style={styles.primaryAction}
            onPress={handleCameraPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={32} color="white" />
            </View>
            <View style={styles.actionContent}>
              <Text style={{ ...styles.actionTitle, color: 'white' }}>{t('home.scanFridge')}</Text>
              <Text style={{ ...styles.actionDescription, color: 'rgba(255,255,255,0.8)' }}>{t('home.scanDescription')}</Text>
            </View>
            <Text style={{ ...styles.actionArrow, color: 'white' }}>→</Text>
          </HapticTouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Recent Saved Recipes */}
      {recentRecipes.length > 0 && (
        <Animated.View style={[styles.section, featuresStyle]}>
          <Text style={styles.sectionTitle}>{t('home.recentRecipes')}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesScrollContainer}
          >
            {isLoadingRecipes ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={[styles.recipeCard, styles.recipeCardSkeleton]}>
                  <View style={styles.recipeSkeleton} />
                </View>
              ))
            ) : (
              recentRecipes.map((recipe, index) => {
                // Debug log to check dish photo data
                const firstPhoto = recipe.dishPhotos?.[0];
                if (firstPhoto?.url) {
                  console.log(`[HomeScreen] Recipe "${recipe.title}" has dish photo:`, firstPhoto.url);
                } else {
                  console.log(`[HomeScreen] Recipe "${recipe.title}" has no dish photo`);
                }

                return (
                  <HapticTouchableOpacity hapticType="light" activeOpacity={0.7} key={recipe._id} style={styles.recipeCard} onPress={() => handleRecipePress(recipe, index)}>
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
                        <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                        <HapticTouchableOpacity hapticType="light" activeOpacity={0.7}
                          style={styles.recipeShareButton}
                          onPress={(event) => handleShareRecipe(recipe, event)}
                        >
                          <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
                        </HapticTouchableOpacity>
                      </View>
                      <Text style={styles.recipeDetails}>
                        {recipe.cookingTime} min • {recipe.servings} {t('recipe.servings')}
                      </Text>
                      <View style={styles.recipeTags}>
                        <Text style={styles.difficultyTag}>{t(`recipe.difficulty.${recipe.difficulty}`)}</Text>
                        {recipe.dietaryTags.length > 0 && (
                          <Text style={styles.dietaryTag}>{recipe.dietaryTags[0]}</Text>
                        )}
                      </View>
                    </View>
                  </HapticTouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* Features Overview */}
      <Animated.View style={[styles.section, featuresStyle]}>
        <Text style={styles.sectionTitle}>{t('home.featuresTitle')}</Text>

        <View style={styles.featuresGrid}>
          <Animated.View style={[styles.featureCard, createCardStyle(0)]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="scan-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{t('home.aiRecognition')}</Text>
            <Text style={styles.featureDescription}>{t('home.aiDescription')}</Text>
          </Animated.View>

          <Animated.View style={[styles.featureCard, createCardStyle(1)]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="book-outline" size={24} color={colors.success} />
            </View>
            <Text style={styles.featureTitle}>{t('home.smartRecipes')}</Text>
            <Text style={styles.featureDescription}>{t('home.recipesDescription')}</Text>
          </Animated.View>

          <Animated.View style={[styles.featureCard, createCardStyle(2)]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="bookmark-outline" size={24} color={colors.warning} />
            </View>
            <Text style={styles.featureTitle}>{t('home.saveRecipes')}</Text>
            <Text style={styles.featureDescription}>{t('home.saveDescription')}</Text>
          </Animated.View>

          <Animated.View style={[styles.featureCard, createCardStyle(3)]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{t('home.personalizedExperience')}</Text>
            <Text style={styles.featureDescription}>{t('home.personalizedDescription')}</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Tips Section */}
      <Animated.View style={[styles.section, featuresStyle]}>
        <Text style={styles.sectionTitle}>{t('home.tipsTitle')}</Text>

        <Animated.View style={[styles.tipCard, tipCardAnimatedStyle]}>
          <View style={styles.tipIcon}>
            <Text style={styles.tipEmoji}>💡</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{t('home.tipTitle')}</Text>
            <Text style={styles.tipDescription}>{t('home.tipDescription')}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      <ShareModal
        visible={showShareModal}
        recipe={selectedRecipe}
        onClose={() => {
          setShowShareModal(false);
          setSelectedRecipe(null);
        }}
      />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeBanner: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerRight: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: colors.buttonText,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  bannerQuote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
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
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  actionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.buttonText,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionArrow: {
    fontSize: 24,
    color: colors.buttonText,
    fontWeight: 'bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    width: (width - 56) / 2,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    borderRadius: 12,
    padding: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 32,
  },
  tipIcon: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
    overflow: 'hidden', // Ensure image respects border radius
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