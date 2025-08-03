import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  SPRING_CONFIGS, 
  EASING_CURVES 
} from '../../../../constants/animations';

interface RecipeHeaderProps {
  onGoBack: () => void;
  onShare: () => void;
  title: string;
  currentIndex?: number;
  totalRecipes?: number;
  isJustGenerated?: boolean;
  recipeId?: string;
  onGoToRecipes?: () => void;
}

export const RecipeHeader: React.FC<RecipeHeaderProps> = ({
  onGoBack,
  onShare,
  title,
  currentIndex,
  totalRecipes,
  isJustGenerated,
  recipeId,
  onGoToRecipes,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerTranslateY = useSharedValue(-30);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    headerScale.value = withSpring(1, SPRING_CONFIGS.GENTLE);
    headerTranslateY.value = withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      { scale: headerScale.value },
      { translateY: headerTranslateY.value }
    ],
  }));

  const handleBackPress = () => {
    // If recipe was just generated but now has an ID, it means it was saved
    // In this case, go to recipes page instead of back to ingredient selection
    if (isJustGenerated && recipeId) {
      onGoToRecipes?.();
    } else {
      onGoBack();
    }
  };

  return (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {totalRecipes && totalRecipes > 1 && currentIndex !== undefined && (
          <Text style={styles.recipeCounter}>
            {currentIndex + 1} / {totalRecipes}
          </Text>
        )}
      </View>
      
      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: any, insets: { top: number }) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: insets.top + 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7', // Match system background
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(60, 60, 67, 0.29)', // iOS separator
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: -0.2,
  },
  recipeCounter: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 10,
    marginRight: -10,
  },
});