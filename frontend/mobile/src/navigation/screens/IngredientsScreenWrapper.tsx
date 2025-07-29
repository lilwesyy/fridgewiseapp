import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { IngredientsScreen } from '../../components/screens';
import type { RootStackScreenProps } from '../types';

export const IngredientsScreenWrapper: React.FC = () => {
  const navigation = useNavigation<RootStackScreenProps<'Ingredients'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'Ingredients'>['route']>();
  
  const { ingredients } = route.params;

  const handleGenerateRecipe = (recipe: any) => {
    navigation.navigate('Recipe', {
      recipe,
      isJustGenerated: true,
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleGoToCamera = (currentIngredients: any[]) => {
    navigation.navigate('Camera');
  };

  return (
    <IngredientsScreen
      ingredients={ingredients}
      onGenerateRecipe={handleGenerateRecipe}
      onGoBack={handleGoBack}
      onGoToCamera={handleGoToCamera}
    />
  );
};