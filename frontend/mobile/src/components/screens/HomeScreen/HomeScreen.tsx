import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useStatistics } from '../../../hooks/useStatistics';
import { ShareModal } from '../../modals/ShareModal';
import { HapticService } from '../../../services/hapticService';
import { WelcomeBanner } from './components/WelcomeBanner';
import { QuickStats } from './components/QuickStats';
import { QuickActions } from './components/QuickActions';
import { RecentRecipes } from './components/RecentRecipes';
import { FeaturesOverview } from './components/FeaturesOverview';
import { TipsSection } from './components/TipsSection';
import { useHomeAnimations } from './hooks/useHomeAnimations';
import { getStyles } from './styles';
import Animated from 'react-native-reanimated';

interface HomeScreenProps {
  onNavigateToCamera: () => void;
  onSelectRecipe?: (recipe: any, allRecipes: any[], index: number) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onNavigateToCamera, 
  onSelectRecipe 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { 
    statistics, 
    isLoading: statsLoading, 
    recentRecipes, 
    isLoadingRecipes, 
    refreshStatistics 
  } = useStatistics();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  const { animatedStyle, getStatusBarHeight } = useHomeAnimations();

  const handleRefresh = async () => {
    HapticService.refreshTriggered();
    setIsRefreshing(true);
    try {
      await refreshStatistics();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRecipePress = (recipe: any, index: number) => {
    if (onSelectRecipe) {
      const convertedRecipe = { ...recipe, id: recipe._id };
      const convertedRecipes = recentRecipes.map(r => ({ ...r, id: r._id }));
      onSelectRecipe(convertedRecipe, convertedRecipes, index);
    }
  };

  const handleShareRecipe = (recipe: any, event: any) => {
    event.stopPropagation();
    const convertedRecipe = { ...recipe, id: recipe._id };
    setSelectedRecipe(convertedRecipe);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedRecipe(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView
        style={[styles.container, animatedStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressViewOffset={getStatusBarHeight()}
          />
        }
      >
        <WelcomeBanner user={user} />
        
        <QuickStats 
          statistics={statistics}
          isLoading={statsLoading}
        />
        
        <QuickActions 
          onNavigateToCamera={onNavigateToCamera}
        />
        
        {recentRecipes.length > 0 && (
          <RecentRecipes
            recipes={recentRecipes}
            isLoading={isLoadingRecipes}
            onRecipePress={handleRecipePress}
            onShareRecipe={handleShareRecipe}
          />
        )}
        
        <FeaturesOverview />
        
        <TipsSection />

        <ShareModal
          visible={showShareModal}
          recipe={selectedRecipe}
          onClose={closeShareModal}
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};