import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, withRepeat } from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES } from '../../constants/animations';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { height: screenHeight } = Dimensions.get('window');

interface DeleteConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel,
  cancelLabel,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  const slideY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);
  // Animation for the warning icon background pulse (come NoIngredientsModal)
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);
      
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: ANIMATION_DURATIONS.MODAL, easing }),
        -1,
        true
      );
      // Backdrop should appear immediately
      opacity.value = 1;
      slideY.value = withSpring(0, SPRING_CONFIGS.MODAL);
    } else {
      const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);
      
      // Backdrop should disappear only when modal slides down
      opacity.value = withTiming(0, { duration: ANIMATION_DURATIONS.QUICK, easing });
      slideY.value = withTiming(screenHeight, { duration: ANIMATION_DURATIONS.QUICK, easing });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }), [pulseScale]);

  const pulseHaloStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 48,
    backgroundColor: 'transparent',
    opacity: 0.6,
    transform: [{ scale: pulseScale.value }],
  }), [pulseScale]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modal, modalStyle]}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <View style={[styles.iconContainer, {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.card,
                  marginBottom: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }] }>
                  <Animated.View style={pulseHaloStyle} />
                  <Animated.View style={pulseStyle}>
                    <Ionicons name="trash" size={48} color={colors.error} />
                  </Animated.View>
                </View>
                <Text style={styles.title}>{title || t('recipe.deleteTitle')}</Text>
                <Text style={styles.message}>{message || t('recipe.deleteMessage')}</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity activeOpacity={0.7} style={[styles.cancelButton, { marginRight: 6 }]} onPress={onCancel}>
                  <Text style={styles.cancelButtonText}>{cancelLabel || t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={[styles.deleteButton, { marginLeft: 6 }]} onPress={onConfirm}>
                  <Text style={styles.deleteButtonText}>{confirmLabel || t('common.delete')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (colors: any, insets: { bottom: number }) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: Math.max(insets.bottom, 16) + 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 24,
    marginBottom: 8,
    alignItems: 'stretch',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.buttonText,
  },
});
