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
  Image,
} from 'react-native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStatistics } from '../hooks/useStatistics';
import { ShareModal } from './ShareModal';
import Svg, { Path, G } from 'react-native-svg';
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
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES, ANIMATION_DELAYS, SCALE_VALUES } from '../constants/animations';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigateToCamera: () => void;
  onSelectRecipe?: (recipe: any, allRecipes: any[], index: number) => void;
}

const LogoComponent: React.FC<{ width?: number; height?: number; color?: string }> = ({ width = 60, height = 54, color = "#fff" }) => (
  <Svg width={width} height={height} viewBox="0 0 267 241">
    <G>
      <G>
        <Path
          opacity="0.973"
          d="m206.03101,0c3.374,0.174 6.707,0.674 10,1.5c10.926,4.018 16.26,11.852 16,23.5c-0.794,11.216 -4.294,21.549 -10.5,31c-16.359,23.467 -35.193,44.967 -56.5,64.5c-42.519,37.697 -87.186,72.531 -134,104.5c-0.333,-0.5 -0.667,-1 -1,-1.5c33.982,-64.834 73.816,-125.668 119.5,-182.5c11.309,-12.65 23.809,-23.817 37.5,-33.5c6.009,-3.684 12.342,-6.184 19,-7.5z"
          fill={color}
        />
      </G>
      <G>
        <Path
          opacity="0.94"
          d="m68.03101,26c6.552,-0.474 10.385,2.526 11.5,9c0.748,8.853 -0.252,17.519 -3,26c-10.067,28.465 -23.067,55.465 -39,81c0.267,-28.554 3.933,-56.888 11,-85c2.516,-10.198 7.016,-19.364 13.5,-27.5c1.932,-1.459 3.932,-2.625 6,-3.5z"
          fill={color}
        />
      </G>
      <G>
        <Path
          opacity="0.906"
          d="m5.03101,102c3.472,-0.537 6.305,0.463 8.5,3c1.985,6.323 3.151,12.823 3.5,19.5c-1.074,16.687 -3.408,33.187 -7,49.5c-5.431,-18.081 -8.764,-36.581 -10,-55.5c-0.284,-6.217 1.382,-11.717 5,-16.5z"
          fill={color}
        />
      </G>
      <G>
        <Path
          opacity="0.956"
          d="m241.03101,143c6.891,-0.599 13.558,0.235 20,2.5c8.351,8.935 7.684,17.268 -2,25c-12.697,8.125 -26.364,14.125 -41,18c-34.818,9.247 -70.151,15.247 -106,18c32.85,-21.763 67.516,-40.429 104,-56c8.319,-2.99 16.652,-5.49 25,-7.5z"
          fill={color}
        />
      </G>
      <G>
        <Path
          opacity="0.911"
          d="m186.03101,225c6.009,-0.166 12.009,0.001 18,0.5c6.464,0.38 10.131,3.713 11,10c-1.409,2.879 -3.743,4.545 -7,5c-22.268,1.801 -44.268,-0.032 -66,-5.5c14.501,-4.628 29.168,-7.961 44,-10z"
          fill={color}
        />
      </G>
    </G>
  </Svg>
);

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
      { translateY: withDelay(ANIMATION_DELAYS.STAGGER_1, withTiming(0, { 
        duration: ANIMATION_DURATIONS.STANDARD, 
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
      })) },
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
      { translateY: withDelay(ANIMATION_DELAYS.STAGGER_3, withTiming(0, { 
        duration: ANIMATION_DURATIONS.STANDARD, 
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
      })) },
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
            <Text style={{...styles.greeting, color: '#fff'}}>{getGreeting()}</Text>
            <Text style={{...styles.userName, color: '#fff'}}>{userName}!</Text>
            <Text style={{...styles.bannerQuote, color: '#fff'}}>{getRandomQuote()}</Text>
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
          <TouchableOpacity activeOpacity={0.7} 
            style={styles.primaryAction} 
            onPress={handleCameraPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
          <View style={styles.actionIcon}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M16 13C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13C8 10.7909 9.79086 9 12 9C14.2091 9 16 10.7909 16 13Z"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
            </Svg>
          </View>
          <View style={styles.actionContent}>
            <Text style={{...styles.actionTitle, color: 'white'}}>{t('home.scanFridge')}</Text>
            <Text style={{...styles.actionDescription, color: 'rgba(255,255,255,0.8)'}}>{t('home.scanDescription')}</Text>
          </View>
          <Text style={{...styles.actionArrow, color: 'white'}}>→</Text>
          </TouchableOpacity>
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
                <TouchableOpacity activeOpacity={0.7} key={recipe._id} style={styles.recipeCard} onPress={() => handleRecipePress(recipe, index)}>
                  <View style={styles.recipeImagePlaceholder}>
                    {firstPhoto?.url ? (
                      <Image 
                        source={{ uri: firstPhoto.url }} 
                        style={styles.recipeImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
                          stroke={colors.success}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
                          stroke={colors.success}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>
                  <View style={styles.recipeInfo}>
                    <View style={styles.recipeHeader}>
                      <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                      <TouchableOpacity activeOpacity={0.7} 
                        style={styles.recipeShareButton}
                        onPress={(event) => handleShareRecipe(recipe, event)}
                      >
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
                            stroke={colors.textSecondary}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </TouchableOpacity>
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
                </TouchableOpacity>
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
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M2 17L12 22L22 17"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M2 12L12 17L22 12"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.featureTitle}>{t('home.aiRecognition')}</Text>
            <Text style={styles.featureDescription}>{t('home.aiDescription')}</Text>
          </Animated.View>

          <Animated.View style={[styles.featureCard, createCardStyle(1)]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
                  stroke={colors.success}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
                  stroke={colors.success}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.featureTitle}>{t('home.smartRecipes')}</Text>
            <Text style={styles.featureDescription}>{t('home.recipesDescription')}</Text>
          </Animated.View>

          <Animated.View style={[styles.featureCard, createCardStyle(2)]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                  stroke={colors.warning}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.featureTitle}>{t('home.saveRecipes')}</Text>
            <Text style={styles.featureDescription}>{t('home.saveDescription')}</Text>
          </Animated.View>

          <Animated.View style={[styles.featureCard, createCardStyle(3)]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  fill="none"
                />
                <Path
                  d="M20 21C20 16.0294 16.4183 12 12 12C7.58172 12 4 16.0294 4 21"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
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
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeBanner: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 60,
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