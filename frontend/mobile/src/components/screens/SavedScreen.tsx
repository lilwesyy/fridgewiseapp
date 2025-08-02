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
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { VectorIcon, MappedIcon } from '../ui/VectorIcon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';
import { NotificationModal } from '../modals/NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';

const { width: screenWidth } = Dimensions.get('window');

// Sposto le interfacce in alto
interface SavedRecipe {
  id: string;
  _id?: string;
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
  dishPhotos: { url: string; publicId: string }[]; // Cloudinary dish photos array
  cookedAt?: string; // Data e ora in cui è stato cucinato
  completionCount?: number; // Numero di volte che la ricetta è stata cucinata
  isPublicRecipe?: boolean; // Flag per indicare se è una ricetta pubblica salvata
  originalCreator?: {
    _id: string;
    name: string;
    email: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  }; // Informazioni del creatore originale per ricette pubbliche
  userRating?: number; // Rating dell'utente per ricette pubbliche
  userComment?: string; // Commento dell'utente per ricette pubbliche
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

export const SavedScreen: React.FC<SavedScreenProps> = ({ onSelectRecipe }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
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
    headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    headerTranslateY.value = withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) });

    // Search bar animation
    searchOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    searchTranslateY.value = withDelay(150, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));

    // Filters animation
    filtersOpacity.value = withDelay(300, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    filtersTranslateX.value = withDelay(300, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));

    // List animation
    listOpacity.value = withDelay(450, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    listTranslateY.value = withDelay(450, withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
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

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3001';

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
      console.log('Error fetching saved recipes:', error);
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
        recipe.ingredients.some((ingredient: { name: string }) =>
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
      console.log('Error removing saved recipe:', error);
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
        colors={colors} // pass colors to item
      />
    );
  };


  // Custom texts for removing from saved
  const removeTitle = t('saved.removeTitle');
  const removeMessage = recipeToDelete ? t('saved.removeMessage', { title: recipeToDelete.title }) : '';
  const removeConfirmLabel = t('common.remove');
  const removeCancelLabel = t('common.cancel');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, headerAnimatedStyle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('saved.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('saved.subtitle')}</Text>
        <Animated.View style={[styles.searchBarContainer, searchAnimatedStyle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MappedIcon icon="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, backgroundColor: 'transparent' }]}
            placeholder={t('recipes.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
            textContentType="none"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Animated.View>
        <Animated.View style={filtersAnimatedStyle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersScrollContent}>
            <TouchableOpacity activeOpacity={0.7}
              style={{
                backgroundColor: !difficultyFilter ? colors.primary : colors.card,
                borderColor: !difficultyFilter ? colors.primary : colors.border,
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginRight: 8,
              }}
              onPress={() => setDifficultyFilter('')}
            >
              <Text style={{
                color: !difficultyFilter ? colors.buttonText : colors.text,
                fontSize: 14,
                fontWeight: '500',
              }}>{t('common.all')}</Text>
            </TouchableOpacity>
            {['easy', 'medium', 'hard'].map(diff => (
              <TouchableOpacity activeOpacity={0.7}
                key={diff}
                style={{
                  backgroundColor: difficultyFilter === diff ? colors.primary : colors.card,
                  borderColor: difficultyFilter === diff ? colors.primary : colors.border,
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  marginRight: 8,
                }}
                onPress={() => setDifficultyFilter(diff)}
              >
                <Text style={{
                  color: difficultyFilter === diff ? colors.buttonText : colors.text,
                  fontSize: 14,
                  fontWeight: '500',
                }}>{t(`recipes.difficulty.${diff}`)}</Text>
              </TouchableOpacity>
            ))}
            {dietaryTags.map(tag => (
              <TouchableOpacity activeOpacity={0.7}
                key={tag}
                style={{
                  backgroundColor: tagFilter === tag ? colors.primary : colors.card,
                  borderColor: tagFilter === tag ? colors.primary : colors.border,
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  marginRight: 8,
                }}
                onPress={() => setTagFilter(tag)}
              >
                <Text style={{
                  color: tagFilter === tag ? colors.buttonText : colors.text,
                  fontSize: 14,
                  fontWeight: '500',
                }}>{t(`recipes.dietary.${tag.replace('-', '')}`)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {filteredRecipes.length === 0 ? (
        <Animated.View style={[styles.emptyContainer, listAnimatedStyle]}>
          <View style={{ marginBottom: 16 }}>
            <Ionicons name="bookmark-outline" size={64} color="#16A34A" />
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
            renderItem={({ item, index }) => (
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
                colors={colors} // pass colors to item
              />
            )}
            keyExtractor={(item) => (item as any)._id || item.id}
            style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchSavedRecipes}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchSavedRecipes}
                colors={[colors.primary]}
                tintColor={colors.primary}
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

const getStyles = (colors: any, insets: { top: number; bottom: number }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: insets.top + 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
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


// Rimuovo SwipeableRow e uso solo la card
const SavedRecipeItem: React.FC<SavedRecipeItemProps & { colors: any }> = ({
  item,
  index,
  onPress,
  onDelete,
  resetTrigger,
  t,
  formatDate,
  getDifficultyColor,
  colors
}) => {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardTranslateY = useSharedValue(30);

  React.useEffect(() => {
    const delay = 600 + (index * 100);
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
    cardTranslateY.value = withDelay(delay, withTiming(0, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
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
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: colors.shadow || '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={onPress}
      >
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }} numberOfLines={2}>
                  {item.title}
                </Text>
                {/* Badge per ricette pubbliche */}
                {item.isPublicRecipe && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.primary + '15',
                    borderColor: colors.primary,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    marginTop: 4,
                    alignSelf: 'flex-start'
                  }}>
                    <Text style={{ fontSize: 10, marginRight: 4 }}>🌟</Text>
                    <Text style={{ fontSize: 11, color: 'white', fontWeight: '600' }}>
                      {t('saved.publicRecipe')}
                    </Text>
                    {item.originalCreator?.name && (
                      <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginLeft: 4 }}>
                        • {item.originalCreator.name}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: getDifficultyColor(item.difficulty) }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {t(`recipes.difficulty.${item.difficulty}`)}
                  </Text>
                </View>
                <TouchableOpacity activeOpacity={0.7}
                  style={{ backgroundColor: colors.error, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}
                  onPress={onDelete}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', lineHeight: 16 }}>×</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Indicatore "già cucinato" se disponibile */}
            {item.cookedAt && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.success + '15',
                borderColor: colors.success,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginBottom: 8,
                alignSelf: 'flex-start'
              }}>
                <Text style={{ fontSize: 12, marginRight: 4 }}>👨‍🍳</Text>
                <Text style={{ fontSize: 11, color: 'white', fontWeight: '600' }}>
                  {t('saved.alreadyCooked')} {formatDate(item.cookedAt)}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>⏱️ {item.cookingTime} min</Text>
          </View>
          <View style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>👥 {item.servings}</Text>
          </View>
          <View style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>🥘 {item.ingredients.length} {t('recipe.ingredients')}</Text>
          </View>
          {!!(item.completionCount && item.completionCount > 0) && (
            <View style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
                🍽️ {item.completionCount}x {t('recipes.cooked')}
              </Text>
            </View>
          )}
        </View>
        {item.dietaryTags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            {item.dietaryTags.slice(0, 3).map((tag: string, index: number) => (
              <View key={index} style={{ backgroundColor: colors.badge, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 4 }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>
                  {t(`recipes.dietary.${tag.replace('-', '')}`)}
                </Text>
              </View>
            ))}
            {item.dietaryTags.length > 3 && (
              <Text style={{ fontSize: 10, color: colors.textSecondary, alignSelf: 'center' }}>+{item.dietaryTags.length - 3}</Text>
            )}
          </View>
        )}
        {/* <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'right' }}>{t('saved.savedOn')} {formatDate(item.savedAt)}</Text> */}
      </TouchableOpacity>
    </Animated.View>
  );
};