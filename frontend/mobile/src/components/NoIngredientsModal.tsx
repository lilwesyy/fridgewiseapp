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
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

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

  // Animation for the warning icon background pulse
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withTiming(1.3, { 
          duration: 800, 
          easing: Easing.inOut(Easing.ease) 
        }),
        -1,
        true
      );
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
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
      animationType="slide"
      onRequestClose={() => {
        // Don't automatically close, let user choose
      }}
    >
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback>
          <View style={styles.modal}>
              <View style={styles.handle} />
              
              <View style={styles.header}>
                <Animated.View style={[styles.iconContainer, pulseStyle]}>
                  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-8h2v6h-2V9z"
                      fill="#F59E0B"
                    />
                  </Svg>
                </Animated.View>
                <Text style={styles.title}>{t('camera.noIngredientsTitle')}</Text>
                <Text style={styles.message}>{t('camera.noIngredientsMessage')}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryAction} onPress={handleRetakePhoto}>
                  <View style={styles.actionIcon}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M16 13C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13C8 10.7909 9.79086 9 12 9C14.2091 9 16 10.7909 16 13Z"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.primaryActionText}>{t('camera.retakePicture')}</Text>
                </TouchableOpacity>

                <View style={styles.secondaryActions}>
                  {onTryGallery && (
                    <TouchableOpacity style={styles.secondaryAction} onPress={handleTryGallery}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"
                          stroke="rgb(22, 163, 74)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </Svg>
                      <Text style={styles.secondaryActionText}>{t('camera.selectImage')}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.secondaryAction} onPress={handleManualInput}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 5V19M5 12H19"
                        stroke="rgb(22, 163, 74)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.secondaryActionText}>{t('camera.addIngredient')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onCancel || onClose}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for iPhone
    minHeight: 400,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
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
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: 'rgb(22, 163, 74)',
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
    color: 'white',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: 'rgb(22, 163, 74)',
  },
  cancelButton: {
    marginHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});