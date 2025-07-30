import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
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

interface QuickStatsProps {
  statistics: any;
  isLoading: boolean;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ statistics, isLoading }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const statsScale = useSharedValue(0.95);
  const statsOpacity = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    statsScale.value = withDelay(
      ANIMATION_DELAYS.STAGGER_1,
      withSpring(1, SPRING_CONFIGS.LIST)
    );
    statsOpacity.value = withDelay(
      ANIMATION_DELAYS.STAGGER_1,
      withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing })
    );
  }, []);

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [
      { scale: statsScale.value },
      {
        translateY: interpolate(statsOpacity.value, [0, 1], [15, 0])
      },
    ],
  }));

  return (
    <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {isLoading ? '...' : statistics?.recipesCreated || 0}
        </Text>
        <Text style={styles.statLabel}>{t('home.recipesCreated')}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {isLoading ? '...' : statistics?.ingredientsScanned || 0}
        </Text>
        <Text style={styles.statLabel}>{t('home.ingredientsScanned')}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {isLoading ? '...' : statistics?.favoriteRecipes || 0}
        </Text>
        <Text style={styles.statLabel}>{t('home.favoriteRecipes')}</Text>
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
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
});