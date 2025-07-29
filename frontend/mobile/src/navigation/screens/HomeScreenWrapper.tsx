import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { HomeScreen } from '../../components/screens';
import type { MainTabScreenProps } from '../types';

export const HomeScreenWrapper: React.FC = () => {
  const navigation = useNavigation<MainTabScreenProps<'Home'>['navigation']>();

  const handleNavigateToCamera = () => {
    navigation.navigate('Camera');
  };

  const handleSelectRecipe = (recipe: any, allRecipes: any[], index: number) => {
    navigation.navigate('Recipe', {
      recipe,
      recipes: allRecipes,
      currentIndex: index,
      fromTab: 'home',
    });
  };

  return (
    <HomeScreen
      onNavigateToCamera={handleNavigateToCamera}
      onSelectRecipe={handleSelectRecipe}
    />
  );
};