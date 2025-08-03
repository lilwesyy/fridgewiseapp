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
import { APP_TYPOGRAPHY } from '../../constants/typography';
import { INTERACTION_CONFIG, BORDER_RADIUS, SHADOWS, SPACING } from '../../constants/interactions';

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
      handleClose();
    }
  };

  const handleFullShare = async () => {
    if (recipe) {
      await shareRecipeFull(recipe, t);
      handleClose();
    }
  };

  const handleClose = () => {
    // Start closing animation
    opacity.value = withTiming(0, { 
      duration: ANIMATION_DURATIONS.MODAL * 0.8,
      easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
    });
    slideY.value = withSpring(screenHeight, {
      damping: 25,
      stiffness: 300,
      mass: 0.8
    }, () => {
      runOnJS(onClose)();
    });
  };

  const handleBackdropPress = () => {
    handleClose();
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
                <TouchableOpacity activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY} style={styles.option} onPress={handleQuickShare}>
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

                <TouchableOpacity activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY} style={styles.option} onPress={handleFullShare}>
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

              <TouchableOpacity activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY} style={styles.cancelButton} onPress={handleClose}>
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
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    paddingBottom: Math.max(insets?.bottom || 0, SPACING.MD),
    minHeight: 300,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.SM,
    marginBottom: SPACING.LG,
  },
  header: {
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  title: {
    ...APP_TYPOGRAPHY.MODAL_TITLE,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...APP_TYPOGRAPHY.MODAL_SUBTITLE,
    color: colors.textSecondary,
  },
  options: {
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BORDER_RADIUS.STANDARD,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...APP_TYPOGRAPHY.LIST_TITLE,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    ...APP_TYPOGRAPHY.LIST_SUBTITLE,
    color: colors.textSecondary,
  },
  optionArrow: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: colors.card,
    borderRadius: BORDER_RADIUS.STANDARD,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...APP_TYPOGRAPHY.BUTTON_SECONDARY,
    color: colors.textSecondary,
  },
});