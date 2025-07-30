import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  SPRING_CONFIGS, 
  EASING_CURVES 
} from '../../../../constants/animations';

export const useHomeAnimations = () => {
  const fadeIn = useSharedValue(0);
  const slideIn = useSharedValue(50);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1, 
      EASING_CURVES.IOS_STANDARD.y1, 
      EASING_CURVES.IOS_STANDARD.x2, 
      EASING_CURVES.IOS_STANDARD.y2
    );

    fadeIn.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    slideIn.value = withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    scale.value = withSpring(1, SPRING_CONFIGS.GENTLE);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [
      { translateY: slideIn.value },
      { scale: scale.value },
    ],
  }));

  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      const statusBarHeight = Constants.statusBarHeight;
      return statusBarHeight > 20 ? statusBarHeight : 44;
    }
    return StatusBar.currentHeight || 0;
  };

  return {
    animatedStyle,
    getStatusBarHeight,
  };
};