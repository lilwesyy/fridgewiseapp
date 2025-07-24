import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, SafeAreaView, StatusBar as RNStatusBar, Animated, Platform } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n from './src/i18n';
import { Switch } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { CameraScreen } from './src/components/CameraScreen';
import { IngredientsScreen } from './src/components/IngredientsScreen';
import { RecipeScreen } from './src/components/RecipeScreen';
import { RecipesScreen } from './src/components/RecipesScreen';
import { SavedScreen } from './src/components/SavedScreen';
import { ProfileScreen } from './src/components/ProfileScreen';
import { AdminStatsScreen } from './src/components/AdminStatsScreen';
import { HomeScreen } from './src/components/HomeScreen';
import { CookingModeScreen } from './src/components/CookingModeScreen';
import { OnboardingScreen } from './src/components/OnboardingScreen';
import { BottomNavigation, TabName } from './src/components/BottomNavigation';
import { NotificationModal, NotificationType } from './src/components/NotificationModal';
import { MaintenanceScreen } from './src/components/MaintenanceScreen';
import { OTPInput } from './src/components/OTPInput';
import { AnimatedContainer } from './src/components/AnimatedContainer';
import { checkBackendAvailability, BackendHealthMonitor } from './src/utils/healthCheck';
import Svg, { Path, G, Circle } from 'react-native-svg';
import './src/i18n';

type Screen = 'home' | 'camera' | 'ingredients' | 'recipe' | 'recipes' | 'saved' | 'profile' | 'cooking' | 'admin-stats';

interface AppState {
  currentScreen: Screen;
  activeTab: TabName;
  ingredients: any[];
  recipe: any;
  isRecipeJustGenerated: boolean;
  allRecipes: any[]; // Array of all recipes for navigation
  currentRecipeIndex: number; // Current recipe index
  isCookingModeActive: boolean; // Flag to control navigation blocking
  isPublicRecipe: boolean; // Flag to track if recipe is from public collection
}

const LogoComponent: React.FC<{ width?: number; height?: number }> = ({ width = 60, height = 54 }) => (
  <Svg width={width} height={height} viewBox="0 0 267 241">
    <G>
      <G>
        <Path
          opacity="0.973"
          d="m206.03101,0c3.374,0.174 6.707,0.674 10,1.5c10.926,4.018 16.26,11.852 16,23.5c-0.794,11.216 -4.294,21.549 -10.5,31c-16.359,23.467 -35.193,44.967 -56.5,64.5c-42.519,37.697 -87.186,72.531 -134,104.5c-0.333,-0.5 -0.667,-1 -1,-1.5c33.982,-64.834 73.816,-125.668 119.5,-182.5c11.309,-12.65 23.809,-23.817 37.5,-33.5c6.009,-3.684 12.342,-6.184 19,-7.5z"
          fill="rgb(22, 163, 74)"
        />
      </G>
      <G>
        <Path
          opacity="0.94"
          d="m68.03101,26c6.552,-0.474 10.385,2.526 11.5,9c0.748,8.853 -0.252,17.519 -3,26c-10.067,28.465 -23.067,55.465 -39,81c0.267,-28.554 3.933,-56.888 11,-85c2.516,-10.198 7.016,-19.364 13.5,-27.5c1.932,-1.459 3.932,-2.625 6,-3.5z"
          fill="rgb(20, 150, 68)"
        />
      </G>
      <G>
        <Path
          opacity="0.906"
          d="m5.03101,102c3.472,-0.537 6.305,0.463 8.5,3c1.985,6.323 3.151,12.823 3.5,19.5c-1.074,16.687 -3.408,33.187 -7,49.5c-5.431,-18.081 -8.764,-36.581 -10,-55.5c-0.284,-6.217 1.382,-11.717 5,-16.5z"
          fill="rgb(18, 135, 62)"
        />
      </G>
      <G>
        <Path
          opacity="0.956"
          d="m241.03101,143c6.891,-0.599 13.558,0.235 20,2.5c8.351,8.935 7.684,17.268 -2,25c-12.697,8.125 -26.364,14.125 -41,18c-34.818,9.247 -70.151,15.247 -106,18c32.85,-21.763 67.516,-40.429 104,-56c8.319,-2.99 16.652,-5.49 25,-7.5z"
          fill="rgb(16, 120, 56)"
        />
      </G>
      <G>
        <Path
          opacity="0.911"
          d="m186.03101,225c6.009,-0.166 12.009,0.001 18,0.5c6.464,0.38 10.131,3.713 11,10c-1.409,2.879 -3.743,4.545 -7,5c-22.268,1.801 -44.268,-0.032 -66,-5.5c14.501,-4.628 29.168,-7.961 44,-10z"
          fill="rgb(14, 105, 50)"
        />
      </G>
    </G>
  </Svg>
);

