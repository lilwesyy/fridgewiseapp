import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../constants/animations';

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
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={themeColors.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 12L11 14L15 10" stroke={themeColors.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  warning: (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path d="M12 9V13" stroke={themeColors.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 17H12.01" stroke={themeColors.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M10.29 3.86L1.82 18C1.42 18.66 1.89 19.5 2.65 19.5H21.35C22.11 19.5 22.58 18.66 22.18 18L13.71 3.86C13.33 3.23 12.37 3.23 11.99 3.86Z" stroke={themeColors.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  error: (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={themeColors.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M15 9L9 15" stroke={themeColors.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 9L15 15" stroke={themeColors.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
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
  }, [visible]);

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
        <TouchableOpacity activeOpacity={0.7} 
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
                <TouchableOpacity activeOpacity={0.7}
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
                </TouchableOpacity>
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
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    fontSize: 16,
    fontWeight: '600',
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
