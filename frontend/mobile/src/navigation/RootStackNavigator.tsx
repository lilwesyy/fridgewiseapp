import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Import navigators and screen wrappers
import { MainTabNavigator } from './MainTabNavigator';
import { 
  CameraScreenWrapper, 
  IngredientsScreenWrapper, 
  RecipeScreenWrapper, 
  CookingModeScreenWrapper 
} from './screens';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const RootStackNavigator: React.FC = () => {
  const { colors } = useTheme();

  // iOS-style transition preset
  const iOSTransition = Platform.OS === 'ios' 
    ? TransitionPresets.SlideFromRightIOS 
    : TransitionPresets.SlideFromRightIOS; // Use iOS style on Android too for consistency

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyle: { backgroundColor: colors.background },
        ...iOSTransition,
        // Custom animation timing for smoother transitions
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 350,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
        },
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{
          animationEnabled: false, // No animation for main tabs
        }}
      />
      
      {/* Camera Flow Screens */}
      <Stack.Screen 
        name="Camera" 
        component={CameraScreenWrapper}
        options={{
          ...iOSTransition,
          // Camera slides up from bottom on first access
          presentation: 'modal',
          gestureDirection: 'vertical',
          ...TransitionPresets.ModalSlideFromBottomIOS,
        }}
      />
      
      <Stack.Screen 
        name="Ingredients" 
        component={IngredientsScreenWrapper}
        options={{
          ...iOSTransition,
          gestureDirection: 'horizontal',
        }}
      />
      
      <Stack.Screen 
        name="Recipe" 
        component={RecipeScreenWrapper}
        options={{
          ...iOSTransition,
          gestureDirection: 'horizontal',
        }}
      />
      
      <Stack.Screen 
        name="CookingMode" 
        component={CookingModeScreenWrapper}
        options={{
          ...iOSTransition,
          gestureDirection: 'horizontal',
          // Disable back gesture during cooking mode for safety
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};