import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { CameraScreen } from '../../components/screens';
import type { MainTabScreenProps } from '../types';

export const CameraTabScreenWrapper: React.FC = () => {
  const navigation = useNavigation<MainTabScreenProps<'Camera'>['navigation']>();

  const handleImageAnalyzed = (ingredients: any[]) => {
    // Only navigate if there are actual ingredients
    if (ingredients && ingredients.length > 0) {
      navigation.navigate('Ingredients', { ingredients });
    }
    // If no ingredients, stay on camera screen and let CameraScreen handle the modal
  };

  const handleGoBack = () => {
    // From camera tab, go to home tab
    navigation.navigate('Home');
  };

  const handleGoToManualInput = () => {
    navigation.navigate('Ingredients', { ingredients: [] });
  };

  return (
    <CameraScreen
      onImageAnalyzed={handleImageAnalyzed}
      onGoBack={handleGoBack}
      onGoToManualInput={handleGoToManualInput}
    />
  );
};