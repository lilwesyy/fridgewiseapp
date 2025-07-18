import React, { useState } from 'react';
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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../constants/animations';
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

  // iOS-style animations
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2),
      });
      scale.value = withSpring(1, {
        damping: 30,
        stiffness: 300,
        mass: 1.2,
      });
    } else {
      opacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.QUICK,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2),
      });
      scale.value = withSpring(0.9, {
        damping: 30,
        stiffness: 300,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, backdropStyle]}>
        <Animated.View style={[styles.modalContent, modalStyle]}>
          <Text style={styles.modalTitle}>
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity activeOpacity={0.7}
              style={[styles.button, styles.cameraButton]}
              onPress={() => handleImagePick(true)}
              disabled={isUploading}
            >
              <Text style={styles.buttonText}>
                {t('profile.avatar.takePhoto', 'Take Photo')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}
              style={[styles.button, styles.galleryButton]}
              onPress={() => handleImagePick(false)}
              disabled={isUploading}
            >
              <Text style={styles.buttonText}>
                {t('profile.avatar.chooseFromLibrary', 'Choose from Library')}
              </Text>
            </TouchableOpacity>

            {user?.avatar?.url && (
              <TouchableOpacity activeOpacity={0.7}
                style={[styles.button, styles.deleteButton]}
                onPress={handleDeleteAvatar}
                disabled={isUploading}
              >
                <Text style={styles.deleteButtonText}>
                  {t('profile.avatar.removePhoto', 'Remove Photo')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.7}
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isUploading}
            >
              <Text style={styles.cancelButtonText}>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  avatarPreview: {
    marginBottom: 20,
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
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: colors.primary,
  },
  galleryButton: {
    backgroundColor: colors.primaryDark,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    backgroundColor: colors.surface === '#FFFFFF' ? colors.background : colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.buttonText,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.buttonText,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    opacity: 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
});