import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { HapticService } from '../services/hapticService';

// Import screen wrappers
import { 
  HomeScreenWrapper, 
  CameraTabScreenWrapper,
  RecipesScreenWrapper, 
  SavedScreenWrapper, 
  ProfileScreenWrapper 
} from './screens';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isHighContrast } = useTheme();

  const handleTabPress = () => {
    HapticService.navigate();
  };

  // Debug: Check if translations work
  console.log('Navigation translations:', {
    home: t('navigation.home'),
    camera: t('navigation.camera'),
    recipes: t('navigation.recipes'),
    saved: t('navigation.saved'),
    profile: t('navigation.profile')
  });

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: string;
          const iconSize = Platform.OS === 'ios' ? 26 : 24;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Camera':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Recipes':
              iconName = focused ? 'restaurant' : 'restaurant-outline';
              break;
            case 'Saved':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? colors.surface + 'F5' : colors.surface,
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : (isHighContrast ? 2 : 1),
          borderTopColor: Platform.OS === 'ios' ? colors.border + '80' : (isHighContrast ? colors.text : colors.border),
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          height: Platform.OS === 'ios' ? 88 : 76,
          shadowColor: colors.shadow || '#000',
          shadowOffset: { width: 0, height: Platform.OS === 'ios' ? -1 : -2 },
          shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.1,
          shadowRadius: Platform.OS === 'ios' ? 4 : 8,
          elevation: Platform.OS === 'android' ? 8 : 0,
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'ios' ? 10 : 11,
          fontWeight: Platform.OS === 'ios' ? '400' : '500',
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
          marginTop: Platform.OS === 'ios' ? 1 : 2,
          letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
        },
        tabBarItemStyle: {
          paddingVertical: Platform.OS === 'ios' ? 6 : 8,
        },
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS === 'android',
      })}
      screenListeners={{
        tabPress: handleTabPress,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreenWrapper}
        options={{
          tabBarLabel: t('navigation.home'),
          tabBarAccessibilityLabel: t('navigation.home'),
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraTabScreenWrapper}
        options={{
          tabBarLabel: t('navigation.camera'),
          tabBarAccessibilityLabel: t('navigation.camera'),
        }}
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipesScreenWrapper}
        options={{
          tabBarLabel: t('navigation.recipes'),
          tabBarAccessibilityLabel: t('navigation.recipes'),
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedScreenWrapper}
        options={{
          tabBarLabel: t('navigation.saved'),
          tabBarAccessibilityLabel: t('navigation.saved'),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreenWrapper}
        options={{
          tabBarLabel: t('navigation.profile'),
          tabBarAccessibilityLabel: t('navigation.profile'),
        }}
      />
    </Tab.Navigator>
  );
};