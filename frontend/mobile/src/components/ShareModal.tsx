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
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { shareRecipeQuick, shareRecipeFull } from '../utils/shareUtils';

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
  const slideY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      slideY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      slideY.value = withTiming(screenHeight, { duration: 200 });
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
                <TouchableOpacity style={styles.option} onPress={handleQuickShare}>
                  <View style={styles.optionIcon}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                        stroke="rgb(22, 163, 74)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="rgba(22, 163, 74, 0.1)"
                      />
                    </Svg>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{t('share.shareQuick')}</Text>
                    <Text style={styles.optionDescription}>
                      {t('share.quickShareDescription')}
                    </Text>
                  </View>
                  <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={handleFullShare}>
                  <View style={styles.optionIcon}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="rgba(59, 130, 246, 0.1)"
                      />
                      <Path
                        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
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

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
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
    minHeight: 300,
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  options: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  optionArrow: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
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