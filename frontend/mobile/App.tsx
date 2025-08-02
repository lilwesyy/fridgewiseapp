import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, SafeAreaView, Text, Platform, StatusBar as RNStatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import './src/i18n'; // Initialize i18n

// Context providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Navigation
import { RootStackNavigator } from './src/navigation';

// Screens and components for non-authenticated users
import { OnboardingScreen, OfflineScreen, MaintenanceScreen } from './src/components/screens';
import { NotificationModal } from './src/components/modals';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { checkBackendAvailability } from './src/utils/healthCheck';
import { useComponentPreloader } from './src/utils/preloader';
import { PerformanceDebugger } from './src/components/ui/PerformanceDebugger';

// Auth screens (keeping the auth flow from original App.tsx)
import AuthFlowComponent from './src/components/auth/AuthFlowComponent';

// Keep splash screen visible during initial load
SplashScreen.preventAutoHideAsync();

const AppContent: React.FC = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, isLoading } = useAuth();
  const { isDarkMode, colors } = useTheme();
  const { isOffline, refresh: refreshNetworkStatus } = useNetworkStatus();
  const { schedulePreload } = useComponentPreloader();

  // State for onboarding and app status
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [shouldStartWithRegister, setShouldStartWithRegister] = useState(false);
  const [i18nInitialized, setI18nInitialized] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    isHealthy: true,
    isMaintenance: false,
    isCheckingHealth: true,
  });

  const [notification, setNotification] = useState({
    visible: false,
    type: 'error' as any,
    title: '',
    message: '',
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // Initialize i18n
  useEffect(() => {
    const initializeI18n = async () => {
      try {
        await i18nInstance.isInitialized;
        setI18nInitialized(true);
      } catch (error) {
        console.log('i18n initialization error:', error);
        setI18nInitialized(true); // Continue anyway
      }
    };
    
    initializeI18n();
  }, [i18nInstance]);

  // Handle splash screen
  useEffect(() => {
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await SplashScreen.hideAsync();
      
      if (user) {
        schedulePreload('camera', 3000);
      }
    };

    if (!isLoading) {
      hideSplash();
    }
  }, [isLoading, isDarkMode, user, schedulePreload]);

  // Force StatusBar update when theme changes
  useEffect(() => {
    const barStyle = isDarkMode ? 'light-content' : 'dark-content';
    RNStatusBar.setBarStyle(barStyle, true);
  }, [isDarkMode]);

  // Check onboarding status on app startup
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        const hasCompletedOnboarding = completed === 'true';
        setOnboardingCompleted(hasCompletedOnboarding);
        setShowOnboarding(!hasCompletedOnboarding);
      } catch (error) {
        console.log('Error checking onboarding status:', error);
        setShowOnboarding(true);
        setOnboardingCompleted(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Health check on app startup
  useEffect(() => {
    const performInitialHealthCheck = async () => {
      try {
        const result = await checkBackendAvailability(API_URL, 2, 1000);
        setBackendStatus({
          isHealthy: result.isHealthy,
          isMaintenance: result.isMaintenance,
          isCheckingHealth: false,
        });
      } catch (error) {
        setBackendStatus({
          isHealthy: false,
          isMaintenance: false,
          isCheckingHealth: false,
        });
      }
    };

    performInitialHealthCheck();
  }, []);

  const handleRetryConnection = async () => {
    setBackendStatus(prev => ({ ...prev, isCheckingHealth: true }));
    try {
      const result = await checkBackendAvailability(API_URL, 3, 2000);
      setBackendStatus({
        isHealthy: result.isHealthy,
        isMaintenance: result.isMaintenance,
        isCheckingHealth: false,
      });
    } catch (error) {
      setBackendStatus({
        isHealthy: false,
        isMaintenance: false,
        isCheckingHealth: false,
      });
    }
  };

  const handleOnboardingComplete = async (preferences: { preferredLanguage: 'en' | 'it'; dietaryRestrictions: string[] }) => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
      i18nInstance.changeLanguage(preferences.preferredLanguage);
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setShouldStartWithRegister(true);
    } catch (error) {
      console.log('Error saving onboarding completion:', error);
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setShouldStartWithRegister(true);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setShowOnboarding(false);
      setOnboardingCompleted(true);
    } catch (error) {
      console.log('Error saving onboarding skip:', error);
      setShowOnboarding(false);
      setOnboardingCompleted(true);
    }
  };

  // Show offline screen if no internet connection
  if (isOffline) {
    return (
      <OfflineScreen
        onRetry={refreshNetworkStatus}
        isRetrying={false}
      />
    );
  }

  // Show maintenance screen if backend is down or in maintenance
  if (!backendStatus.isHealthy || backendStatus.isMaintenance) {
    return (
      <MaintenanceScreen
        onRetry={handleRetryConnection}
        isRetrying={backendStatus.isCheckingHealth}
      />
    );
  }

  // Show loading screen
  if (isLoading || backendStatus.isCheckingHealth || showOnboarding === null || !i18nInitialized) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Show onboarding if user hasn't completed it
  if (!user && showOnboarding) {
    return (
      <>
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <NotificationModal
          visible={notification.visible}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ ...notification, visible: false })}
        />
      </>
    );
  }

  // Show auth flow if user is not authenticated
  if (!user) {
    return (
      <>
        <AuthFlowComponent 
          onNotification={setNotification}
          initialMode={shouldStartWithRegister ? 'register' : 'welcome'}
        />
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <NotificationModal
          visible={notification.visible}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ ...notification, visible: false })}
        />
      </>
    );
  }

  // Main app with React Navigation
  return (
    <NavigationContainer>
      <RootStackNavigator />
      <PerformanceDebugger enabled={__DEV__} />
      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </NavigationContainer>
  );
};

const AppWithProviders: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <ThemeSync />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const ThemeSync: React.FC = () => {
  const { user } = useAuth();
  const { setThemeMode } = useTheme();
  
  // Sync theme when user data changes
  React.useEffect(() => {
    if (user?.themeMode) {
      setThemeMode(user.themeMode);
    }
  }, [user?.themeMode, setThemeMode]);
  
  return null;
};

export default function App() {
  return <AppWithProviders />;
}