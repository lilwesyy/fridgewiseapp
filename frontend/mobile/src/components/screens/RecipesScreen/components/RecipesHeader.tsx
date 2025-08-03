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

interface RecipesHeaderProps {
  activeTab: 'my-recipes' | 'explore';
  onTabChange: (tab: 'my-recipes' | 'explore') => void;
  // Search
  searchQuery: string;
  collectionsSearchQuery: string;
  onSearchChange: (query: string) => void;
  onCollectionsSearchChange: (query: string) => void;
  // Filters
  difficultyFilter: string;
  tagFilter: string;
  publicDifficultyFilter: string;
  publicTagFilter: string;
  onDifficultyChange: (difficulty: string) => void;
  onTagChange: (tag: string) => void;
  onPublicDifficultyChange: (difficulty: string) => void;
  onPublicTagChange: (tag: string) => void;
}

export const RecipesHeader: React.FC<RecipesHeaderProps> = ({ 
  activeTab, 
  onTabChange,
  searchQuery,
  collectionsSearchQuery,
  onSearchChange,
  onCollectionsSearchChange,
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

  const currentSearchQuery = activeTab === 'my-recipes' ? searchQuery : collectionsSearchQuery;
  const currentDifficultyFilter = activeTab === 'my-recipes' ? difficultyFilter : publicDifficultyFilter;
  const currentTagFilter = activeTab === 'my-recipes' ? tagFilter : publicTagFilter;
  
  const dietaryTags = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
    'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'
  ];

  const handleSearchChange = (query: string) => {
    if (activeTab === 'my-recipes') {
      onSearchChange(query);
    } else {
      onCollectionsSearchChange(query);
    }
  };

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
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <Text style={styles.title}>{t('recipes.title')}</Text>
      <Text style={styles.subtitle}>{t('recipes.subtitle')}</Text>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-recipes' && styles.activeTab]}
          onPress={() => onTabChange('my-recipes')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'my-recipes' && styles.activeTabText]}>
            {t('recipes.myRecipes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
          onPress={() => onTabChange('explore')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>
            {t('recipes.explore')}
          </Text>
        </TouchableOpacity>
      </View>

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
          placeholder={activeTab === 'my-recipes' ? t('recipes.searchPlaceholder') : t('recipes.searchCollections')}
          value={currentSearchQuery}
          onChangeText={handleSearchChange}
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
                  handleTagChange('');
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
                  handleDifficultyChange('');
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
    fontSize: 28, // Come SavedScreen
    fontWeight: '700', // bold del SavedScreen
    color: '#1D1D1F',
    marginBottom: 4, // Come SavedScreen
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15, // Come SavedScreen
    color: '#6B7280',
    marginBottom: 10, // Come SavedScreen
    fontWeight: '400',
    letterSpacing: -0.1,
    textAlign: 'left',
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
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
    paddingVertical: 12, // Come SavedScreen
    fontSize: 16, // Come SavedScreen
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
    paddingHorizontal: 14, // Come SavedScreen
    paddingVertical: 8, // Come SavedScreen
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
    fontSize: 14, // Come SavedScreen
    fontWeight: '500', // Come SavedScreen
    letterSpacing: -0.1,
    color: '#6B7280',
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },
});