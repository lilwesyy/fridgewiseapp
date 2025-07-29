import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { SavedScreen } from '../../components/screens';
import type { MainTabScreenProps } from '../types';

export const SavedScreenWrapper: React.FC = () => {
  const navigation = useNavigation<MainTabScreenProps<'Saved'>['navigation']>();

  const handleSelectRecipe = (recipe: any, allRecipes: any[], index: number) => {
    navigation.navigate('Recipe', {
      recipe,
      recipes: allRecipes,
      currentIndex: index,
      fromTab: 'saved',
    });
  };

  return (
    <SavedScreen
      onSelectRecipe={handleSelectRecipe}
    />
  );
};