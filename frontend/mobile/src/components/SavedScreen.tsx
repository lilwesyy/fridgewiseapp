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
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { NotificationModal } from './NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteText: string;
  resetTrigger?: number; // Add reset trigger prop
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onDelete, deleteText, resetTrigger }) => {
  const translateX = useSharedValue(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const deleteButtonWidth = 100;

  // Reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined) {
      translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
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
        translateX.value = newTranslateX;
      } else if (gestureState.dx > 0 && isRevealed) {
        // Swipe right when already revealed - hide delete button
        const newTranslateX = Math.min(gestureState.dx - deleteButtonWidth, 0);
        translateX.value = newTranslateX;
      } else if (gestureState.dx > 0 && !isRevealed) {
        // Swipe right when not revealed - keep at 0
        translateX.value = 0;
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        // Swipe left enough to reveal delete button
        translateX.value = withSpring(-deleteButtonWidth, { damping: 15, stiffness: 100 });
        runOnJS(setIsRevealed)(true);
      } else if (gestureState.dx > 50 && isRevealed) {
        // Swipe right enough to hide delete button when revealed
        translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
        runOnJS(setIsRevealed)(false);
      } else {
        // Snap to appropriate position based on current state
        const targetValue = isRevealed ? -deleteButtonWidth : 0;
        translateX.value = withSpring(targetValue, { damping: 15, stiffness: 100 });
      }
    },
  });

  const handleDelete = () => {
    // Animate the deletion
    translateX.value = withTiming(-screenWidth, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onDelete)();
      }
    });
  };

  const hideDeleteButton = () => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
    setIsRevealed(false);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

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
        style={[styles.swipeRow, animatedStyle]}
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

interface SavedRecipeItemProps {
  item: SavedRecipe;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  resetTrigger: number;
  t: (key: string) => string;
  formatDate: (date: string) => string;
  getDifficultyColor: (difficulty: string) => string;
}

const SavedRecipeItem: React.FC<SavedRecipeItemProps> = ({ 
  item, 
  index, 
  onPress, 
  onDelete, 
  resetTrigger, 
  t, 
  formatDate, 
  getDifficultyColor 
}) => {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardTranslateY = useSharedValue(30);

  React.useEffect(() => {
    const delay = 600 + (index * 100); // Start after list container animation
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
    cardTranslateY.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, [index]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value }
    ],
  }));

  return (
    <Animated.View style={cardAnimatedStyle}>
      <SwipeableRow
        onDelete={onDelete}
        deleteText={t('common.remove')}
        resetTrigger={resetTrigger}
      >
        <TouchableOpacity
          style={styles.recipeCard}
          onPress={onPress}
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
                onPress={onDelete}
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
    </Animated.View>
  );
};

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<SavedRecipe | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  // Stato per notifiche di errore
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorNotificationMessage, setErrorNotificationMessage] = useState('');
  const dietaryTags = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'
  ];

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerTranslateY = useSharedValue(-30);
  
  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(20);
  
  const filtersOpacity = useSharedValue(0);
  const filtersTranslateX = useSharedValue(-50);
  
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(40);

  // Entrance animations
  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    headerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    
    // Search bar animation
    searchOpacity.value = withDelay(150, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    searchTranslateY.value = withDelay(150, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    
    // Filters animation
    filtersOpacity.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    filtersTranslateX.value = withDelay(300, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    
    // List animation
    listOpacity.value = withDelay(450, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    listTranslateY.value = withDelay(450, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
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

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

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
      setResetTrigger(prev => prev + 1);
      const response = await fetch(`${API_URL}/api/recipe/saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
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
      setErrorNotificationMessage(t('saved.fetchError'));
      setShowErrorNotification(true);
      setTimeout(() => setShowErrorNotification(false), 2000);
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
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 1300);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove recipe');
      }
    } catch (error) {
      console.error('Error removing saved recipe:', error);
      setErrorNotificationMessage(t('saved.removeError'));
      setShowErrorNotification(true);
      setTimeout(() => setShowErrorNotification(false), 2000);
    }
  };

  const handleDeleteRequest = (recipe: SavedRecipe) => {
    setRecipeToDelete(recipe);
    setShowDeleteModal(true);
  };

  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    setShowDeleteModal(false);
    try {
      const recipeId = (recipeToDelete as any)._id || recipeToDelete.id;
      await removeFromSaved(recipeId);
    } finally {
      setRecipeToDelete(null);
    }
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

  const renderSavedRecipe = ({ item, index }: { item: SavedRecipe; index: number }) => {
    return (
      <SavedRecipeItem
        item={item}
        index={index}
        onPress={() => {
          const idx = filteredRecipes.findIndex(r => {
            const currentRecipeId = (r as any)._id || r.id;
            const itemId = (item as any)._id || item.id;
            return currentRecipeId === itemId;
          });
          onSelectRecipe(item, filteredRecipes, idx);
        }}
        onDelete={() => handleDeleteRequest(item)}
        resetTrigger={resetTrigger}
        t={t}
        formatDate={formatDate}
        getDifficultyColor={getDifficultyColor}
      />
    );
  };


  // Custom texts for removing from saved
  const removeTitle = t('saved.removeTitle');
  const removeMessage = recipeToDelete ? t('saved.removeMessage', { title: recipeToDelete.title }) : '';
  const removeConfirmLabel = t('common.remove');
  const removeCancelLabel = t('common.cancel');

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Text style={styles.title}>{t('saved.title')}</Text>
        <Text style={styles.subtitle}>{t('saved.subtitle')}</Text>
        
        <Animated.View style={[styles.searchBarContainer, searchAnimatedStyle]}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('recipes.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </Animated.View>
        
        <Animated.View style={filtersAnimatedStyle}>
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
        </Animated.View>
      </Animated.View>

      {filteredRecipes.length === 0 ? (
        <Animated.View style={[styles.emptyContainer, listAnimatedStyle]}>
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
        </Animated.View>
      ) : (
        <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
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
        </Animated.View>
      )}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onCancel={() => { setShowDeleteModal(false); setRecipeToDelete(null); }}
        onConfirm={confirmDeleteRecipe}
        title={removeTitle}
        message={removeMessage}
        confirmLabel={removeConfirmLabel}
        cancelLabel={removeCancelLabel}
      />
      <NotificationModal
        visible={showNotification}
        type="success"
        title={t('common.success')}
        message={t('saved.removedSuccess')}
        onClose={() => setShowNotification(false)}
      />
      <NotificationModal
        visible={showErrorNotification}
        type="error"
        title={t('common.error')}
        message={errorNotificationMessage}
        onClose={() => setShowErrorNotification(false)}
      />
      {/* Nota: questa azione rimuove solo la ricetta dalle salvate, non la elimina dal database globale. */}
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