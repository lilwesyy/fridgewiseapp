import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Image } from 'expo-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  EASING_CURVES 
} from '../../../../constants/animations';
import { INTERACTION_CONFIG } from '../../../../constants/interactions';

const { width: screenWidth } = Dimensions.get('window');

interface DishPhoto {
  url: string;
  publicId: string;
}

interface Recipe {
  id?: string;
  _id?: string;
  cookedAt?: string;
  dishPhotos?: DishPhoto[];
  isPublicRecipe?: boolean;
}

interface RecipePhotoSectionProps {
  recipe: Recipe;
  isPublic?: boolean;
  currentPhotoIndex: number;
  setCurrentPhotoIndex: (index: number) => void;
  forceUpdateCounter: number;
  isUploadingPhoto: boolean;
  onAddPhoto: () => void;
  onViewPhoto: (photoUrl?: string, photoIndex?: number) => void;
  onDeletePhotoConfirmation: (photoIndex: number) => void;
}

export const RecipePhotoSection: React.FC<RecipePhotoSectionProps> = ({
  recipe,
  isPublic = false,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  forceUpdateCounter,
  isUploadingPhoto,
  onAddPhoto,
  onViewPhoto,
  onDeletePhotoConfirmation,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const photoOpacity = useSharedValue(0);
  const photoTranslateY = useSharedValue(30);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    photoOpacity.value = withDelay(250, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    photoTranslateY.value = withDelay(250, withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
  }, [recipe.id, forceUpdateCounter]);

  const photoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
    transform: [{ translateY: photoTranslateY.value }],
  }));

  // Only show photo section if conditions are met
  const shouldShowPhotoSection = isPublic
    ? (recipe.dishPhotos && recipe.dishPhotos.length > 0) // For public recipes: show only if has photos
    : (recipe.cookedAt || (recipe.dishPhotos && recipe.dishPhotos.length > 0)); // For personal recipes: show if cooked or has photos

  if (!shouldShowPhotoSection) {
    return null;
  }

  return (
    <Animated.View 
      key={`photos-section-${recipe.dishPhotos?.length || 0}-${forceUpdateCounter}`}
      style={[styles.container, photoAnimatedStyle]}
    >
      {(recipe.dishPhotos?.length || 0) > 0 ? (
        <View style={styles.photoSliderContainer}>
          {/* Photo Slider */}
          <ScrollView
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={styles.photoSlider}
            onScroll={(event) => {
              const slideWidth = screenWidth - 32; // Consider only inner container padding
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / slideWidth
              );
              setCurrentPhotoIndex(slideIndex);
            }}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={screenWidth - 32}
            snapToAlignment="start"
            bounces={false}
          >
            {(recipe.dishPhotos || []).map((photo, index) => (
              <View key={`${photo.url}-${index}`} style={styles.photoSlide}>
                <View style={styles.photoSlideWrapper}>
                  <TouchableOpacity
                    onPress={() => isPublic ? onViewPhoto(photo.url, index) : null}
                    activeOpacity={isPublic ? INTERACTION_CONFIG.ACTIVE_OPACITY : 1}
                    style={{ flex: 1 }}
                  >
                    <Image
                      source={{ uri: photo.url }}
                      style={styles.photoSlideImage}
                      contentFit="cover"
                      transition={500}
                      cachePolicy="memory-disk"
                      placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
                      testID={`dish-photo-image-${index}`}
                    />
                  </TouchableOpacity>
                  
                  {/* View Photo Overlay */}
                  <TouchableOpacity
                    style={styles.photoViewOverlay}
                    onPress={() => onViewPhoto(photo.url, index)}
                    activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}
                  >
                    <Ionicons name="expand-outline" size={18} color="white" />
                  </TouchableOpacity>

                  {/* Delete Photo Overlay */}
                  {!isPublic && !recipe.isPublicRecipe && (
                    <TouchableOpacity
                      style={styles.photoDeleteOverlay}
                      onPress={(e) => {
                        e.stopPropagation();
                        onDeletePhotoConfirmation(index);
                      }}
                      activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}
                    >
                      <Ionicons name="trash-outline" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Add Photo Slide */}
            {!isPublic && !recipe.isPublicRecipe && (recipe.dishPhotos?.length || 0) < 3 && (
              <View style={styles.photoSlide}>
                <TouchableOpacity
                  style={styles.addPhotoSlide}
                  onPress={onAddPhoto}
                  disabled={isUploadingPhoto}
                  activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}
                >
                  <View style={styles.addPhotoSlideContent}>
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
                    ) : (
                      <>
                        <Ionicons name="add-outline" size={40} color={colors.primary} />
                        <Text style={styles.addPhotoSlideText}>
                          {t('recipes.addPhoto')}
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Page Indicators */}
          {((recipe.dishPhotos?.length || 0) > 1 || (!isPublic && (recipe.dishPhotos?.length || 0) < 3)) && (
            <View style={styles.photoIndicators}>
              {Array.from({ 
                length: (recipe.dishPhotos?.length || 0) + (!isPublic && (recipe.dishPhotos?.length || 0) < 3 ? 1 : 0) 
              }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.photoIndicator,
                    {
                      backgroundColor: index === currentPhotoIndex ? colors.primary : '#E2E8F0',
                      opacity: index === currentPhotoIndex ? 1 : 0.3
                    }
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : recipe.cookedAt && !recipe.isPublicRecipe && (
        <TouchableOpacity
          style={styles.noPhotoContainer}
          onPress={onAddPhoto}
          disabled={isUploadingPhoto}
          activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}
        >
          <View style={styles.noPhotoPlaceholder}>
            {isUploadingPhoto ? (
              <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={48} color={colors.primary} />
                <Text style={styles.noPhotoText}>
                  {t('recipes.addPhoto')}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  // Photo Slider Styles
  photoSliderContainer: {
    marginBottom: 16,
  },
  photoSlider: {
    height: 280,
  },
  photoSlide: {
    width: screenWidth - 32, // Screen width minus small padding
    paddingHorizontal: 16, // Internal padding for photos
    marginHorizontal: 0,
  },
  photoSlideWrapper: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoSlideImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addPhotoSlide: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16, // Same padding as photo slides
  },
  addPhotoSlideContent: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  addPhotoSlideText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: -0.1,
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  photoViewOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  photoDeleteOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error || '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  noPhotoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noPhotoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  noPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.1,
  },
});