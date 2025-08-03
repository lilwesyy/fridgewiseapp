import React, { useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { VectorIcon, MappedIcon } from '../../../ui/VectorIcon';
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

interface RecipesSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: 'my-recipes' | 'explore';
}

export const RecipesSearchBar: React.FC<RecipesSearchBarProps> = ({ 
  searchQuery, 
  onSearchChange, 
  activeTab 
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(20);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    searchOpacity.value = withDelay(100, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    searchTranslateY.value = withDelay(100, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, []);

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ translateY: searchTranslateY.value }],
  }));

  const placeholder = activeTab === 'my-recipes' 
    ? t('recipes.searchPlaceholder') 
    : t('recipes.searchCollections');

  return (
    <Animated.View style={[styles.searchBarContainer, searchAnimatedStyle]}>
      <MappedIcon 
        icon="search" 
        size={20} 
        color="#6B7280" 
        style={styles.searchIcon} 
      />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholderTextColor="#6B7280"
        textContentType="none"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 14,
    fontSize: 17,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#1D1D1F',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
});