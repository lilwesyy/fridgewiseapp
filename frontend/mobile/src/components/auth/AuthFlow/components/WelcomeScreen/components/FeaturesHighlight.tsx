import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../../../../contexts/ThemeContext';
import { useAuthValidation } from '../../../hooks/useAuthValidation';
import { getWelcomeStyles } from '../styles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface Feature {
  icon: string;
  text: string;
  translationKey?: string;
}

interface FeaturesHighlightProps {
  features?: Feature[];
  showFeatures?: boolean;
}

export const FeaturesHighlight: React.FC<FeaturesHighlightProps> = ({
  features,
  showFeatures = false,
}) => {
  const { colors } = useTheme();
  const { safeT } = useAuthValidation();
  const insets = useSafeAreaInsets();
  const styles = getWelcomeStyles(colors, insets);

  const defaultFeatures: Feature[] = [
    { icon: 'camera-outline', text: 'Scan ingredients', translationKey: 'home.features.scan' },
    { icon: 'bulb-outline', text: 'AI-powered suggestions', translationKey: 'home.features.ai' },
    { icon: 'restaurant-outline', text: 'Personalized recipes', translationKey: 'home.features.recipes' },
    { icon: 'leaf-outline', text: 'Reduce food waste', translationKey: 'home.features.waste' },
  ];

  const displayFeatures = features || defaultFeatures;

  // Animation values
  const containerOpacity = useSharedValue(0);
  const featureOpacities = displayFeatures.map(() => useSharedValue(0));
  const featureTranslateX = displayFeatures.map(() => useSharedValue(-30));

  useEffect(() => {
    if (!showFeatures) return;

    const easing = Easing.bezier(0.4, 0.0, 0.2, 1.0);

    // Container animation
    containerOpacity.value = withDelay(800, withTiming(1, { duration: 400, easing }));

    // Staggered feature animations
    displayFeatures.forEach((_, index) => {
      const delay = 1000 + index * 150;
      featureOpacities[index].value = withDelay(delay, withTiming(1, { duration: 400, easing }));
      featureTranslateX[index].value = withDelay(delay, withSpring(0, {
        damping: 12,
        stiffness: 100,
      }));
    });
  }, [showFeatures]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const createFeatureStyle = (index: number) => useAnimatedStyle(() => ({
    opacity: featureOpacities[index].value,
    transform: [{ translateX: featureTranslateX[index].value }],
  }));

  if (!showFeatures) return null;

  return (
    <Animated.View style={[styles.featuresContainer, containerAnimatedStyle]}>
      {displayFeatures.map((feature, index) => (
        <Animated.View key={index} style={[styles.featureItem, createFeatureStyle(index)]}>
          <View style={styles.featureIcon}>
            <Ionicons name={feature.icon} size={18} color={colors.primary} />
          </View>
          <Text style={styles.featureText}>
            {feature.translationKey ? safeT(feature.translationKey) : feature.text}
          </Text>
        </Animated.View>
      ))}
    </Animated.View>
  );
};