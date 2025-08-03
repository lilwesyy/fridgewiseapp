import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';
import { APP_TYPOGRAPHY } from '../../constants/typography';
import { INTERACTION_CONFIG, BORDER_RADIUS, SHADOWS, SPACING } from '../../constants/interactions';
import { HapticService } from '../../services/hapticService';
import HapticTouchableOpacity from '../common/HapticTouchableOpacity';

export type NotificationType = 'success' | 'warning' | 'error';

interface NotificationButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface NotificationModalProps {
  visible: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
  buttons?: NotificationButton[];
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const getIcons = (themeColors: any) => ({
  success: (
    <Ionicons name="checkmark-circle-outline" size={32} color={themeColors.success} />
  ),
  warning: (
    <Ionicons name="warning-outline" size={32} color={themeColors.warning} />
  ),
  error: (
    <Ionicons name="alert-circle-outline" size={32} color={themeColors.error} />
  ),
});

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  buttons,
  autoClose = true,
  autoCloseDelay = 3000,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const icons = getIcons(colors);

  // iOS-style alert animations
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // Trigger haptic feedback based on notification type
      switch (type) {
        case 'success':
          HapticService.success();
          break;
        case 'warning':
          HapticService.warning();
          break;
        case 'error':
          HapticService.error();
          break;
      }
      
      opacity.value = withTiming(1, {
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2),
      });
      scale.value = withSpring(1, {
        damping: 25,
        stiffness: 300,
        mass: 1,
      });
    } else {
      opacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.QUICK,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2),
      });
      scale.value = withSpring(0.9, {
        damping: 30,
        stiffness: 400,
        mass: 0.8,
      });
    }
  }, [visible, type]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Safety check for props
  const safeTitle = typeof title === 'string' ? title : '';
  const safeMessage = typeof message === 'string' ? message : '';
  const safeType = type || 'success';

  useEffect(() => {
    if (visible && autoClose && !buttons) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, autoCloseDelay, onClose, buttons]);

  const handleOverlayPress = () => {
    if (!buttons) {
      onClose();
    }
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return [styles.button, styles.destructiveButton];
      case 'cancel':
        return [styles.button, styles.cancelButton];
      default:
        return [styles.button, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return [styles.buttonText, styles.destructiveButtonText];
      case 'cancel':
        return [styles.buttonText, styles.cancelButtonText];
      default:
        return [styles.buttonText, styles.defaultButtonText];
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleOverlayPress}
        />
        <Animated.View style={[styles.modalBox, modalStyle]}>
          <View style={styles.icon}>{icons[safeType]}</View>
          <Text style={[styles.title, { color: colors[safeType] }]}>{safeTitle}</Text>
          <Text style={styles.message}>{safeMessage}</Text>

          {buttons && buttons.length > 0 && (
            <View style={styles.buttonsContainer}>
              {buttons.map((button, index) => (
                <HapticTouchableOpacity 
                  hapticType={button.style === 'destructive' ? 'medium' : 'light'}
                  activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}
                  key={index}
                  style={getButtonStyle(button.style)}
                  onPress={() => {
                    button.onPress();
                    onClose();
                  }}
                >
                  <Text style={getButtonTextStyle(button.style)}>
                    {button.text}
                  </Text>
                </HapticTouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalBox: {
    width: 320,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.XL,
    alignItems: 'center',
    ...SHADOWS.MODAL,
  },
  icon: {
    marginBottom: SPACING.SM,
  },
  title: {
    ...APP_TYPOGRAPHY.MODAL_TITLE,
    marginBottom: SPACING.ELEMENT,
  },
  message: {
    ...APP_TYPOGRAPHY.MODAL_SUBTITLE,
    color: colors.text,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.SMALL,
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: colors.primary,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    ...APP_TYPOGRAPHY.BUTTON_SECONDARY,
  },
  defaultButtonText: {
    color: colors.buttonText,
  },
  destructiveButtonText: {
    color: colors.buttonText,
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
});
