import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export const useWelcomeAnimations = () => {
  // Simple, clean animations
  const containerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);

  useEffect(() => {
    const easing = Easing.bezier(0.4, 0.0, 0.2, 1.0);

    // Container fade in
    containerOpacity.value = withTiming(1, { duration: 400, easing });

    // Content slide up with delay
    contentOpacity.value = withDelay(150, withTiming(1, { duration: 500, easing })); 
    contentTranslateY.value = withDelay(150, withTiming(0, { duration: 500, easing }));
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  return {
    containerAnimatedStyle,
    contentAnimatedStyle,
  };
};