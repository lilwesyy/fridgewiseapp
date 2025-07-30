import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../../../contexts/ThemeContext';
import { useAuthValidation } from '../../../hooks/useAuthValidation';
import { getWelcomeStyles } from '../styles';
import { AuthMode } from '../../../types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface ActionButtonsProps {
  onAuthModeChange: (mode: AuthMode) => void;
  primaryText?: string;
  secondaryText?: string;
  primaryAction?: AuthMode;
  secondaryAction?: AuthMode;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAuthModeChange,
  primaryText,
  secondaryText,
  primaryAction = 'register',
  secondaryAction = 'login',
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeT } = useAuthValidation();
  const styles = getWelcomeStyles(colors, insets);

  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(50);
  const primaryButtonScale = useSharedValue(0.9);
  const secondaryButtonScale = useSharedValue(0.9);
  const primaryButtonOpacity = useSharedValue(0);
  const secondaryButtonOpacity = useSharedValue(0);

  // Button press animations
  const primaryPressScale = useSharedValue(1);
  const secondaryPressScale = useSharedValue(1);

  useEffect(() => {
    const easing = Easing.bezier(0.4, 0.0, 0.2, 1.0);

    // Container slide up animation
    containerOpacity.value = withTiming(1, { duration: 400, easing });
    containerTranslateY.value = withTiming(0, { duration: 500, easing });

    // Button animations with stagger
    primaryButtonOpacity.value = withDelay(200, withTiming(1, { duration: 400, easing }));
    primaryButtonScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 200,
    }));

    secondaryButtonOpacity.value = withDelay(350, withTiming(1, { duration: 400, easing }));
    secondaryButtonScale.value = withDelay(350, withSpring(1, {
      damping: 15,
      stiffness: 200,
    }));
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  const primaryButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: primaryButtonOpacity.value,
    transform: [
      { scale: primaryButtonScale.value * primaryPressScale.value }
    ],
  }));

  const secondaryButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: secondaryButtonOpacity.value,
    transform: [
      { scale: secondaryButtonScale.value * secondaryPressScale.value }
    ],
  }));

  const handlePrimaryPress = () => {
    primaryPressScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    onAuthModeChange(primaryAction);
  };

  const handleSecondaryPress = () => {
    secondaryPressScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    onAuthModeChange(secondaryAction);
  };

  return (
    <Animated.View 
      style={[
        styles.fixedBottomButtons, 
        containerAnimatedStyle,
        { paddingBottom: Math.max(insets.bottom, 16) }
      ]}
    >
      <View style={styles.buttonsContainer}>
        <Animated.View style={primaryButtonAnimatedStyle}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePrimaryPress}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {primaryText || safeT('auth.register')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={secondaryButtonAnimatedStyle}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSecondaryPress}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              {secondaryText || safeT('auth.login')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
};