import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Share,
  Alert,
  ScrollView,
} from 'react-native';
import { VectorIcon, MappedIcon } from '../ui/VectorIcon';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { imageCacheService } from '../../services/imageCacheService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  imageUrls: string[];
  initialIndex?: number;
  onClose: () => void;
  title?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUrls,
  initialIndex = 0,
  onClose,
  title,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cachedImageUri, setCachedImageUri] = useState<string | null>(null);

  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Get current image URL
  const currentImageUrl = imageUrls[currentIndex] || '';

  // Reset index when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  // Cache image when modal opens or index changes
  React.useEffect(() => {
    if (visible && currentImageUrl) {
      setImageLoaded(false);
      setImageError(false);
      setCachedImageUri(null);

      imageCacheService.getCachedImage(currentImageUrl)
        .then(cachedUri => {
          setCachedImageUri(cachedUri);
        })
        .catch(error => {
          console.warn('Failed to cache image for viewer:', error);
          setCachedImageUri(currentImageUrl); // Fallback to original URL
        });
    }
  }, [visible, currentImageUrl]);

  const handleShare = async () => {
    try {
      await Share.share({
        url: currentImageUrl,
        message: title ? `${title} - ${t('recipes.dishPhoto')}` : t('recipes.dishPhoto'),
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert(t('common.error'), t('common.shareError'));
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < imageUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            activeOpacity={0.7}
            testID="close-button"
          >
            <MappedIcon icon="close" size={28} color="white" filled />
          </TouchableOpacity>

          {title && (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          )}

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
            activeOpacity={0.7}
            testID="share-button"
          >
            <MappedIcon icon="share" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          {!imageError && cachedImageUri ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={styles.imageWrapper}
              >
                <Image
                  source={{ uri: cachedImageUri }}
                  style={styles.image}
                  resizeMode="contain"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  testID="dish-image"
                />
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <MappedIcon icon="image" size={64} color="rgba(255,255,255,0.5)" />
              <Text style={styles.errorText}>
                {imageError ? t('common.imageLoadError') : t('common.loading')}
              </Text>
            </View>
          )}

          {!imageLoaded && !imageError && cachedImageUri && (
            <View style={styles.loadingContainer}>
              <MappedIcon icon="image" size={48} color="rgba(255,255,255,0.7)" />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          )}

          {/* Navigation Controls */}
          {imageUrls.length > 1 && (
            <>
              {currentIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={handlePrevious}
                  activeOpacity={0.7}
                  testID="previous-button"
                >
                  <MappedIcon icon="arrowBack" size={32} color="white" filled />
                </TouchableOpacity>
              )}

              {currentIndex < imageUrls.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={handleNext}
                  activeOpacity={0.7}
                  testID="next-button"
                >
                  <MappedIcon icon="arrowForward" size={32} color="white" filled />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Image Counter */}
        {imageUrls.length > 1 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {imageUrls.length}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {t('recipes.imageViewInstructions')}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 12,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  counterContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  counterText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
});