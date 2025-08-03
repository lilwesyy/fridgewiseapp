import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import HapticTouchableOpacity from '../../../common/HapticTouchableOpacity';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS,
  SPRING_CONFIGS,
  ANIMATION_DELAYS,
  SCALE_VALUES,
} from '../../../../constants/animations';

interface QuickActionsProps {
  onNavigateToCamera: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigateToCamera }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const actionOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    actionOpacity.value = withDelay(
      ANIMATION_DELAYS.STAGGER_2,
      withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD })
    );
  }, []);

  const actionStyle = useAnimatedStyle(() => ({
    opacity: actionOpacity.value,
    transform: [
      { scale: withDelay(ANIMATION_DELAYS.STAGGER_2, withSpring(1, SPRING_CONFIGS.GENTLE)) },
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleCameraPress = () => {
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 20, stiffness: 300 }),
      withSpring(1, { damping: 20, stiffness: 300 })
    );
    onNavigateToCamera();
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(SCALE_VALUES.BUTTON_PRESS, SPRING_CONFIGS.BUTTON);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, SPRING_CONFIGS.BUTTON);
  };

  return (
    <Animated.View style={[styles.section, actionStyle]}>
      <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
      <Animated.View style={buttonAnimatedStyle}>
        <HapticTouchableOpacity
          hapticType="primary"
          activeOpacity={0.8}
          style={styles.primaryAction}
          onPress={handleCameraPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="camera" size={32} color="white" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{t('home.scanFridge')}</Text>
            <Text style={styles.actionDescription}>{t('home.scanDescription')}</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </HapticTouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20, // Allineato al nuovo standard HomeScreen
    fontWeight: '700', // Bold come SavedScreen
    color: '#1D1D1F',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  actionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 20,
  },
  actionTitle: {
    fontSize: 18, // Allineato a SavedScreen recipeTitle
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.2, // Come SavedScreen recipeTitle
  },
  actionDescription: {
    fontSize: 14, // Allineato a SavedScreen recipeDescription
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    letterSpacing: -0.05, // Come SavedScreen
  },
  actionArrow: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginLeft: 12,
  },
});