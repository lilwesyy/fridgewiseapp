import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES, SPRING_CONFIGS } from '../../constants/animations';

const { height: screenHeight } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { NotificationModal, NotificationType } from '../modals/NotificationModal';
import { uploadService, UploadError, UploadProgress } from '../../services/uploadService';
import { tempFileCleanupService } from '../../utils/tempFileCleanup';

export type UploadState = 'idle' | 'selecting' | 'compressing' | 'uploading' | 'success' | 'error';

interface PhotoUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoSelected: (uri: string) => void;
  onSkip: () => void;
  recipeId?: string;
  onUploadComplete?: (result: { url: string; publicId: string }) => void;
  onUploadError?: (error: UploadError) => void;
  showSkipButton?: boolean; // Optional prop to control skip button visibility
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  visible,
  onClose,
  onPhotoSelected,
  onSkip,
  recipeId,
  onUploadComplete,
  onUploadError,
  showSkipButton = true, // Default to true for backward compatibility
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  // State management
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [lastError, setLastError] = useState<UploadError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Notification modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);

  // Animation values - Bottom sheet style
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);
  const progressRotation = useSharedValue(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      // Bottom sheet entrance animation
      opacity.value = withTiming(1, {
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2),
      });
      translateY.value = withSpring(0, SPRING_CONFIGS.MODAL);
      
      // Reset state
      setUploadState('idle');
      setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
      setLastError(null);
      setRetryCount(0);
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
      
      // Reset all state when modal closes
      setSelectedImageUri(null);
      setUploadState('idle');
      setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
      setLastError(null);
      setRetryCount(0);
      setShowErrorModal(false);
      setShowSuccessModal(false);
      setShowRetryModal(false);
      setPhotoSource(null);
    }
  }, [visible]);

  // Progress animation
  useEffect(() => {
    if (uploadState === 'uploading' || uploadState === 'compressing') {
      progressRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      progressRotation.value = 0;
    }
  }, [uploadState]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('camera.permissionTitle'),
        t('camera.permissionMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('camera.grantPermission'), onPress: () => {} },
        ]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('camera.permissionTitle'),
        t('camera.permissionMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('camera.grantPermission'), onPress: () => {} },
        ]
      );
      return false;
    }
    return true;
  };

  // Analytics tracking
  const trackUploadEvent = (event: string, data?: any) => {
    if (__DEV__) {
      console.log(`[PhotoUpload] ${event}`, data);
    }
    // TODO: Add analytics service integration
  };

  // Error handling utilities
  const getErrorMessage = (error: UploadError): string => {
    // Check for specific photo limit error
    if (error.message?.includes('Maximum 3 photos allowed') || error.message?.includes('PHOTO_LIMIT_EXCEEDED')) {
      return t('cookingMode.photoLimit.message', 'Questa ricetta ha già il massimo di 3 foto.');
    }
    
    const errorKey = `cookingMode.photoUpload.errors.${error.type}`;
    return t(errorKey, { defaultValue: t('cookingMode.photoUpload.errors.unknown') });
  };

  const isRetryableError = (error: UploadError): boolean => {
    return error.retryable && retryCount < 3;
  };

  // Enhanced image compression with error handling
  const compressImage = async (uri: string): Promise<string> => {
    try {
      setUploadState('compressing');
      trackUploadEvent('compression_started', { uri });
      
      const result = await uploadService.compressImage(uri, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      console.log('[PhotoUpload] Compression completed, result:', result);
      trackUploadEvent('compression_success', { originalUri: uri, compressedUri: result });
      console.log('[PhotoUpload] Compression event tracked');
      setUploadState('idle'); // Reset state after successful compression
      return result;
    } catch (error) {
      const uploadError: UploadError = {
        name: 'CompressionError',
        message: t('cookingMode.photoUpload.errors.compression'),
        type: 'validation',
        retryable: false,
      };
      
      trackUploadEvent('compression_failed', { error: error instanceof Error ? error.message : String(error) });
      setLastError(uploadError);
      setUploadState('error');
      throw uploadError;
    }
  };

  // Enhanced upload with comprehensive error handling
  const uploadPhoto = async (imageUri: string): Promise<void> => {
    try {
      setUploadState('uploading');
      setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
      
      trackUploadEvent('upload_started', { imageUri, recipeId, attempt: retryCount + 1 });

      const result = await uploadService.uploadDishPhoto(imageUri, recipeId, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        maxRetries: 1, // We handle retries at component level
        timeout: 30000,
      });

      trackUploadEvent('upload_success', { result });
      setUploadState('success');
      setShowSuccessModal(true);
      
      // Call success callback
      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Auto-close after success
      setTimeout(() => {
        setShowSuccessModal(false);
        onClose();
      }, 2000);

    } catch (error) {
      const uploadError = error as UploadError;
      
      trackUploadEvent('upload_failed', { 
        error: uploadError.message, 
        type: uploadError.type,
        attempt: retryCount + 1,
        retryable: uploadError.retryable 
      });

      setLastError(uploadError);
      setUploadState('error');
      
      // Call error callback
      if (onUploadError) {
        onUploadError(uploadError);
      }

      // Show appropriate error handling UI
      if (isRetryableError(uploadError)) {
        setShowRetryModal(true);
      } else {
        setShowErrorModal(true);
      }
    }
  };

  const handleTakePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('[PhotoUpload] Starting compression...');
        const compressedUri = await compressImage(result.assets[0].uri);
        console.log('[PhotoUpload] Setting selected image URI...');
        setSelectedImageUri(compressedUri);
        setPhotoSource('camera');
        
        // Register original image for cleanup (non-blocking)
        tempFileCleanupService.registerTempFile(result.assets[0].uri, 'image').catch(error => {
          console.warn('Failed to register temp file:', error);
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common.error'), t('camera.cameraError'));
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('[PhotoUpload] Starting gallery compression...');
        const compressedUri = await compressImage(result.assets[0].uri);
        console.log('[PhotoUpload] Setting gallery image URI...');
        setSelectedImageUri(compressedUri);
        setPhotoSource('gallery');
        
        // Register original image for cleanup (non-blocking)
        tempFileCleanupService.registerTempFile(result.assets[0].uri, 'image').catch(error => {
          console.warn('Failed to register temp file:', error);
        });
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert(t('common.error'), t('camera.galleryError'));
    }
  };

  const handleConfirmPhoto = async () => {
    if (selectedImageUri) {
      if (recipeId) {
        // Upload directly if we have a recipe ID
        await uploadPhoto(selectedImageUri);
      } else {
        // Just pass the URI back for external handling
        onPhotoSelected(selectedImageUri);
      }
    }
  };

  const handleRetakePhoto = () => {
    setSelectedImageUri(null);
    setUploadState('idle');
    setLastError(null);
    setPhotoSource(null);
  };

  // Track if photo was taken or selected from gallery
  const [photoSource, setPhotoSource] = useState<'camera' | 'gallery' | null>(null);

  const handleRetry = async () => {
    setShowRetryModal(false);
    setRetryCount(prev => prev + 1);
    
    if (selectedImageUri) {
      await uploadPhoto(selectedImageUri);
    }
  };

  const handleSkipAfterError = () => {
    setShowRetryModal(false);
    setShowErrorModal(false);
    trackUploadEvent('upload_skipped_after_error', { error: lastError?.type });
    onSkip();
  };

  const handleChangePhoto = () => {
    setShowRetryModal(false);
    setSelectedImageUri(null);
    setUploadState('idle');
    setLastError(null);
    setPhotoSource(null);
  };

  const handleOverlayPress = () => {
    if (uploadState === 'idle' || uploadState === 'error') {
      onClose();
    }
  };

  const getCameraIcon = () => (
    <Ionicons name="camera-outline" size={24} color={colors.primary} />
  );

  const getGalleryIcon = () => (
    <Ionicons name="images-outline" size={24} color={colors.primary} />
  );

  // Progress indicator component
  const ProgressIndicator = () => {
    const progressStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${progressRotation.value}deg` }],
    }));

    return (
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressCircle, progressStyle]}>
          <Ionicons name="sync-outline" size={40} color={colors.primary} />
        </Animated.View>
        <Text style={styles.progressText}>
          {uploadState === 'compressing' 
            ? t('cookingMode.photoUpload.progress.preparing')
            : t('cookingMode.photoUpload.progress.uploading', { percentage: uploadProgress.percentage })
          }
        </Text>
      </View>
    );
  };

  // Upload status indicator
  const getUploadStatusMessage = () => {
    switch (uploadState) {
      case 'compressing':
        return t('cookingMode.photoUpload.progress.preparing');
      case 'uploading':
        return t('cookingMode.photoUpload.progress.uploading', { percentage: uploadProgress.percentage });
      case 'success':
        return t('cookingMode.photoUpload.success.message');
      case 'error':
        return lastError ? getErrorMessage(lastError) : t('cookingMode.photoUpload.errors.unknown');
      default:
        return '';
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="none">
        <Animated.View style={[styles.overlay, backdropStyle]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleOverlayPress}
          />
          <Animated.View style={[styles.modalBox, modalStyle]}>
            {/* Bottom sheet handle */}
            <View style={styles.handle} />
            
            {selectedImageUri ? (
              // Photo preview mode
              <>
                <Text style={styles.title}>{t('cookingMode.dishPhoto')}</Text>
                <Text style={styles.subtitle}>{t('cookingMode.dishPhotoDesc')}</Text>
                
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                  
                  {/* Upload progress overlay */}
                  {(uploadState === 'compressing' || uploadState === 'uploading') && (
                    <View style={styles.uploadOverlay}>
                      <ProgressIndicator />
                    </View>
                  )}
                  
                  {/* Success indicator */}
                  {uploadState === 'success' && (
                    <View style={styles.successOverlay}>
                      <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                      <Text style={styles.successText}>{t('cookingMode.photoUpload.success.message')}</Text>
                    </View>
                  )}
                </View>

                {/* Status message - Hidden to avoid duplicate text */}
                {false && uploadState !== 'idle' && (
                  <Text style={[styles.statusMessage, { color: uploadState === 'error' ? colors.error : colors.textSecondary }]}>
                    {getUploadStatusMessage()}
                  </Text>
                )}

                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={handleRetakePhoto}
                    disabled={uploadState === 'uploading' || uploadState === 'compressing'}
                  >
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                      {photoSource === 'camera' ? t('camera.retake') : t('camera.selectImageAgain')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleConfirmPhoto}
                    disabled={uploadState === 'uploading' || uploadState === 'compressing'}
                  >
                    {uploadState === 'uploading' || uploadState === 'compressing' ? (
                      <ActivityIndicator size="small" color={colors.buttonText} />
                    ) : (
                      <Text style={[styles.buttonText, styles.primaryButtonText]}>
                        {t('cookingMode.saveToCollection')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Photo selection mode
              <>
                <Text style={styles.title}>{t('cookingMode.dishPhoto')}</Text>
                <Text style={styles.subtitle}>{t('cookingMode.dishPhotoDesc')}</Text>

                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleTakePhoto}
                    disabled={uploadState === 'compressing'}
                  >
                    <View style={styles.optionIcon}>
                      {getCameraIcon()}
                    </View>
                    <Text style={styles.optionText}>{t('camera.takePicture')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleSelectFromGallery}
                    disabled={uploadState === 'compressing'}
                  >
                    <View style={styles.optionIcon}>
                      {getGalleryIcon()}
                    </View>
                    <Text style={styles.optionText}>{t('camera.selectImage')}</Text>
                  </TouchableOpacity>
                </View>

                {showSkipButton && (
                  <TouchableOpacity
                    style={[styles.button, styles.skipButton]}
                    onPress={onSkip}
                    disabled={uploadState === 'compressing'}
                  >
                    <Text style={[styles.buttonText, styles.skipButtonText]}>
                      {t('cookingMode.skipPhoto')}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Error Modal */}
      <NotificationModal
        visible={showErrorModal}
        type="error"
        title={t('cookingMode.photoUpload.errors.unknown')}
        message={lastError ? getErrorMessage(lastError) : t('cookingMode.photoUpload.errors.unknown')}
        onClose={() => setShowErrorModal(false)}
        buttons={[
          {
            text: t('cookingMode.photoUpload.retry.skipButton'),
            onPress: handleSkipAfterError,
            style: 'cancel',
          },
          {
            text: t('common.ok'),
            onPress: () => setShowErrorModal(false),
            style: 'default',
          },
        ]}
      />

      {/* Retry Modal */}
      <NotificationModal
        visible={showRetryModal}
        type="warning"
        title={t('cookingMode.photoUpload.retry.title')}
        message={t('cookingMode.photoUpload.retry.message')}
        onClose={() => setShowRetryModal(false)}
        buttons={[
          {
            text: t('cookingMode.photoUpload.retry.changePhotoButton'),
            onPress: handleChangePhoto,
            style: 'cancel',
          },
          {
            text: t('cookingMode.photoUpload.retry.skipButton'),
            onPress: handleSkipAfterError,
            style: 'cancel',
          },
          {
            text: t('cookingMode.photoUpload.retry.retryButton'),
            onPress: handleRetry,
            style: 'default',
          },
        ]}
      />

      {/* Success Modal */}
      <NotificationModal
        visible={showSuccessModal}
        type="success"
        title={t('cookingMode.photoUpload.success.title')}
        message={t('cookingMode.photoUpload.success.message')}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
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
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  compressionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compressionText: {
    color: colors.buttonText,
    fontSize: 14,
    marginTop: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.buttonText,
  },
  secondaryButtonText: {
    color: colors.text,
  },
  skipButtonText: {
    color: colors.textSecondary,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    color: colors.buttonText,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressCircle: {
    marginBottom: 12,
  },
  progressText: {
    color: colors.buttonText,
    fontSize: 14,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 20,
  },
});