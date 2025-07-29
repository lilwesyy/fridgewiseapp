import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CookingModeScreen } from '../../components/screens';
import type { RootStackScreenProps } from '../types';

export const CookingModeScreenWrapper: React.FC = () => {
  const navigation = useNavigation<RootStackScreenProps<'CookingMode'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'CookingMode'>['route']>();
  
  const { recipe, isPublic = false } = route.params;

  const handleGoBack = () => {
    // Go back to recipe screen
    navigation.goBack();
  };

  const handleFinishCooking = (notificationData?: any) => {
    // Navigate to saved screen after finishing cooking
    navigation.navigate('MainTabs');
  };

  return (
    <CookingModeScreen
      recipe={recipe}
      onGoBack={handleGoBack}
      onFinishCooking={handleFinishCooking}
      showForceExitModal={false} // This will be handled by the cooking screen internally
      onForceExitConfirm={() => {}} // Not needed with new navigation
      onForceExitCancel={() => {}} // Not needed with new navigation
      isPublicRecipe={isPublic}
    />
  );
};