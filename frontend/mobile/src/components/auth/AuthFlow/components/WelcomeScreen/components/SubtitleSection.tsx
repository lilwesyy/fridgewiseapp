import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../../../contexts/ThemeContext';
import { useAuthValidation } from '../../../hooks/useAuthValidation';
import { getWelcomeStyles } from '../styles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface SubtitleSectionProps {
  subtitle?: string;
  customSubtitle?: string;
}

export const SubtitleSection: React.FC<SubtitleSectionProps> = ({
  subtitle,
  customSubtitle,
}) => {
  const { colors } = useTheme();
  const { safeT } = useAuthValidation();
  const insets = useSafeAreaInsets();
  const styles = getWelcomeStyles(colors, insets);

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    const easing = Easing.bezier(0.4, 0.0, 0.2, 1.0);

    opacity.value = withDelay(600, withTiming(1, { duration: 600, easing }));
    translateY.value = withDelay(600, withTiming(0, { duration: 600, easing }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const displayText = customSubtitle || subtitle || safeT('auth.welcomeSubtitle');

  return (
    <Animated.View style={[styles.subtitleContainer, animatedStyle]}>
      <Text style={styles.welcomeSubtitle}>
        {displayText}
      </Text>
    </Animated.View>
  );
};