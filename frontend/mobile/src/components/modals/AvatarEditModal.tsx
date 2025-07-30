import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES, SPRING_CONFIGS } from '../../constants/animations';

const { height: screenHeight } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface AvatarEditModalProps {
  visible: boolean;
  onClose: () => void;
  onAvatarUpdated: (updatedUser?: any) => void;
}

export const AvatarEditModal: React.FC<AvatarEditModalProps> = ({
  visible,
  onClose,
  onAvatarUpdated,
}) => {
  const { t } = useTranslation();
  const { user, uploadAvatar, deleteAvatar } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isUploading, setIsUploading] = useState(false);

  // Bottom sheet style animations
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Bottom sheet entrance animation
      opacity.value = withTiming(1, {
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2),
      });
      translateY.value = withSpring(0, SPRING_CONFIGS.MODAL);
    } else {
      // Bottom sheet exit animation
      opacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.QUICK,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2),
      });
      translateY.value = withTiming(screenHeight, {
        duration: ANIMATION_DURATIONS.QUICK,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2),
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const styles = getStyles(colors, insets);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          t('profile.avatar.permissionRequired')
        );
        return false;
      }
    }
    return true;
  };

  const handleImagePick = async (fromCamera: boolean = false) => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      let result: ImagePicker.ImagePickerResult;
      
      if (fromCamera) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsUploading(true);
        const imageUri = result.assets[0].uri;
        
        try {
          const updatedUser = await uploadAvatar(imageUri);
          onAvatarUpdated(updatedUser);
          onClose();
        } catch (error) {
          Alert.alert(
            t('common.error'),
            t('profile.avatar.uploadError')
          );
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        t('common.error'),
        t('profile.avatar.pickError')
      );
    }
  };

  const handleDeleteAvatar = async () => {
    Alert.alert(
      t('profile.avatar.deleteTitle', 'Delete Avatar'),
      t('profile.avatar.deleteMessage', 'Are you sure you want to remove your profile picture?'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);
              const updatedUser = await deleteAvatar();
              onAvatarUpdated(updatedUser);
              onClose();
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('profile.avatar.deleteError')
              );
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  // Icon components
  const getCameraIcon = (color: string) => (
    <Ionicons name="camera" size={20} color={color} />
  );

  const getGalleryIcon = (color: string) => (
    <Ionicons name="images" size={20} color={color} />
  );

  const getTrashIcon = (color: string) => (
    <Ionicons name="trash" size={20} color={color} />
  );

  const getXIcon = (color: string) => (
    <Ionicons name="close" size={20} color={color} />
  );

  const handleOverlayPress = () => {
    if (!isUploading) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleOverlayPress}
        />
        <Animated.View style={[styles.modalBox, modalStyle]}>
          {/* Bottom sheet handle */}
          <View style={styles.handle} />
          
          <Text style={styles.title}>
            {t('profile.avatar.title', 'Change Avatar')}
          </Text>
          
          <View style={styles.avatarPreview}>
            {user?.avatar?.url ? (
              <Image source={{ uri: user.avatar.url }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Main action buttons */}
          <View style={styles.mainButtonsContainer}>
            <TouchableOpacity
              style={[styles.optionButton]}
              onPress={() => handleImagePick(true)}
              disabled={isUploading}
            >
              <View style={styles.optionIcon}>
                {getCameraIcon(colors.primary)}
              </View>
              <Text style={styles.optionText}>
                {t('profile.avatar.takePhoto', 'Take Photo')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton]}
              onPress={() => handleImagePick(false)}
              disabled={isUploading}
            >
              <View style={styles.optionIcon}>
                {getGalleryIcon(colors.primary)}
              </View>
              <Text style={styles.optionText}>
                {t('profile.avatar.gallery', 'Galleria')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Secondary actions */}
          <View style={styles.secondaryButtonsContainer}>
            {user?.avatar?.url && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDeleteAvatar}
                disabled={isUploading}
              >
                <View style={styles.buttonIcon}>
                  {getTrashIcon(colors.buttonText)}
                </View>
                <Text style={[styles.buttonText, styles.deleteButtonText]}>
                  {t('profile.avatar.removePhoto', 'Remove Photo')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
              disabled={isUploading}
            >
              <View style={styles.buttonIcon}>
                {getXIcon(colors.buttonText)}
              </View>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>
          </View>

          {isUploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                {t('profile.avatar.uploading', 'Uploading...')}
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const getStyles = (colors: any, insets?: { bottom: number }) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Math.max(insets?.bottom || 0, 16), // Dynamic safe area with minimum padding
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 200,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarPreview: {
    marginBottom: 24,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.buttonText,
  },
  mainButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  secondaryButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.buttonText,
  },
  secondaryButtonText: {
    color: colors.buttonText,
  },
  deleteButtonText: {
    color: colors.buttonText,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.buttonText,
    textAlign: 'center',
  },
});