import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  PanResponder,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteText: string;
  resetTrigger?: number; // Add reset trigger prop
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onDelete, deleteText, resetTrigger }) => {
  const translateX = new Animated.Value(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const deleteButtonWidth = 100;

  // Reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined) {
      Animated.spring(translateX, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: false,
      }).start();
      setIsRevealed(false);
    }
  }, [resetTrigger]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        // Swipe left - reveal delete button
        const newTranslateX = Math.max(gestureState.dx, -deleteButtonWidth);
        translateX.setValue(newTranslateX);
      } else if (gestureState.dx > 0 && isRevealed) {
        // Swipe right when already revealed - hide delete button
        const newTranslateX = Math.min(gestureState.dx - deleteButtonWidth, 0);
        translateX.setValue(newTranslateX);
      } else if (gestureState.dx > 0 && !isRevealed) {
        // Swipe right when not revealed - keep at 0
        translateX.setValue(0);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        // Swipe left enough to reveal delete button
        Animated.spring(translateX, {
          toValue: -deleteButtonWidth,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }).start();
        setIsRevealed(true);
      } else if (gestureState.dx > 50 && isRevealed) {
        // Swipe right enough to hide delete button when revealed
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }).start();
        setIsRevealed(false);
      } else {
        // Snap to appropriate position based on current state
        const targetValue = isRevealed ? -deleteButtonWidth : 0;
        Animated.spring(translateX, {
          toValue: targetValue,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const handleDelete = () => {
    // Animate the deletion
    Animated.timing(translateX, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onDelete();
    });
  };

  const hideDeleteButton = () => {
    Animated.spring(translateX, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start();
    setIsRevealed(false);
  };

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity
        style={styles.deleteBackground}
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="trash" size={24} color="white" />
        <Text style={styles.deleteText}>{deleteText}</Text>
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.swipeRow,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

interface SavedRecipe {
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
  language: 'en' | 'it';
  savedAt: string;
}

interface SavedScreenProps {
  onSelectRecipe: (recipe: SavedRecipe, allRecipes: SavedRecipe[], index: number) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ onSelectRecipe }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<SavedRecipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [resetTrigger, setResetTrigger] = useState(0);
  const dietaryTags = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'
  ];

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  // Reset swipe states when component becomes visible
  useEffect(() => {
    setResetTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, savedRecipes, difficultyFilter, tagFilter]);

  const fetchSavedRecipes = async () => {
    try {
      setIsLoading(true);
      // Reset all swipe states when refreshing
      setResetTrigger(prev => prev + 1);
      
      const response = await fetch(`${API_URL}/api/recipe/saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Handle the new response structure from getSavedRecipes
        if (data.data && Array.isArray(data.data.recipes)) {
          setSavedRecipes(data.data.recipes);
        } else {
          setSavedRecipes([]);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch saved recipes');
      }
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      Alert.alert(t('common.error'), t('saved.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = savedRecipes;
    if (searchQuery.trim()) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    if (difficultyFilter) {
      filtered = filtered.filter(recipe => recipe.difficulty === difficultyFilter);
    }
    if (tagFilter) {
      filtered = filtered.filter(recipe => recipe.dietaryTags.includes(tagFilter));
    }
    setFilteredRecipes(filtered);
  };

  const removeFromSaved = async (recipeId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/recipe/saved/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSavedRecipes(prev => prev.filter(recipe => {
          const currentRecipeId = (recipe as any)._id || recipe.id;
          return currentRecipeId !== recipeId;
        }));
        Alert.alert(t('common.success'), t('saved.removedSuccess'));
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove recipe');
      }
    } catch (error) {
      console.error('Error removing saved recipe:', error);
      Alert.alert(t('common.error'), t('saved.removeError'));
    }
  };

  const confirmRemove = (recipe: SavedRecipe) => {
    Alert.alert(
      t('saved.removeTitle'),
      t('saved.removeMessage', { title: recipe.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.remove'), style: 'destructive', onPress: () => {
          const recipeId = (recipe as any)._id || recipe.id;
          removeFromSaved(recipeId);
        }}
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#28A745';
      case 'medium':
        return '#FFC107';
      case 'hard':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderSavedRecipe = ({ item }: { item: SavedRecipe }) => (
    <SwipeableRow
      onDelete={() => confirmRemove(item)}
      deleteText={t('common.remove')}
      resetTrigger={resetTrigger}
    >
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => onSelectRecipe(item)}
        activeOpacity={0.7}
      >
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.headerActions}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
              <Text style={styles.difficultyText}>
                {t(`recipes.difficulty.${item.difficulty}`)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => confirmRemove(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.recipeDescription} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.recipeMetadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>⏱️ {item.cookingTime} min</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>👥 {item.servings}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>🥘 {item.ingredients.length} {t('recipe.ingredients')}</Text>
          </View>
        </View>

        {item.dietaryTags.length > 0 && (
          <View style={styles.dietaryTags}>
            {item.dietaryTags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.dietaryTag}>
                <Text style={styles.dietaryTagText}>
                  {t(`recipes.dietary.${tag.replace('-', '')}`)}
                </Text>
              </View>
            ))}
            {item.dietaryTags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.dietaryTags.length - 3}</Text>
            )}
          </View>
        )}

        <Text style={styles.recipeDate}>{t('saved.savedOn')} {formatDate(item.savedAt)}</Text>
      </TouchableOpacity>
    </SwipeableRow>
  );


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('saved.title')}</Text>
        <Text style={styles.subtitle}>{t('saved.subtitle')}</Text>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('recipes.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersScrollContent}>
          <TouchableOpacity
            style={[styles.filterBadge, !difficultyFilter && styles.filterBadgeActive]}
            onPress={() => setDifficultyFilter('')}
          >
            <Text style={[styles.filterBadgeText, !difficultyFilter && styles.filterBadgeTextActive]}>{t('common.all')}</Text>
          </TouchableOpacity>
          {['easy','medium','hard'].map(diff => (
            <TouchableOpacity
              key={diff}
              style={[styles.filterBadge, difficultyFilter === diff && styles.filterBadgeActive]}
              onPress={() => setDifficultyFilter(diff)}
            >
              <Text style={[styles.filterBadgeText, difficultyFilter === diff && styles.filterBadgeTextActive]}>{t(`recipes.difficulty.${diff}`)}</Text>
            </TouchableOpacity>
          ))}
          {dietaryTags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.filterBadge, tagFilter === tag && styles.filterBadgeActive]}
              onPress={() => setTagFilter(tag)}
            >
              <Text style={[styles.filterBadgeText, tagFilter === tag && styles.filterBadgeTextActive]}>{t(`recipes.dietary.${tag.replace('-', '')}`)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={{ marginBottom: 16 }}>
            <Svg width={64} height={64} viewBox="0 0 48 48" fill="none">
              <Rect x={6} y={8} width={36} height={32} rx={4} stroke="#16A34A" strokeWidth={2.5} fill="#F1F5F9"/>
              <Rect x={12} y={14} width={24} height={2.5} rx={1.25} fill="#16A34A"/>
              <Rect x={12} y={20} width={18} height={2.5} rx={1.25} fill="#A7F3D0"/>
              <Rect x={12} y={26} width={14} height={2.5} rx={1.25} fill="#A7F3D0"/>
              <Rect x={12} y={32} width={10} height={2.5} rx={1.25} fill="#A7F3D0"/>
            </Svg>
          </View>
          {savedRecipes.length === 0 ? (
            <>
              <Text style={styles.emptyTitle}>{t('saved.noSaved')}</Text>
              <Text style={styles.emptySubtitle}>{t('saved.startSaving')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>
                {searchQuery ? t('recipes.noResults') : t('saved.noSaved')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? t('recipes.tryDifferentSearch') : t('saved.startSaving')}
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderSavedRecipe}
          keyExtractor={(item) => (item as any)._id || item.id}
          style={styles.recipesList}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchSavedRecipes}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchSavedRecipes}
              colors={['rgb(22, 163, 74)']}
              tintColor={'rgb(22, 163, 74)'}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 10,
    textAlign: 'left',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    marginBottom: 14,
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#212529',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#16A34A',
    fontWeight: '500',
  },
  recipesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeMetadata: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metadataItem: {
    marginRight: 16,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dietaryTag: {
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  dietaryTagText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#6C757D',
    alignSelf: 'center',
  },
  recipeDate: {
    fontSize: 11,
    color: '#ADB5BD',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
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
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBadgeActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  filterBadgeText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadgeTextActive: {
    color: 'white',
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  swipeRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DC3545',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 100,
  },
  deleteText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  rowContent: {
    flex: 1,
  },
});