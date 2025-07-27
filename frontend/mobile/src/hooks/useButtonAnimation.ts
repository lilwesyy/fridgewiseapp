import { useSharedValue } from 'react-native-reanimated';
import { withSpring } from 'react-native-reanimated';
import { SCALE_VALUES, SPRING_CONFIGS } from '../constants/animations';

/**
 * Custom hook for iOS-style button press animations
 * Provides consistent press feedback across all interactive elements
 */
export const useButtonAnimation = (scaleValue: number = SCALE_VALUES.BUTTON_PRESS) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(scaleValue, SPRING_CONFIGS.BUTTON);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIGS.BUTTON);
  };

  return {
    scale,
    handlePressIn,
    handlePressOut,
  };
};

/**
 * Specialized hook for card/cell press animations
 */
export const useCardAnimation = () => {
  return useButtonAnimation(SCALE_VALUES.CARD_PRESS);
};

/**
 * Specialized hook for small button press animations
 */
export const useSmallButtonAnimation = () => {
  return useButtonAnimation(SCALE_VALUES.SMALL_BUTTON);
};