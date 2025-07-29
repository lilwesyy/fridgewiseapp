import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { RecipesScreen } from '../../components/screens';
import type { MainTabScreenProps } from '../types';

export const RecipesScreenWrapper: React.FC = () => {
  const navigation = useNavigation<MainTabScreenProps<'Recipes'>['navigation']>();

  const handleSelectRecipe = (recipe: any, allRecipes: any[], index: number, isPublic?: boolean) => {
    navigation.navigate('Recipe', {
      recipe,
      recipes: allRecipes,
      currentIndex: index,
      isPublic,
      fromTab: 'recipes',
    });
  };

  const handleGoToCamera = () => {
    navigation.navigate('Camera');
  };

  return (
    <RecipesScreen
      onSelectRecipe={handleSelectRecipe}
      onGoToCamera={handleGoToCamera}
    />
  );
};