const ValidationIcon: React.FC<{ isValid: boolean; colors: any }> = ({ isValid, colors }) => (
  <View style={{ marginLeft: 8 }}>
    {isValid ? (
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="10" r="10" fill={colors.success} />
        <Path
          d="M6 10L8.5 12.5L14 7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ) : (
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="10" r="10" fill={colors.error} />
        <Path
          d="M7 7L13 13M7 13L13 7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    )}
  </View>
);

const PasswordStrengthIndicator: React.FC<{ strength: number; colors: any; t: any }> = ({ strength, colors, t }) => {
  const getStrengthColor = (level: number) => {
    if (level <= 2) return colors.error;
    if (level <= 3) return colors.warning;
    return colors.success;
  };

  const getStrengthText = (level: number) => {
    if (level <= 2) return t('validation.weak');
    if (level <= 3) return t('validation.medium');
    return t('validation.strong');
  };

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginRight: 8 }}>
          {t('validation.passwordSecurity')}:
        </Text>
        <Text style={{ fontSize: 12, color: getStrengthColor(strength), fontWeight: '600' }}>
          {getStrengthText(strength)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={{
              flex: 1,
              height: 4,
              backgroundColor: level <= strength ? getStrengthColor(strength) : colors.border,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const AppContent: React.FC = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, token, isLoading, login, register, logout, forgotPassword, resetPassword, sendEmailVerification, verifyEmail } = useAuth();
  const { isDarkMode, themeMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Handle splash screen
  useEffect(() => {
    const hideSplash = async () => {
      // Wait for the theme to be loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      await SplashScreen.hideAsync();
    };
    
    if (!isLoading) {
      hideSplash();
    }
  }, [isLoading, isDarkMode]);
  
  // Force StatusBar update when theme changes
  useEffect(() => {
    // Force native StatusBar update
    const barStyle = isDarkMode ? 'light-content' : 'dark-content';
    RNStatusBar.setBarStyle(barStyle, true);
  }, [isDarkMode, themeMode]);
  
  // Safety wrapper for translations
  const safeT = (key: string, fallback?: string) => {
    try {
      const result = t(key);
      return typeof result === 'string' ? result : (fallback || key);
    } catch (error) {
      // Translation error for key
      return fallback || key;
    }
  };
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'home',
    activeTab: 'home',
    ingredients: [],
    recipe: null,
    isRecipeJustGenerated: false,
    allRecipes: [],
    currentRecipeIndex: 0,
    isCookingModeActive: false,
    isPublicRecipe: false,
  });

  const [authMode, setAuthMode] = useState<'welcome' | 'login' | 'register' | 'forgot-password' | 'verify-code' | 'reset-password' | 'verify-email'>('welcome');
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null); // null = loading, true = show, false = don't show
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [showCookingExitModal, setShowCookingExitModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabName | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [emailVerificationForm, setEmailVerificationForm] = useState({
    email: '',
    token: ''
  });
  
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: '',
  });
  
  const [verifyCodeForm, setVerifyCodeForm] = useState({
    email: '',
    code: '',
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });

  const [validation, setValidation] = useState({
    name: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '', strength: 0 },
    confirmPassword: { isValid: false, message: '' },
  });

  const [loginValidation, setLoginValidation] = useState({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' },
  });

  const [notification, setNotification] = useState({
    visible: false,
    type: 'error' as NotificationType,
    title: '',
    message: '',
  });

  const [backendStatus, setBackendStatus] = useState({
    isHealthy: true,
    isMaintenance: false,
    isCheckingHealth: true,
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  // Check onboarding status on app startup
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        const hasCompletedOnboarding = completed === 'true';
        setOnboardingCompleted(hasCompletedOnboarding);
        setShowOnboarding(!hasCompletedOnboarding);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to showing onboarding if we can't check
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
        // Initial health check failed
        setBackendStatus({
          isHealthy: false,
          isMaintenance: false,
          isCheckingHealth: false,
        });
      }
    };

    performInitialHealthCheck();
  }, []);

  // Reset onboarding when user logs out or deletes account
  useEffect(() => {
    const handleUserLogout = async () => {
      if (user === null && token === null) {
        // User has logged out or deleted account, check if onboarding should be reset
        try {
          const onboardingStatus = await AsyncStorage.getItem('onboarding_completed');
          if (onboardingStatus === null) {
            // onboarding_completed was removed (likely from account deletion)
            // Use the same resetOnboarding function as the login page
            await resetOnboarding();
          }
        } catch (error) {
          console.error('Error checking onboarding status after logout:', error);
          // Default to resetting onboarding completely
          await resetOnboarding();
        }
      }
    };

    handleUserLogout();
  }, [user, token]);

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
      // Retry health check failed
      setBackendStatus({
        isHealthy: false,
        isMaintenance: false,
        isCheckingHealth: false,
      });
    }
  };

  const handleOnboardingComplete = async (preferences: { preferredLanguage: 'en' | 'it'; dietaryRestrictions: string[] }) => {
    try {
      // Save onboarding completion status
      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      // Save user preferences for when they register/login
      await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
      
      // Update language immediately
      i18nInstance.changeLanguage(preferences.preferredLanguage);
      
      // Hide onboarding and show register screen
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setAuthMode('register');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      // Still proceed to hide onboarding
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setAuthMode('welcome');
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      // Save onboarding completion status (skipped)
      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      // Hide onboarding and show welcome screen
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setAuthMode('welcome');
    } catch (error) {
      console.error('Error saving onboarding skip:', error);
      // Still proceed to hide onboarding
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setAuthMode('welcome');
    }
  };

  const handleLogin = async () => {
    // Validate login form
    const emailValidation = validateLoginEmail(loginForm.email);
    const passwordValidation = validateLoginPassword(loginForm.password);
    
    setLoginValidation({
      email: emailValidation,
      password: passwordValidation,
    });

    // Check if validation passed
    if (!emailValidation.isValid || !passwordValidation.isValid) {
      return;
    }

    try {
      await login(loginForm.email, loginForm.password);
    } catch (error: any) {
      // Check if the error is due to unverified email
      if (error.requireEmailVerification) {
        // Pre-fill the email and redirect to verification screen
        setEmailVerificationForm({ email: error.email || loginForm.email, token: '' });
        setAuthMode('verify-email');
        // Send verification code automatically
        try {
          await sendEmailVerification(error.email || loginForm.email);
        } catch (sendError) {
          console.error('Failed to send verification code:', sendError);
        }
      } else {
        // Check for specific error types and set field-specific errors
        if (error.message && error.message.toLowerCase().includes('invalid credentials')) {
          setLoginValidation({
            email: { isValid: false, message: safeT('auth.loginError') },
            password: { isValid: false, message: safeT('auth.loginError') },
          });
        } else {
          setNotification({
            visible: true,
            type: 'error',
            title: safeT('common.error'),
            message: error.message,
          });
        }
      }
    }
  };

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) {
      return { isValid: false, message: safeT('validation.nameRequired') };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: safeT('validation.nameTooShort') };
    }
    return { isValid: true, message: '' };
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return { isValid: false, message: safeT('validation.emailRequired') };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: safeT('validation.emailInvalid') };
    }
    return { isValid: true, message: '' };
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return { isValid: false, message: safeT('validation.passwordRequired'), strength: 0 };
    }
    if (password.length < 8) {
      return { isValid: false, message: safeT('validation.passwordTooShort'), strength: 1 };
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const isValid = strength >= 3;
    const message = isValid ? '' : safeT('validation.passwordWeak');
    
    return { isValid, message, strength };
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (!confirmPassword) {
      return { isValid: false, message: safeT('validation.confirmPasswordRequired') };
    }
    if (password !== confirmPassword) {
      return { isValid: false, message: safeT('validation.passwordsDoNotMatch') };
    }
    return { isValid: true, message: '' };
  };

  // Login validation functions (simpler than registration)
  const validateLoginEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return { isValid: false, message: safeT('validation.emailRequired') };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: safeT('validation.emailInvalid') };
    }
    return { isValid: true, message: '' };
  };

  const validateLoginPassword = (password: string) => {
    if (!password) {
      return { isValid: false, message: safeT('validation.passwordRequired') };
    }
    return { isValid: true, message: '' };
  };

  const handleLoginFormChange = (field: string, value: string) => {
    const newForm = { ...loginForm, [field]: value };
    setLoginForm(newForm);
    
    // Clear validation errors when user starts typing
    if (field === 'email') {
      setLoginValidation(prev => ({ ...prev, email: { isValid: true, message: '' } }));
    } else if (field === 'password') {
      setLoginValidation(prev => ({ ...prev, password: { isValid: true, message: '' } }));
    }
  };

  const handleRegisterFormChange = (field: string, value: string | boolean) => {
    const newForm = { ...registerForm, [field]: value };
    setRegisterForm(newForm);
    
    // Real-time validation
    if (field === 'name') {
      setValidation(prev => ({ ...prev, name: validateName(value as string) }));
    } else if (field === 'email') {
      setValidation(prev => ({ ...prev, email: validateEmail(value as string) }));
    } else if (field === 'password') {
      const passwordValidation = validatePassword(value as string);
      const confirmPasswordValidation = validateConfirmPassword(value as string, newForm.confirmPassword);
      setValidation(prev => ({ 
        ...prev, 
        password: passwordValidation,
        confirmPassword: confirmPasswordValidation
      }));
    } else if (field === 'confirmPassword') {
      setValidation(prev => ({ 
        ...prev, 
        confirmPassword: validateConfirmPassword(newForm.password, value as string)
      }));
    }
  };

  const handleRegister = async () => {
    // Validate all fields
    const nameValidation = validateName(registerForm.name);
    const emailValidation = validateEmail(registerForm.email);
    const passwordValidation = validatePassword(registerForm.password);
    const confirmPasswordValidation = validateConfirmPassword(registerForm.password, registerForm.confirmPassword);
    
    setValidation({
      name: nameValidation,
      email: emailValidation,
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation,
    });
    
    if (!nameValidation.isValid || !emailValidation.isValid || !passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: safeT('validation.fixErrors'),
      });
      return;
    }
    
    if (!registerForm.acceptTerms) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: safeT('validation.acceptTermsRequired'),
      });
      return;
    }
    
    try {
      // Use preferences from onboarding if available, otherwise use current system language
      let preferredLanguage: 'en' | 'it' = 'en';
      let dietaryRestrictions: string[] = [];
      
      try {
        const savedPreferences = await AsyncStorage.getItem('user_preferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          preferredLanguage = preferences.preferredLanguage || (i18nInstance?.language as 'en' | 'it') || 'en';
          dietaryRestrictions = preferences.dietaryRestrictions || [];
        } else {
          preferredLanguage = (i18nInstance?.language as 'en' | 'it') || 'en';
        }
      } catch (error) {
        // If we can't read preferences, use current language
        preferredLanguage = (i18nInstance?.language as 'en' | 'it') || 'en';
      }
      
      await register(registerForm.email, registerForm.password, registerForm.name, preferredLanguage, dietaryRestrictions);
      
      // After successful registration, send verification email and go to verification screen
      setEmailVerificationForm({ email: registerForm.email, token: '' });
      await sendEmailVerification(registerForm.email);
      setAuthMode('verify-email');
      
    } catch (error: any) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message,
      });
    }
  };

  const handleForgotPassword = async () => {
    const emailValidation = validateEmail(forgotPasswordForm.email);
    
    if (!emailValidation.isValid) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: emailValidation.message,
      });
      return;
    }

    try {
      console.log('Sending forgot password request for:', forgotPasswordForm.email);
      const response = await forgotPassword(forgotPasswordForm.email);
      console.log('Forgot password response:', response);
      
      // Salva l'email per la schermata successiva
      setVerifyCodeForm({ ...verifyCodeForm, email: forgotPasswordForm.email });
      
      setNotification({
        visible: true,
        type: 'success',
        title: safeT('common.success'),
        message: safeT('auth.resetPasswordSuccess'),
      });
      
      // Vai alla schermata di verifica codice
      setAuthMode('verify-code');
    } catch (error: any) {
      console.error('Error in handleForgotPassword:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message || 'Unknown error occurred',
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!verifyCodeForm.code || verifyCodeForm.code.length !== 6) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: safeT('validation.codeRequired'),
      });
      return;
    }

    // Vai alla schermata reset password se il codice è inserito
    setAuthMode('reset-password');
  };

  const handleResetPassword = async () => {
    const passwordValidation = validatePassword(resetPasswordForm.newPassword);
    const confirmPasswordValidation = validateConfirmPassword(resetPasswordForm.newPassword, resetPasswordForm.confirmNewPassword);
    
    if (!passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: passwordValidation.message || confirmPasswordValidation.message,
      });
      return;
    }

    try {
      await resetPassword(verifyCodeForm.code, resetPasswordForm.newPassword);
      setNotification({
        visible: true,
        type: 'success',
        title: safeT('common.success'),
        message: safeT('auth.passwordResetSuccess'),
      });
      setAuthMode('login');
      setVerifyCodeForm({ email: '', code: '' });
      setResetPasswordForm({ newPassword: '', confirmNewPassword: '' });
    } catch (error: any) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message,
      });
    }
  };

  const handleImageAnalyzed = (ingredients: any[]) => {
    // Only navigate if there are actual ingredients
    if (ingredients && ingredients.length > 0) {
      setAppState({
        ...appState,
        currentScreen: 'ingredients',
        ingredients: [...appState.ingredients, ...ingredients],
      });
    }
    // If no ingredients, stay on camera screen and let CameraScreen handle the modal
  };

  const handleRecipeGenerated = (recipe: any) => {
    setAppState({
      ...appState,
      currentScreen: 'recipe',
      recipe,
      isRecipeJustGenerated: true,
    });
  };

  const handleStartOver = () => {
    setAppState({
      currentScreen: 'home',
      activeTab: 'home',
      ingredients: [],
      recipe: null,
      isRecipeJustGenerated: false,
      allRecipes: [],
      currentRecipeIndex: 0,
      isCookingModeActive: false,
      isPublicRecipe: false,
    });
  };

  const handleTabPress = (tab: TabName) => {
    // Check if we're in cooking mode and trying to navigate away
    if (appState.isCookingModeActive && appState.currentScreen === 'cooking') {
      setPendingTab(tab);
      setShowCookingExitModal(true);
      return;
    }

    if (tab === 'camera') {
      setAppState({
        ...appState,
        currentScreen: 'camera',
        activeTab: tab,
      });
    } else {
      setAppState({
        ...appState,
        currentScreen: tab,
        activeTab: tab,
      });
    }
  };

  const handleConfirmExitCooking = () => {
    setShowCookingExitModal(false);
    
    if (pendingTab) {
      if (pendingTab === 'camera') {
        setAppState({
          ...appState,
          currentScreen: 'camera',
          activeTab: pendingTab,
          isCookingModeActive: false,
        });
      } else {
        setAppState({
          ...appState,
          currentScreen: pendingTab,
          activeTab: pendingTab,
          isCookingModeActive: false,
        });
      }
      setPendingTab(null);
    }
  };

  const handleCancelExitCooking = () => {
    setShowCookingExitModal(false);
    setPendingTab(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAppState({
        currentScreen: 'home',
        activeTab: 'home',
        ingredients: [],
        recipe: null,
        isRecipeJustGenerated: false,
        allRecipes: [],
        currentRecipeIndex: 0,
      });
      
      // Reset to welcome screen (don't show onboarding again after logout)
      setAuthMode('welcome');
    } catch (error) {
      // Logout error
    }
  };

  // Function to reset onboarding (useful for testing or if user wants to see onboarding again)
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_completed');
      await AsyncStorage.removeItem('user_preferences');
      setShowOnboarding(true);
      setOnboardingCompleted(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const handleEmailVerification = async () => {
    try {
      await verifyEmail(emailVerificationForm.email, emailVerificationForm.token);
      
      setNotification({
        visible: true,
        type: 'success',
        title: safeT('auth.verificationSuccess', 'Email Verified'),
        message: safeT('auth.verificationSuccessMessage', 'Your email has been verified successfully! Welcome to FridgeWise.'),
      });
      
      // Clear forms - user will be automatically logged in
      setEmailVerificationForm({ email: '', token: '' });
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
      });
      
    } catch (error: any) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message || safeT('auth.verificationError', 'Failed to verify email. Please try again.'),
      });
    }
  };

  const handleResendVerificationCode = async () => {
    try {
      await sendEmailVerification(emailVerificationForm.email);
      setNotification({
        visible: true,
        type: 'success',
        title: safeT('auth.codeSent', 'Code Sent'),
        message: safeT('auth.verificationCodeSent', 'A new verification code has been sent to your email.'),
      });
    } catch (error: any) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message || safeT('auth.resendError', 'Failed to resend code. Please try again.'),
      });
    }
  };

  const handleGoBack = () => {
    if (appState.currentScreen === 'camera') {
      setAppState({ ...appState, currentScreen: 'home', ingredients: [] });
    } else if (appState.currentScreen === 'ingredients') {
      setAppState({ ...appState, currentScreen: 'camera', ingredients: [] });
    } else if (appState.currentScreen === 'recipe') {
      // If we came from recipes tab, saved tab, or home tab, go back to that tab
      if (appState.activeTab === 'recipes' || appState.activeTab === 'saved' || appState.activeTab === 'home') {
        setAppState({ ...appState, currentScreen: appState.activeTab });
      } else {
        // Otherwise, go back to ingredients (default flow from camera/ingredients)
        setAppState({ ...appState, currentScreen: 'ingredients' });
      }
    } else if (appState.currentScreen === 'cooking') {
      // Go back to recipe screen from cooking mode
      setAppState({ ...appState, currentScreen: 'recipe', isCookingModeActive: false });
    }
  };

  const handleNavigateToRecipe = (index: number) => {
    if (appState.allRecipes[index]) {
      setAppState({
        ...appState,
        recipe: appState.allRecipes[index],
        currentRecipeIndex: index,
      });
    }
  };

  const handleStartCooking = (recipe: any) => {
    // handleStartCooking called with recipe
    
    setAppState({
      ...appState,
      currentScreen: 'cooking',
      recipe,
      isCookingModeActive: true,
    });
  };

  const handleFinishCooking = () => {
    setAppState({
      ...appState,
      currentScreen: 'saved',
      activeTab: 'saved',
      isCookingModeActive: false,
    });
  };

  const handleSelectRecipeFromList = (recipe: any, allRecipes: any[], index: number, tab: TabName, isPublic?: boolean) => {
    setAppState({
      ...appState,
      currentScreen: 'recipe',
      recipe,
      activeTab: tab,
      isRecipeJustGenerated: false,
      allRecipes,
      currentRecipeIndex: index,
      isPublicRecipe: isPublic || false, // Add flag to track if recipe is public
    });
  };

  // Show maintenance screen if backend is down or in maintenance
  if (!backendStatus.isHealthy || backendStatus.isMaintenance) {
    return (
      <MaintenanceScreen
        onRetry={handleRetryConnection}
        isRetrying={backendStatus.isCheckingHealth}
      />
    );
  }

  const styles = getStyles(colors);

  if (isLoading || backendStatus.isCheckingHealth || showOnboarding === null) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {backendStatus.isCheckingHealth ? 'Checking connection...' : safeT('common.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  // Render the notification modal at the top level
  const renderNotificationModal = () => (
    <NotificationModal
      visible={notification.visible}
      type={notification.type}
      title={notification.title}
      message={notification.message}
      onClose={() => setNotification({ ...notification, visible: false })}
    />
  );


  // Show onboarding if user is not logged in and hasn't completed onboarding
  if (!user && showOnboarding) {
    return (
      <>
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        {renderNotificationModal()}
      </>
    );
  }

  if (!user) {
    if (authMode === 'welcome') {
      return (
        <>
          <SafeAreaView style={styles.welcomeContainer}>
            <AnimatedContainer animationType="staggered">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeHeader}>
              <View style={styles.logoSection}>
                <LogoComponent width={120} height={108} />
                <Text style={styles.welcomeTitle}>FridgeWise</Text>
                <Text style={styles.welcomeTagline}>Smart. Simple. Delicious.</Text>
              </View>
              <Text style={styles.welcomeSubtitle}>
                {safeT('home.subtitle')}
              </Text>
            </View>
            
            <View style={styles.illustrationContainer}>
              <View style={styles.phoneFrame}>
                <View style={styles.phoneContent}>
                  <View style={styles.ingredientsColumn}>
                    <View style={styles.ingredientItem}>
                      <View style={styles.ingredientIcon}>
                        <Text style={styles.emoji}>🍅</Text>
                      </View>
                      <Text style={styles.ingredientText}>Tomatoes</Text>
                    </View>
                    <View style={styles.ingredientItem}>
                      <View style={styles.ingredientIcon}>
                        <Text style={styles.emoji}>🧀</Text>
                      </View>
                      <Text style={styles.ingredientText}>Cheese</Text>
                    </View>
                    <View style={styles.ingredientItem}>
                      <View style={styles.ingredientIcon}>
                        <Text style={styles.emoji}>🌿</Text>
                      </View>
                      <Text style={styles.ingredientText}>Basil</Text>
                    </View>
                  </View>
                  
                  <View style={styles.aiMagicColumn}>
                    <View style={styles.aiIcon}>
                      <Text style={styles.lightningEmoji}>⚡</Text>
                    </View>
                    <Text style={styles.aiText}>AI Magic</Text>
                  </View>
                </View>
                
                <View style={styles.recipeResult}>
                  <Text style={styles.resultLabel}>Suggested Recipe</Text>
                  <Text style={styles.resultTitle}>Pizza Margherita</Text>
                </View>
              </View>
            </View>

          </ScrollView>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          </AnimatedContainer>
          </SafeAreaView>
          
          <AnimatedContainer animationType="slideUp" delay={150}>
          <View style={[styles.fixedBottomButtons, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => setAuthMode('register')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{safeT('auth.register')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setAuthMode('login')}
            >
              <Text style={styles.secondaryButtonText}>{safeT('auth.login')}</Text>
            </TouchableOpacity>
          </View>
          </AnimatedContainer>
          
          {renderNotificationModal()}
        </>
      );
    }
    
    if (authMode === 'login') {
      return (
        <>
          <SafeAreaView style={styles.authContainer}>
            <AnimatedContainer animationType="slideLeft">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setAuthMode('welcome')}
              >
                <Text style={styles.backButtonText}>{String(`← ${safeT('common.back')}`)}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{safeT('auth.signIn')}</Text>
            </View>
            
            <View style={styles.authForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.email')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      !loginValidation.email.isValid ? styles.inputError : null
                    ]}
                    value={loginForm.email}
                    onChangeText={(text) => handleLoginFormChange('email', text)}
                    placeholder={safeT('auth.email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    autoComplete="email"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                {!loginValidation.email.isValid && (
                  <Text style={styles.errorText}>{loginValidation.email.message}</Text>
                )}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.password')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      !loginValidation.password.isValid ? styles.inputError : null
                    ]}
                    value={loginForm.password}
                    onChangeText={(text) => handleLoginFormChange('password', text)}
                    placeholder={safeT('auth.password')}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    autoComplete="current-password"
                    placeholderTextColor={colors.textSecondary}
                    onSubmitEditing={handleLogin}
                    returnKeyType="go"
                  />
                </View>
                {!loginValidation.password.isValid && (
                  <Text style={styles.errorText}>{loginValidation.password.message}</Text>
                )}
              </View>
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>{safeT('auth.signIn')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setAuthMode('forgot-password')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setAuthMode('register')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.dontHaveAccount')} {safeT('auth.register')}
                </Text>
              </TouchableOpacity>
              
            </View>
          </ScrollView>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          </AnimatedContainer>
          </SafeAreaView>
          {renderNotificationModal()}
        </>
      );
    }
    
    if (authMode === 'register') {
      return (
        <>
          <SafeAreaView style={styles.authContainer}>
            <AnimatedContainer animationType="slideRight">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setAuthMode('welcome')}
              >
                <Text style={styles.backButtonText}>{String(`← ${safeT('common.back')}`)}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{safeT('auth.register')}</Text>
            </View>
            
            <View style={styles.authForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.name')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      validation.name.message ? styles.inputError : null,
                      validation.name.isValid ? styles.inputValid : null
                    ]}
                    value={registerForm.name}
                    onChangeText={(text) => handleRegisterFormChange('name', text)}
                    placeholder={safeT('auth.name')}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="name"
                    autoComplete="name"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {registerForm.name.length > 0 && (
                    <ValidationIcon isValid={validation.name.isValid} colors={colors} />
                  )}
                </View>
                {validation.name.message ? (
                  <Text style={styles.errorText}>{validation.name.message}</Text>
                ) : null}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.email')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      validation.email.message ? styles.inputError : null,
                      validation.email.isValid ? styles.inputValid : null
                    ]}
                    value={registerForm.email}
                    onChangeText={(text) => handleRegisterFormChange('email', text)}
                    placeholder={safeT('auth.email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    autoComplete="email"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {registerForm.email.length > 0 && (
                    <ValidationIcon isValid={validation.email.isValid} colors={colors} />
                  )}
                </View>
                {validation.email.message ? (
                  <Text style={styles.errorText}>{validation.email.message}</Text>
                ) : null}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.password')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      validation.password.message ? styles.inputError : null,
                      validation.password.isValid ? styles.inputValid : null
                    ]}
                    value={registerForm.password}
                    onChangeText={(text) => handleRegisterFormChange('password', text)}
                    placeholder={safeT('auth.password')}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {registerForm.password.length > 0 && (
                    <ValidationIcon isValid={validation.password.isValid} colors={colors} />
                  )}
                </View>
                {validation.password.message ? (
                  <Text style={styles.errorText}>{validation.password.message}</Text>
                ) : null}
                {registerForm.password.length > 0 && (
                  <PasswordStrengthIndicator strength={validation.password.strength} colors={colors} t={safeT} />
                )}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.confirmPassword')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      validation.confirmPassword.message ? styles.inputError : null,
                      validation.confirmPassword.isValid ? styles.inputValid : null
                    ]}
                    value={registerForm.confirmPassword}
                    onChangeText={(text) => handleRegisterFormChange('confirmPassword', text)}
                    placeholder={safeT('auth.confirmPassword')}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {registerForm.confirmPassword.length > 0 && (
                    <ValidationIcon isValid={validation.confirmPassword.isValid} colors={colors} />
                  )}
                </View>
                {validation.confirmPassword.message ? (
                  <Text style={styles.errorText}>{validation.confirmPassword.message}</Text>
                ) : null}
              </View>
              
              <View style={styles.termsContainer}>
                <Switch
                  value={registerForm.acceptTerms}
                  onValueChange={(value) => handleRegisterFormChange('acceptTerms', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={registerForm.acceptTerms ? colors.buttonText : colors.textSecondary}
                />
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    {safeT('auth.acceptTerms')}{' '}
                    <Text style={styles.termsLink}>{safeT('auth.termsOfService')}</Text>
                    {' '}{safeT('auth.and')}{' '}
                    <Text style={styles.termsLink}>{safeT('auth.privacyPolicy')}</Text>
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.primaryButton,
                  (!validation.name.isValid || !validation.email.isValid || !validation.password.isValid || !validation.confirmPassword.isValid || !registerForm.acceptTerms) && styles.primaryButtonDisabled
                ]} 
                onPress={handleRegister}
                disabled={!validation.name.isValid || !validation.email.isValid || !validation.password.isValid || !validation.confirmPassword.isValid || !registerForm.acceptTerms}
              >
                <Text style={styles.primaryButtonText}>{safeT('auth.register')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setAuthMode('login')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.alreadyHaveAccount')} {safeT('auth.login')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          </AnimatedContainer>
          </SafeAreaView>
          {renderNotificationModal()}
        </>
      );
    }
    
    if (authMode === 'forgot-password') {
      return (
        <>
          <SafeAreaView style={styles.authContainer}>
            <AnimatedContainer animationType="slideUp">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setAuthMode('login')}
              >
                <Text style={styles.backButtonText}>{String(`← ${safeT('auth.backToLogin')}`)}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{safeT('auth.resetPassword')}</Text>
            </View>
            
            <View style={styles.authForm}>
              <Text style={styles.instructionText}>
                {safeT('auth.resetPasswordInstructions')}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.email')}</Text>
                <TextInput
                  style={styles.input}
                  value={forgotPasswordForm.email}
                  onChangeText={(text) => setForgotPasswordForm({ ...forgotPasswordForm, email: text })}
                  placeholder={safeT('auth.email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleForgotPassword}>
                <Text style={styles.primaryButtonText}>{safeT('auth.sendResetEmail')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setAuthMode('login')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.backToLogin')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          </AnimatedContainer>
          </SafeAreaView>
          {renderNotificationModal()}
        </>
      );
    }
    
    if (authMode === 'verify-code') {
      return (
        <>
          <SafeAreaView style={styles.authContainer}>
            <AnimatedContainer animationType="scale">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setAuthMode('forgot-password')}
              >
                <Text style={styles.backButtonText}>{String(`← ${safeT('common.back')}`)}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{safeT('auth.verifyCode')}</Text>
            </View>
            
            <View style={styles.authForm}>
              <Text style={styles.instructionText}>
                {safeT('auth.verifyCodeInstructions')}
              </Text>
              
              <View style={styles.otpContainer}>
                <Text style={[styles.label, { textAlign: 'center' }]}>{safeT('auth.resetCode')}</Text>
                <OTPInput
                  length={6}
                  value={verifyCodeForm.code}
                  onChange={(code) => setVerifyCodeForm({ ...verifyCodeForm, code })}
                  autoFocus={true}
                />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.primaryButton,
                  verifyCodeForm.code.length !== 6 && styles.primaryButtonDisabled
                ]} 
                onPress={handleVerifyCode}
                disabled={verifyCodeForm.code.length !== 6}
              >
                <Text style={styles.primaryButtonText}>{safeT('auth.verifyCode')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setAuthMode('forgot-password')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.resendCode')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          </AnimatedContainer>
          </SafeAreaView>
          {renderNotificationModal()}
        </>
      );
    }
    
    if (authMode === 'reset-password') {
      return (
        <>
          <SafeAreaView style={styles.authContainer}>
            <AnimatedContainer animationType="slideDown">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setAuthMode('login')}
              >
                <Text style={styles.backButtonText}>{String(`← ${safeT('auth.backToLogin')}`)}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{safeT('auth.enterNewPassword')}</Text>
            </View>
            
            <View style={styles.authForm}>
              <Text style={styles.instructionText}>
                {safeT('auth.enterNewPasswordInstructions')}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.newPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={resetPasswordForm.newPassword}
                  onChangeText={(text) => setResetPasswordForm({ ...resetPasswordForm, newPassword: text })}
                  placeholder={safeT('auth.newPassword')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.confirmNewPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={resetPasswordForm.confirmNewPassword}
                  onChangeText={(text) => setResetPasswordForm({ ...resetPasswordForm, confirmNewPassword: text })}
                  placeholder={safeT('auth.confirmNewPassword')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword}>
                <Text style={styles.primaryButtonText}>{safeT('auth.resetPassword')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setAuthMode('login')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.backToLogin')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          </AnimatedContainer>
          </SafeAreaView>
          {renderNotificationModal()}
        </>
      );
    }

    if (authMode === 'verify-email') {
      return (
        <>
          <SafeAreaView style={styles.authContainer}>
            <AnimatedContainer animationType="scale">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setAuthMode('register')}
              >
                <Text style={styles.backButtonText}>{String(`← ${safeT('common.back')}`)}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{safeT('auth.verifyEmail', 'Verify Email')}</Text>
            </View>
            
            <View style={styles.authForm}>
              <Text style={styles.instructionText}>
                {safeT('auth.verifyEmailInstructions', 'Enter the 6-digit code sent to your email address to verify your account.')}
              </Text>
              
              <Text style={styles.emailDisplayText}>
                {emailVerificationForm.email}
              </Text>
              
              <View style={styles.inputGroup}>
                <OTPInput
                  length={6}
                  value={emailVerificationForm.token}
                  onChange={(code) => setEmailVerificationForm({...emailVerificationForm, token: code})}
                  autoFocus={true}
                />
              </View>
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleEmailVerification}>
                <Text style={styles.primaryButtonText}>{safeT('auth.verifyEmail', 'Verify Email')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={handleResendVerificationCode}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.resendCode')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          </AnimatedContainer>
          </SafeAreaView>
          {renderNotificationModal()}
        </>
      );
    }
  }

  // Special screens without bottom navigation (only ingredients and recipe flow)
  if (appState.currentScreen === 'ingredients') {
    return (
      <IngredientsScreen
        ingredients={appState.ingredients}
        onGenerateRecipe={handleRecipeGenerated}
        onGoBack={handleGoBack}
        onGoToCamera={(currentIngredients) => setAppState({ ...appState, currentScreen: 'camera', ingredients: currentIngredients })}
      />
    );
  }
  
  if (appState.currentScreen === 'recipe') {
    return (
      <RecipeScreen
        recipe={appState.recipe}
        onGoBack={handleGoBack}
        onStartOver={handleStartOver}
        onGoToSaved={() => setAppState({ ...appState, currentScreen: 'saved', activeTab: 'saved' })}
        onGoToRecipes={() => setAppState({ ...appState, currentScreen: 'recipes', activeTab: 'recipes' })}
        onStartCooking={handleStartCooking}
        isJustGenerated={appState.isRecipeJustGenerated}
        recipes={appState.allRecipes}
        currentIndex={appState.currentRecipeIndex}
        onNavigateToRecipe={handleNavigateToRecipe}
        onRecipeUpdate={async (updatedRecipe) => {
          // Updating recipe
          
          // Check if this is a transition from temporary to saved recipe
          const wasTempRecipe = appState.isRecipeJustGenerated && !appState.recipe?.id && !appState.recipe?._id;
          const isNowSaved = updatedRecipe.id || updatedRecipe._id;
          
          // Recipe state transition
          
          if (wasTempRecipe && isNowSaved) {
            // Transitioning from temporary to saved recipe
            // Transition from temporary to saved recipe - update state to show normal recipe view
            setAppState({ 
              ...appState, 
              recipe: updatedRecipe,
              isRecipeJustGenerated: false // No longer just generated
            });
            return;
          }
          
          // Update state immediately for UI responsiveness
          setAppState({ ...appState, recipe: updatedRecipe });
          
          // Save to database if recipe has ID (for AI chat modifications)
          if (updatedRecipe._id) {
            try {
              // Saving recipe to database
              
              // Fix ingredients with empty units (database requires non-empty unit field)
              const fixedIngredients = updatedRecipe.ingredients.map((ing: any) => ({
                ...ing,
                unit: ing.unit || 'q.b.' // Use 'q.b.' if unit is empty
              }));
              
              const requestBody = {
                title: updatedRecipe.title,
                description: updatedRecipe.description,
                ingredients: fixedIngredients,
                instructions: updatedRecipe.instructions,
                stepTimers: updatedRecipe.stepTimers,
                cookingTime: updatedRecipe.cookingTime,
                servings: updatedRecipe.servings,
                difficulty: updatedRecipe.difficulty,
                dietaryTags: updatedRecipe.dietaryTags
              };
              
              // Request body prepared
              
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000'}/api/recipe/${updatedRecipe._id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
              });
              
              if (response.ok) {
                // Recipe saved successfully to database
              } else {
                const errorText = await response.text();
                // Failed to save recipe to database
              }
            } catch (error) {
              // Error saving recipe
            }
          } else {
            // Recipe has no ID, skipping database save
          }
        }}
        isPublic={appState.isPublicRecipe}
      />
    );
  }
  
  
  if (appState.currentScreen === 'admin-stats') {
    return (
      <AdminStatsScreen
        onGoBack={() => setAppState({ ...appState, currentScreen: 'profile' })}
      />
    );
  }

  // Main app screens with bottom navigation
  const renderMainContent = () => {
    switch (appState.currentScreen) {
      case 'camera':
        return (
          <CameraScreen
            onImageAnalyzed={handleImageAnalyzed}
            onGoBack={() => setAppState({ ...appState, currentScreen: 'home', activeTab: 'home' })}
            onGoToManualInput={() => setAppState({ ...appState, currentScreen: 'ingredients', ingredients: [] })}
          />
        );
      
      case 'recipes':
        return (
          <RecipesScreen
            onSelectRecipe={(recipe, allRecipes, index, isPublic) => handleSelectRecipeFromList(recipe, allRecipes, index, 'recipes', isPublic)}
            onGoToCamera={() => setAppState({ ...appState, currentScreen: 'camera', activeTab: 'camera' })}
          />
        );
      
      case 'saved':
        return (
          <SavedScreen
            onSelectRecipe={(recipe, allRecipes, index) => handleSelectRecipeFromList(recipe, allRecipes, index, 'saved')}
          />
        );
      
      case 'profile':
        return (
          <ProfileScreen
            onLogout={handleLogout}
            onShowAdminStats={() => setAppState({ ...appState, currentScreen: 'admin-stats' })}
          />
        );
      
      case 'cooking':
        return appState.recipe ? (
          <CookingModeScreen
            recipe={appState.recipe}
            onGoBack={handleGoBack}
            onFinishCooking={handleFinishCooking}
            showForceExitModal={showCookingExitModal}
            onForceExitConfirm={handleConfirmExitCooking}
            onForceExitCancel={handleCancelExitCooking}
            isPublicRecipe={appState.isPublicRecipe}
          />
        ) : null;
      
      default: // 'home'
        return (
          <HomeScreen
            onNavigateToCamera={() => setAppState({ ...appState, currentScreen: 'camera', activeTab: 'camera' })}
            onSelectRecipe={(recipe, allRecipes, index) => handleSelectRecipeFromList(recipe, allRecipes, index, 'home')}
          />
        );
    }
  };

  return (
    <>
      <View style={styles.appContainer}>
        {renderMainContent()}
        <BottomNavigation
          activeTab={appState.activeTab}
          onTabPress={handleTabPress}
        />
      </View>
      {renderNotificationModal()}
    </>
  );
};

