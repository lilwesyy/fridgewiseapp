import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
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

interface Recipe {
  id?: string;
  _id?: string;
  isPublicRecipe?: boolean;
}

interface RecipeDeleteSectionProps {
  recipe: Recipe;
  isPublic?: boolean;
  onDelete: () => void;
}

export const RecipeDeleteSection: React.FC<RecipeDeleteSectionProps> = ({
  recipe,
  isPublic = false,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const deleteOpacity = useSharedValue(0);
  const deleteTranslateY = useSharedValue(30);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    deleteOpacity.value = withDelay(600, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    deleteTranslateY.value = withDelay(600, withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
  }, [recipe.id]);

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
    transform: [{ translateY: deleteTranslateY.value }],
  }));

  const getDeleteButtonText = () => {
    return recipe.isPublicRecipe 
      ? t('saved.removeFromSaved') 
      : t('recipe.deleteRecipe');
  };

  const getDeleteButtonColor = () => {
    return recipe.isPublicRecipe ? '#F59E0B' : '#EF4444'; // warning : error
  };

  const getDeleteIcon = () => {
    return recipe.isPublicRecipe ? "bookmark-outline" : "trash-outline";
  };

  // Don't show delete section for public recipes
  if (isPublic) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, deleteAnimatedStyle]}>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: getDeleteButtonColor() }]}
        onPress={onDelete}
        activeOpacity={0.8}
      >
        <Ionicons
          name={getDeleteIcon()}
          size={20}
          color="white"
          style={styles.deleteIcon}
        />
        <Text style={styles.deleteButtonText}>
          {getDeleteButtonText()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});