import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { StarRating } from '../ui/StarRating';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES } from '../../constants/animations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitRating: (rating: number, comment?: string) => Promise<void>;
  recipeName: string;
  isSubmitting?: boolean;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  onSubmitRating,
  recipeName,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Animation values
  const modalTranslateY = useSharedValue(screenHeight);
  const modalOpacity = useSharedValue(0);

  // Reset state when modal opens - using ShareModal animations
  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
      setShowCommentInput(false);
      
      // iOS sheet presentation timing
      modalOpacity.value = withTiming(1, { 
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) 
      });
      modalTranslateY.value = withSpring(0, SPRING_CONFIGS.MODAL);
    } else {
      // iOS sheet dismissal - faster opacity, slower slide for natural feel
      modalOpacity.value = withTiming(0, { 
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
      });
      modalTranslateY.value = withSpring(screenHeight, {
        damping: 35,
        stiffness: 400,
        mass: 1
      });
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        t('rating.error'),
        t('rating.pleaseSelectRating'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      await onSubmitRating(rating, comment.trim() || undefined);
      onClose();
    } catch (error) {
      console.log('Error submitting rating:', error);
      Alert.alert(
        t('common.error'),
        t('rating.submitError'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    // Show comment input for ratings 3 and below
    setShowCommentInput(newRating <= 3);
  };

  // Separate animated styles like ShareModal
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: screenHeight * 0.8,
      minHeight: screenHeight * 0.4,
      shadowColor: colors.shadow || '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: Math.max(insets?.bottom || 0, 16), // Dynamic safe area with minimum padding
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
      opacity: 0.6,
    },
    modalHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    modalContent: {
      flex: 1,
    },
    ratingSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    ratingLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 16,
    },
    ratingContainer: {
      marginBottom: 8,
    },
    ratingText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    commentSection: {
      marginBottom: 24,
    },
    commentLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 12,
    },
    commentInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      textAlignVertical: 'top',
      minHeight: 100,
      maxHeight: 150,
      lineHeight: 22,
    },
    commentPlaceholder: {
      color: colors.textSecondary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
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
    cancelButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    submitButtonDisabled: {
      backgroundColor: colors.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    submitButtonText: {
      color: colors.buttonText,
    },
    submitButtonTextDisabled: {
      color: colors.textSecondary,
    },
    thankYouContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    thankYouIcon: {
      marginBottom: 16,
    },
    thankYouText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    thankYouSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return t('rating.terrible');
      case 2: return t('rating.bad');
      case 3: return t('rating.okay');
      case 4: return t('rating.good');
      case 5: return t('rating.excellent');
      default: return '';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, backdropStyle]}>
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <View style={styles.modalHandle} />
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('rating.rateRecipe')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {recipeName}
            </Text>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t('rating.howWasRecipe')}
              </Text>
              
              <View style={styles.ratingContainer}>
                <StarRating
                  rating={rating}
                  size={40}
                  color="#FFD700"
                  emptyColor="#E5E5E5"
                  onRatingChange={handleRatingChange}
                  interactive={!isSubmitting}
                />
              </View>
              
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {getRatingText(rating)}
                </Text>
              )}
            </View>

            {showCommentInput && (
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>
                  {t('rating.tellUsMore')}
                </Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder={t('rating.commentPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={500}
                  editable={!isSubmitting}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (rating === 0 || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              <Text style={[
                styles.buttonText,
                styles.submitButtonText,
                (rating === 0 || isSubmitting) && styles.submitButtonTextDisabled
              ]}>
                {isSubmitting ? t('rating.submitting') : t('rating.submitRating')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};