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
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  actionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionArrow: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});