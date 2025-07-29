import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { CameraScreen } from '../../components/screens';
import type { RootStackScreenProps } from '../types';

export const CameraScreenWrapper: React.FC = () => {
  const navigation = useNavigation<RootStackScreenProps<'Camera'>['navigation']>();

  const handleImageAnalyzed = (ingredients: any[]) => {
    // Only navigate if there are actual ingredients
    if (ingredients && ingredients.length > 0) {
      navigation.navigate('Ingredients', { ingredients });
    }
    // If no ingredients, stay on camera screen and let CameraScreen handle the modal
  };

  const handleGoBack = () => {
    navigation.goBack();
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