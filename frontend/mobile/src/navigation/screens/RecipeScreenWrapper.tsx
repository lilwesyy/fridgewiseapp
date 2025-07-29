import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RecipeScreen } from '../../components/screens';
import type { RootStackScreenProps } from '../types';

export const RecipeScreenWrapper: React.FC = () => {
  const navigation = useNavigation<RootStackScreenProps<'Recipe'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'Recipe'>['route']>();
  
  const { 
    recipe, 
    isJustGenerated = false, 
    recipes = [], 
    currentIndex = 0, 
    isPublic = false,
    fromTab = 'home'
  } = route.params;

  const handleGoBack = () => {
    if (isJustGenerated) {
      // If recipe was just generated, go back to ingredients
      navigation.goBack();
    } else {
      // Otherwise go back to the tab we came from
      navigation.navigate('MainTabs');
    }
  };

  const handleStartOver = () => {
    navigation.navigate('MainTabs');
  };

  const handleGoToSaved = () => {
    navigation.navigate('MainTabs');
  };

  const handleGoToRecipes = () => {
    navigation.navigate('MainTabs');
  };

  const handleStartCooking = (recipe: any) => {
    navigation.navigate('CookingMode', {
      recipe,
      isPublic,
    });
  };

  const handleNavigateToRecipe = (index: number) => {
    if (recipes[index]) {
      navigation.setParams({
        recipe: recipes[index],
        currentIndex: index,
      });
    }
  };

  const handleRecipeUpdate = async (updatedRecipe: any) => {
    // Update the route params with the new recipe
    navigation.setParams({
      recipe: updatedRecipe,
      isJustGenerated: false, // No longer just generated after update
    });
    
    // Handle database save if needed (implementation from original App.tsx)
    // This would be moved to a service or hook in a real refactor
  };

  return (
    <RecipeScreen
      recipe={recipe}
      onGoBack={handleGoBack}
      onStartOver={handleStartOver}
      onGoToSaved={handleGoToSaved}
      onGoToRecipes={handleGoToRecipes}
      onStartCooking={handleStartCooking}
      isJustGenerated={isJustGenerated}
      recipes={recipes}
      currentIndex={currentIndex}
      onNavigateToRecipe={handleNavigateToRecipe}
      onRecipeUpdate={handleRecipeUpdate}
      isPublic={isPublic}
    />
  );
};