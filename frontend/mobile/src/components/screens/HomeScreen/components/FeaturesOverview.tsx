import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS,
  SPRING_CONFIGS,
  EASING_CURVES,
  ANIMATION_DELAYS,
} from '../../../../constants/animations';

const { width } = Dimensions.get('window');

export const FeaturesOverview: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const featuresOpacity = useSharedValue(0);
  const featuresTranslateY = useSharedValue(30);
  const cardScales = Array.from({ length: 4 }, () => useSharedValue(0.8));
  const cardOpacities = Array.from({ length: 4 }, () => useSharedValue(0));

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

    // Stagger card animations
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
  }, []);

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
    transform: [{ translateY: featuresTranslateY.value }],
  }));

  const createCardStyle = (index: number) => useAnimatedStyle(() => ({
    opacity: cardOpacities[index].value,
    transform: [
      { scale: cardScales[index].value },
      {
        translateY: interpolate(cardOpacities[index].value, [0, 1], [30, 0])
      },
    ],
  }));

  const features = [
    {
      icon: 'scan-outline',
      color: colors.primary,
      title: t('home.aiRecognition'),
      description: t('home.aiDescription'),
    },
    {
      icon: 'book-outline',
      color: colors.success,
      title: t('home.smartRecipes'),
      description: t('home.recipesDescription'),
    },
    {
      icon: 'bookmark-outline',
      color: colors.warning,
      title: t('home.saveRecipes'),
      description: t('home.saveDescription'),
    },
    {
      icon: 'person-outline',
      color: colors.primary,
      title: t('home.personalizedExperience'),
      description: t('home.personalizedDescription'),
    },
  ];

  return (
    <Animated.View style={[styles.section, featuresStyle]}>
      <Text style={styles.sectionTitle}>{t('home.featuresTitle')}</Text>
      
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <Animated.View key={index} style={[styles.featureCard, createCardStyle(index)]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
              <Ionicons name={feature.icon} size={24} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </Animated.View>
        ))}
      </View>
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
});