import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface LoadingAnimationProps {
  size?: number;
  color?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  size = 60, 
  color 
}) => {
  const { colors } = useTheme();
  const defaultColor = color || colors.primary;
  
  // iOS-style loading animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // iOS spinner - smooth continuous rotation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: ANIMATION_DURATIONS.LOADING * 2.5, // 1500ms for smooth rotation
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Subtle scale pulsing - more iOS-like
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: ANIMATION_DURATIONS.LOADING * 2,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN_OUT.x1, EASING_CURVES.IOS_EASE_IN_OUT.y1, EASING_CURVES.IOS_EASE_IN_OUT.x2, EASING_CURVES.IOS_EASE_IN_OUT.y2),
        }),
        withTiming(1, {
          duration: ANIMATION_DURATIONS.LOADING * 2,
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN_OUT.x1, EASING_CURVES.IOS_EASE_IN_OUT.y1, EASING_CURVES.IOS_EASE_IN_OUT.x2, EASING_CURVES.IOS_EASE_IN_OUT.y2),
        })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderColor: defaultColor,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
          },
          animatedStyle
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderWidth: 3,
    borderRadius: 999,
    borderStyle: 'solid',
  },
});