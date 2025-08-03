import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { VectorIcon, MappedIcon } from '../../../ui/VectorIcon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  SPRING_CONFIGS, 
  EASING_CURVES 
} from '../../../../constants/animations';

interface SavedHeaderProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // Filters
  difficultyFilter: string;
  tagFilter: string;
  onDifficultyChange: (difficulty: string) => void;
  onTagChange: (tag: string) => void;
}

export const SavedHeader: React.FC<SavedHeaderProps> = ({ 
  searchQuery,
  onSearchChange,
  difficultyFilter,
  tagFilter,
  onDifficultyChange,
  onTagChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerTranslateY = useSharedValue(-30);
  
  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(20);
  
  const filtersOpacity = useSharedValue(0);
  const filtersTranslateX = useSharedValue(-50);

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
    
    searchOpacity.value = withDelay(100, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    searchTranslateY.value = withDelay(100, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    
    filtersOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
    filtersTranslateX.value = withDelay(150, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      { scale: headerScale.value },
      { translateY: headerTranslateY.value }
    ],
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ translateY: searchTranslateY.value }],
  }));

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    opacity: filtersOpacity.value,
    transform: [{ translateX: filtersTranslateX.value }],
  }));
  
  const dietaryTags = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
    'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'
  ];

  const handleDifficultyChange = (difficulty: string) => {
    if (difficultyFilter === difficulty) {
      onDifficultyChange('');
    } else {
      onDifficultyChange(difficulty);
      onTagChange(''); // Reset tag when selecting difficulty
    }
  };

  const handleTagChange = (tag: string) => {
    if (tagFilter === tag) {
      onTagChange('');
    } else {
      onTagChange(tag);
      onDifficultyChange(''); // Reset difficulty when selecting tag
    }
  };

  return (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <Text style={styles.title}>{t('saved.title')}</Text>
      <Text style={styles.subtitle}>{t('saved.subtitle')}</Text>

      {/* Search Bar */}
      <Animated.View style={[styles.searchBarContainer, searchAnimatedStyle]}>
        <MappedIcon 
          icon="search" 
          size={20} 
          color="#6B7280" 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('recipes.searchPlaceholder')}
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

      {/* Filters */}
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
              !difficultyFilter && !tagFilter && styles.activeFilterBadge
            ]}
            onPress={() => {
              onDifficultyChange('');
              onTagChange('');
            }}
          >
            <Text style={[
              styles.filterBadgeText,
              !difficultyFilter && !tagFilter && styles.activeFilterBadgeText
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
                difficultyFilter === diff && styles.activeFilterBadge
              ]}
              onPress={() => handleDifficultyChange(diff)}
            >
              <Text style={[
                styles.filterBadgeText,
                difficultyFilter === diff && styles.activeFilterBadgeText
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
                tagFilter === tag && styles.activeFilterBadge
              ]}
              onPress={() => handleTagChange(tag)}
            >
              <Text style={[
                styles.filterBadgeText,
                tagFilter === tag && styles.activeFilterBadgeText
              ]}>
                {t(`recipes.dietary.${tag.replace('-', '')}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

const getStyles = (colors: any, insets: { top: number }) => StyleSheet.create({
  header: {
    padding: 24,
    paddingTop: insets.top + 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '400',
    letterSpacing: -0.1,
    textAlign: 'left',
  },
  // Search Bar Styles
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
    borderRadius: 16,
    marginBottom: 16,
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
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#1D1D1F',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  // Filters Styles
  filtersScroll: {
    marginTop: 0,
    marginBottom: 8,
    maxHeight: 44,
  },
  filtersScrollContent: {
    alignItems: 'center',
    paddingRight: 10,
  },
  filterBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#F1F5F9',
  },
  activeFilterBadge: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: '#6B7280',
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },
});