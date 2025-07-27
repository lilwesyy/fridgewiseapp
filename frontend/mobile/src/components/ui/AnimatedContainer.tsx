import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  SPRING_CONFIGS, 
  EASING_CURVES,
  ANIMATION_DISTANCES,
  SCALE_VALUES 
} from '../../constants/animations';

interface AnimatedContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animationType?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'staggered';
  duration?: number;
  delay?: number;
  staggerDelay?: number;
}

// Using centralized animation constants

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  style,
  animationType = 'fadeIn',
  duration = ANIMATION_DURATIONS.CONTENT,
  delay = 0,
  staggerDelay = 100,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(SCALE_VALUES.MODAL_ENTRY);
  const translateY = useSharedValue(
    animationType === 'slideDown' ? -ANIMATION_DISTANCES.LARGE : ANIMATION_DISTANCES.LARGE
  );
  const translateX = useSharedValue(
    animationType === 'slideRight' ? -ANIMATION_DISTANCES.LARGE : ANIMATION_DISTANCES.LARGE
  );

  useEffect(() => {
    // iOS-standard easing curve
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );
    
    switch (animationType) {
      case 'fadeIn':
        opacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
        break;
        
      case 'slideUp':
        opacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
        translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.STANDARD));
        break;
        
      case 'slideDown':
        opacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
        translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.STANDARD));
        break;
        
      case 'slideLeft':
        opacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
        translateX.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.STANDARD));
        break;
        
      case 'slideRight':
        opacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
        translateX.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.STANDARD));
        break;
        
      case 'scale':
        opacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing }));
        scale.value = withDelay(delay, withSpring(1, SPRING_CONFIGS.MODAL));
        break;
        
      case 'staggered':
        // iOS-style staggered entrance - smoother timing
        opacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
        scale.value = withSpring(1, SPRING_CONFIGS.GENTLE);
        break;
    }
  }, [animationType, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle = {
      opacity: opacity.value,
    };

    switch (animationType) {
      case 'slideUp':
      case 'slideDown':
        return {
          ...baseStyle,
          transform: [{ translateY: translateY.value }],
        };
        
      case 'slideLeft':
      case 'slideRight':
        return {
          ...baseStyle,
          transform: [{ translateX: translateX.value }],
        };
        
      case 'scale':
      case 'staggered':
        return {
          ...baseStyle,
          transform: [{ scale: scale.value }],
        };
        
      default:
        return baseStyle;
    }
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};