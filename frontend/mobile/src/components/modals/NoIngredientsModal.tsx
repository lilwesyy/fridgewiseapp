import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';

const { height: screenHeight } = Dimensions.get('window');

interface NoIngredientsModalProps {
  visible: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onRetakePhoto: () => void;
  onTryGallery?: () => void;
  onManualInput: () => void;
}

export const NoIngredientsModal: React.FC<NoIngredientsModalProps> = ({ 
  visible, 
  onClose, 
  onCancel,
  onRetakePhoto, 
  onTryGallery,
  onManualInput 
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Animation for the warning icon background pulse
  const pulseScale = useSharedValue(1);
  // Modal animation (like ShareModal)
  const slideY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // More subtle pulse for iOS-like feel
      pulseScale.value = withRepeat(
        withTiming(1.1, { 
          duration: ANIMATION_DURATIONS.LONG, 
          easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
        }),
        -1,
        true
      );
      // iOS sheet presentation timing
      opacity.value = withTiming(1, { 
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
      });
      slideY.value = withSpring(0, { damping: 30, stiffness: 300, mass: 1.2 });
    } else {
      // iOS sheet dismissal
      opacity.value = withTiming(0, { 
        duration: ANIMATION_DURATIONS.QUICK,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
      });
      slideY.value = withSpring(screenHeight, { damping: 35, stiffness: 400, mass: 1 });
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const handleRetakePhoto = () => {
    onRetakePhoto();
    onClose();
  };

  const handleTryGallery = () => {
    if (onTryGallery) {
      onTryGallery();
      onClose();
    }
  };

  const handleManualInput = () => {
    onManualInput();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => {}}
    >
      <TouchableWithoutFeedback>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modal, modalStyle]}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Animated.View style={[styles.iconContainer, pulseStyle]}>
                  <Ionicons name="warning" size={48} color={colors.warning} />
                </Animated.View>
                <Text style={styles.title}>{t('camera.noIngredientsTitle')}</Text>
                <Text style={styles.message}>{t('camera.noIngredientsMessage')}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity activeOpacity={0.7} style={styles.primaryAction} onPress={handleRetakePhoto}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="camera" size={20} color={colors.buttonText} />
                  </View>
                  <Text style={styles.primaryActionText}>{t('camera.retakePicture')}</Text>
                </TouchableOpacity>

                <View style={styles.secondaryActions}>
                  {onTryGallery && (
                    <TouchableOpacity activeOpacity={0.7} style={styles.secondaryAction} onPress={handleTryGallery}>
                      <Ionicons name="image" size={20} color={colors.primary} />
                      <Text style={styles.secondaryActionText}>{t('camera.selectImage')}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity activeOpacity={0.7} style={styles.secondaryAction} onPress={handleManualInput}>
                    <Ionicons name="add" size={20} color="rgb(22, 163, 74)" />
                    <Text style={styles.secondaryActionText}>{t('camera.addIngredient')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.7} style={styles.cancelButton} onPress={onCancel || onClose}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for iPhone
    minHeight: 400,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  actions: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  actionIcon: {
    marginRight: 12,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.buttonText,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minHeight: 60,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  cancelButton: {
    marginHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});