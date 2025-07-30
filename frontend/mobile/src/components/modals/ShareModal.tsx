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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { shareRecipeQuick, shareRecipeFull } from '../../utils/shareUtils';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES } from '../../constants/animations';

const { height: screenHeight } = Dimensions.get('window');

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
}

interface ShareModalProps {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ visible, recipe, onClose }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  const slideY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // iOS sheet presentation timing
      opacity.value = withTiming(1, { 
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) 
      });
      slideY.value = withSpring(0, SPRING_CONFIGS.MODAL);
    } else {
      // iOS sheet dismissal - faster opacity, slower slide for natural feel
      opacity.value = withTiming(0, { 
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
      });
      slideY.value = withSpring(screenHeight, {
        damping: 35,
        stiffness: 400,
        mass: 1
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const handleQuickShare = async () => {
    if (recipe) {
      await shareRecipeQuick(recipe, t);
      runOnJS(onClose)();
    }
  };

  const handleFullShare = async () => {
    if (recipe) {
      await shareRecipeFull(recipe, t);
      runOnJS(onClose)();
    }
  };

  const handleBackdropPress = () => {
    onClose();
  };

  if (!visible || !recipe) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modal, modalStyle]}>
              <View style={styles.handle} />
              
              <View style={styles.header}>
                <Text style={styles.title}>{t('share.shareRecipe')}</Text>
                <Text style={styles.subtitle}>{recipe.title}</Text>
              </View>

              <View style={styles.options}>
                <TouchableOpacity activeOpacity={0.7} style={styles.option} onPress={handleQuickShare}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="flash" size={24} color={colors.success} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{t('share.shareQuick')}</Text>
                    <Text style={styles.optionDescription}>
                      {t('share.quickShareDescription')}
                    </Text>
                  </View>
                  <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7} style={styles.option} onPress={handleFullShare}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="document-text" size={24} color="rgb(59, 130, 246)" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{t('share.shareFull')}</Text>
                    <Text style={styles.optionDescription}>
                      {t('share.fullShareDescription')}
                    </Text>
                  </View>
                  <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.7} style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (colors: any, insets?: { bottom: number }) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Math.max(insets?.bottom || 0, 16), // Dynamic safe area with minimum padding
    minHeight: 300,
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  options: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  optionArrow: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
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