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
  language: 'en' | 'it';
  createdAt: string;
}

interface RecipesScreenProps {
  onSelectRecipe: (recipe: Recipe, allRecipes: Recipe[], index: number) => void;
  onGoToCamera: () => void;
}

export const RecipesScreen: React.FC<RecipesScreenProps> = ({ onSelectRecipe, onGoToCamera }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
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
    fetchRecipes();
  }, []);

  // Reset swipe states when component becomes visible
  useEffect(() => {
    setResetTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, recipes, difficultyFilter, tagFilter]);

  // FIX: estrai array corretto da data.data.recipes
  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      // Reset all swipe states when refreshing
      setResetTrigger(prev => prev + 1);
      
      const response = await fetch(`${API_URL}/api/recipe`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // FIX: controlla se data.data.recipes esiste (nuova struttura paginata)
      if (response.ok) {
        if (data.data && Array.isArray(data.data.recipes)) {
          setRecipes(data.data.recipes);
        } else if (Array.isArray(data.data)) {
          setRecipes(data.data);
        } else {
          setRecipes([]);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch recipes');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      Alert.alert(t('common.error'), t('recipes.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;
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

  const deleteRecipe = async (recipe: Recipe) => {
    Alert.alert(
      t('recipe.deleteTitle'),
      t('recipe.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              const recipeId = (recipe as any)._id || recipe.id;
              
              if (!recipeId) {
                Alert.alert(t('common.error'), t('recipe.invalidIdError'));
                return;
              }

              // Check if recipe is saved
              if ((recipe as any).isSaved) {
                // If recipe is saved, just remove it from recipes list (keep it in saved)
                setRecipes(prev => prev.filter(r => {
                  const currentRecipeId = (r as any)._id || r.id;
                  return currentRecipeId !== recipeId;
                }));
                Alert.alert(t('common.success'), t('recipe.deleteSuccess'));
              } else {
                // If recipe is not saved, delete it completely
                const deleteResponse = await fetch(`${API_URL}/api/recipe/${recipeId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (deleteResponse.ok) {
                  // Remove recipe from local state
                  setRecipes(prev => prev.filter(r => {
                    const currentRecipeId = (r as any)._id || r.id;
                    return currentRecipeId !== recipeId;
                  }));
                  Alert.alert(t('common.success'), t('recipe.deleteSuccess'));
                } else {
                  throw new Error('Failed to delete recipe');
                }
              }
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert(t('common.error'), t('recipe.deleteError'));
            }
          }
        }
      ]
    );
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <SwipeableRow
      onDelete={() => deleteRecipe(item)}
      deleteText={t('common.delete')}
      resetTrigger={resetTrigger}
    >
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => {
          const index = filteredRecipes.findIndex(r => {
            const currentRecipeId = (r as any)._id || r.id;
            const itemId = (item as any)._id || item.id;
            return currentRecipeId === itemId;
          });
          onSelectRecipe(item, filteredRecipes, index);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>
              {t(`recipes.difficulty.${item.difficulty}`)}
            </Text>
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
            {item.dietaryTags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.dietaryTag}>
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

        <Text style={styles.recipeDate}>{formatDate(item.createdAt)}</Text>
      </TouchableOpacity>
    </SwipeableRow>
  );


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('recipes.title') || 'Le tue ricette'}</Text>
        <Text style={styles.subtitle}>{t('recipes.subtitle') || 'Ricette deliziose basate sui tuoi ingredienti'}</Text>
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
          {/* Difficoltà */}
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
          {/* Tag dietetici */}
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
          {recipes.length === 0 ? (
            <>
              <Text style={styles.emptyTitle}>{t('recipes.noRecipes')}</Text>
              <Text style={styles.emptySubtitle}>{t('recipes.startCreating')}</Text>
              <TouchableOpacity style={styles.scanButton} onPress={onGoToCamera}>
                <Text style={styles.scanButtonText}>{t('recipes.scanIngredients') || 'Scansiona Ingredienti'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>
                {searchQuery ? t('recipes.noResults') : t('recipes.noRecipes')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? t('recipes.tryDifferentSearch') : t('recipes.startCreating')}
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => (item as any)._id || item.id}
          style={styles.recipesList}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchRecipes}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchRecipes}
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
    marginBottom: 8,
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
    marginBottom: 14, // aggiunto margine sotto la searchbar
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
    color: 'rgb(22, 163, 74)',
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
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 28,
  },
  scanIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    height: 22,
    width: 28,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    flex: 0,
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