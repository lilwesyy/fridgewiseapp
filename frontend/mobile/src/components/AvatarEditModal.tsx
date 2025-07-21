import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES, SPRING_CONFIGS } from '../constants/animations';

const { height: screenHeight } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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

  const styles = getStyles(colors);

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
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const getGalleryIcon = (color: string) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 15L16 10L5 21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const getTrashIcon = (color: string) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6H5H21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const getXIcon = (color: string) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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

const getStyles = (colors: any) => StyleSheet.create({
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
    paddingBottom: 34,
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