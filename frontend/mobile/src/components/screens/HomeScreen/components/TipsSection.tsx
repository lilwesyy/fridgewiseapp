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

export const TipsSection: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const featuresOpacity = useSharedValue(0);
  const featuresTranslateY = useSharedValue(30);
  const tipCardScale = useSharedValue(0.9);
  const tipCardOpacity = useSharedValue(0);

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

    // Animate tip card
    tipCardScale.value = withDelay(
      ANIMATION_DELAYS.LIST_BASE + ANIMATION_DELAYS.STAGGER_3,
      withSpring(1, SPRING_CONFIGS.LIST)
    );
    tipCardOpacity.value = withDelay(
      ANIMATION_DELAYS.LIST_BASE + ANIMATION_DELAYS.STAGGER_3,
      withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing })
    );
  }, []);

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
    transform: [{ translateY: featuresTranslateY.value }],
  }));

  const tipCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tipCardOpacity.value,
    transform: [
      { scale: tipCardScale.value },
      {
        translateY: interpolate(tipCardOpacity.value, [0, 1], [20, 0])
      },
    ],
  }));

  return (
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
});