// Keep splash screen visible during initial load
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  // App Container
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 0 : 0, // SafeAreaView handles iOS automatically
  },
  
  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // Handle status bar on iOS
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    fontFamily: 'System',
  },

  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  welcomeTagline: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
    fontFamily: 'System',
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  phoneFrame: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: colors.border || '#F3F4F6',
    transform: [{ rotate: '2deg' }],
    maxWidth: 300,
    width: '100%',
  },
  phoneContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  ingredientsColumn: {
    flex: 1,
    paddingRight: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  ingredientIcon: {
    width: 28,
    height: 28,
    backgroundColor: colors.surface,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emoji: {
    fontSize: 16,
  },
  ingredientText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    fontFamily: 'System',
  },
  aiMagicColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  aiIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  lightningEmoji: {
    fontSize: 20,
    color: 'rgb(22, 163, 74)',
  },
  aiText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'System',
  },
  recipeResult: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgb(22, 163, 74)',
    marginBottom: 2,
    fontFamily: 'System',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'System',
  },


  // Fixed Bottom Buttons
  fixedBottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.buttonText,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Auth Screens
  authContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  authHeader: {
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  backButton: {
    marginBottom: 32,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'System',
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },

  // Form
  authForm: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    fontFamily: 'System',
    elevation: 1,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  inputValid: {
    borderColor: colors.success,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontFamily: 'System',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  termsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'System',
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'System',
  },
  instructionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: 'System',
  },
  emailDisplayText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
    paddingHorizontal: 20,
    fontFamily: 'System',
  },
  otpContainer: {
    marginBottom: 24,
  },

  // Home Screen (legacy)
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: 'System',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
  },
});