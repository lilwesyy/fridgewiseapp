import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
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

interface RecipesFiltersProps {
  activeTab: 'my-recipes' | 'explore';
  difficultyFilter: string;
  tagFilter: string;
  publicDifficultyFilter: string;
  publicTagFilter: string;
  onDifficultyChange: (difficulty: string) => void;
  onTagChange: (tag: string) => void;
  onPublicDifficultyChange: (difficulty: string) => void;
  onPublicTagChange: (tag: string) => void;
}

export const RecipesFilters: React.FC<RecipesFiltersProps> = ({
  activeTab,
  difficultyFilter,
  tagFilter,
  publicDifficultyFilter,
  publicTagFilter,
  onDifficultyChange,
  onTagChange,
  onPublicDifficultyChange,
  onPublicTagChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const filtersOpacity = useSharedValue(0);
  const filtersTranslateX = useSharedValue(-50);

  const dietaryTags = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
    'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'
  ];

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    filtersOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    filtersTranslateX.value = withDelay(150, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, []);

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    opacity: filtersOpacity.value,
    transform: [{ translateX: filtersTranslateX.value }],
  }));

  const currentDifficultyFilter = activeTab === 'my-recipes' ? difficultyFilter : publicDifficultyFilter;
  const currentTagFilter = activeTab === 'my-recipes' ? tagFilter : publicTagFilter;

  const handleDifficultyChange = (difficulty: string) => {
    if (activeTab === 'my-recipes') {
      onDifficultyChange(difficulty);
    } else {
      onPublicDifficultyChange(difficulty);
    }
  };

  const handleTagChange = (tag: string) => {
    if (activeTab === 'my-recipes') {
      onTagChange(tag);
    } else {
      onPublicTagChange(tag);
    }
  };

  return (
    <Animated.View style={filtersAnimatedStyle}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersScroll} 
        contentContainerStyle={styles.filtersScrollContent}
      >
        {/* All Filter */}
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[
            styles.filterBadge, 
            !currentDifficultyFilter && !currentTagFilter && styles.activeFilterBadge
          ]}
          onPress={() => {
            handleDifficultyChange('');
            handleTagChange('');
          }}
        >
          <Text style={[
            styles.filterBadgeText,
            !currentDifficultyFilter && !currentTagFilter && styles.activeFilterBadgeText
          ]}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>

        {/* Difficulty Filters */}
        {['easy', 'medium', 'hard'].map(diff => (
          <TouchableOpacity 
            activeOpacity={0.7}
            key={diff}
            style={[
              styles.filterBadge,
              currentDifficultyFilter === diff && styles.activeFilterBadge
            ]}
            onPress={() => {
              if (currentDifficultyFilter === diff) {
                handleDifficultyChange('');
              } else {
                handleDifficultyChange(diff);
                handleTagChange(''); // Reset tag when selecting difficulty
              }
            }}
          >
            <Text style={[
              styles.filterBadgeText,
              currentDifficultyFilter === diff && styles.activeFilterBadgeText
            ]}>
              {t(`recipes.difficulty.${diff}`)}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Dietary Tags */}
        {dietaryTags.map(tag => (
          <TouchableOpacity 
            activeOpacity={0.7}
            key={tag}
            style={[
              styles.filterBadge,
              currentTagFilter === tag && styles.activeFilterBadge
            ]}
            onPress={() => {
              if (currentTagFilter === tag) {
                handleTagChange('');
              } else {
                handleTagChange(tag);
                handleDifficultyChange(''); // Reset difficulty when selecting tag
              }
            }}
          >
            <Text style={[
              styles.filterBadgeText,
              currentTagFilter === tag && styles.activeFilterBadgeText
            ]}>
              {t(`recipes.dietary.${tag.replace('-', '')}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  filtersScroll: {
    marginTop: 0,
    marginBottom: 8,
    maxHeight: 44,
    paddingHorizontal: 24,
  },
  filtersScrollContent: {
    alignItems: 'center',
    paddingRight: 24,
  },
  filterBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeFilterBadge: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: '#6B7280',
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },
});