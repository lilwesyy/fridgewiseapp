import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HapticTouchableOpacity from '../../../common/HapticTouchableOpacity';
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

interface Recipe {
  id?: string;
  _id?: string;
  cookedAt?: string;
  isSaved?: boolean;
  isPublicRecipe?: boolean;
}

interface RecipeFooterProps {
  recipe: Recipe;
  isJustGenerated?: boolean;
  isPublic?: boolean;
  onStartCooking: () => void;
  onStartOver?: () => void;
  onChatAI?: () => void;
}

export const RecipeFooter: React.FC<RecipeFooterProps> = ({
  recipe,
  isJustGenerated = false,
  isPublic = false,
  onStartCooking,
  onStartOver,
  onChatAI,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(50);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    buttonsOpacity.value = withDelay(525, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    buttonsTranslateY.value = withDelay(525, withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
  }, [recipe.id]);

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const getCookingButtonText = () => {
    if (isJustGenerated) {
      return t('recipe.saveRecipe');
    }
    return (recipe.cookedAt || recipe.isPublicRecipe) 
      ? t('recipe.cookAgain') 
      : t('recipe.startCooking');
  };


  return (
    <Animated.View style={[styles.footer, buttonsAnimatedStyle]}>
      {isJustGenerated ? (
        <View style={styles.dualButtonContainer}>
          {onStartOver && (
            <HapticTouchableOpacity 
              hapticType="medium" 
              style={styles.startOverButton} 
              onPress={onStartOver}
            >
              <Text style={styles.startOverButtonText}>{t('common.startOver')}</Text>
            </HapticTouchableOpacity>
          )}
          <HapticTouchableOpacity 
            hapticType="primary" 
            style={styles.startCookingButton} 
            onPress={onStartCooking}
          >
            <Text style={styles.startCookingButtonText}>{getCookingButtonText()}</Text>
          </HapticTouchableOpacity>
        </View>
      ) : recipe.isSaved === true ? (
        <View style={styles.dualButtonContainer}>
          <TouchableOpacity style={styles.startCookingButton} onPress={onStartCooking} activeOpacity={0.7}>
            <Text style={styles.startCookingButtonText}>
              {getCookingButtonText()}
            </Text>
          </TouchableOpacity>
          {!isPublic && !recipe.isPublicRecipe && onChatAI && (
            <TouchableOpacity style={styles.aiEditButton} onPress={onChatAI} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary} style={styles.aiEditIcon} />
              <Text style={styles.aiEditButtonText}>{t('common.edit') || 'Modifica'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.dualButtonContainer}>
          <TouchableOpacity style={styles.startCookingButton} onPress={onStartCooking} activeOpacity={0.7}>
            <Text style={styles.startCookingButtonText}>
              {getCookingButtonText()}
            </Text>
          </TouchableOpacity>
          {!isPublic && !recipe.isPublicRecipe && onChatAI && (
            <TouchableOpacity style={styles.aiEditButton} onPress={onChatAI} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary} style={styles.aiEditIcon} />
              <Text style={styles.aiEditButtonText}>{t('common.edit') || 'Modifica'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const getStyles = (colors: any, insets: { bottom: number }) => StyleSheet.create({
  footer: {
    paddingTop: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF', // White like other screens
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 20), // Exact match with tab bar
  },
  dualButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  startOverButton: {
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  startOverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  startCookingButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  startCookingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  aiEditButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiEditIcon: {
    marginRight: 8,
  },
  aiEditButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});