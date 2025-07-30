import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme, Appearance, AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  sectionHeader: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Interactive elements
  button: string;
  buttonText: string;
  inputBackground: string;
  inputBorder: string;
  
  // Special elements
  shadow: string;
  overlay: string;
}

export const lightTheme: ThemeColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: '#F8F9FA',
  sectionHeader: '#FFFFFF',
  
  text: '#1C1C1E',
  textSecondary: '#6B7280', // WCAG Fix: Was #8E8E93 → Now 4.54:1 ratio
  textTertiary: '#9CA3AF', // WCAG Fix: Improved from #C7C7CC
  
  primary: 'rgb(16, 120, 56)', // WCAG Fix: Darker for better button contrast
  primaryDark: 'rgb(14, 100, 48)', // WCAG Fix: Adjusted proportionally
  
  success: 'rgb(16, 120, 56)', // WCAG Fix: Match primary for consistency
  error: '#DC2626', // WCAG Fix: Was #FF3B30 → Now 4.89:1 ratio
  warning: '#B45309', // WCAG Fix: Darker for better contrast
  
  border: '#E5E5EA',
  divider: '#E5E7EB',
  
  button: 'rgb(16, 120, 56)', // WCAG Fix: Match primary
  buttonText: '#FFFFFF', // Now compliant with darker button background
  inputBackground: '#FFFFFF',
  inputBorder: '#E5E7EB',
  
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkTheme: ThemeColors = {
  background: '#1C1C1E',
  surface: '#2C2C2E',
  card: '#3A3A3C',
  sectionHeader: '#2C2C2E',
  
  text: '#FFFFFF',
  textSecondary: '#A4A4A4', // WCAG Fix: Final optimization for card contrast
  textTertiary: '#6B7280', // WCAG Fix: Improved from #48484A
  
  primary: 'rgb(30, 215, 96)',
  primaryDark: 'rgb(22, 163, 74)',
  
  success: 'rgb(30, 215, 96)',
  error: '#F87171', // WCAG Fix: Slightly lighter for better surface contrast
  warning: '#FBBF24', // WCAG Fix: Better contrast (was #FF9F0A)
  
  border: '#38383A',
  divider: '#38383A',
  
  button: 'rgb(30, 215, 96)',
  buttonText: '#000000', // Excellent contrast maintained
  inputBackground: '#2C2C2E',
  inputBorder: '#38383A',
  
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  colors: ThemeColors;
  isHighContrast: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  userThemeMode?: 'auto' | 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, userThemeMode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [isLoading, setIsLoading] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);


  // Calculate if dark mode should be active
  const isDarkMode = themeMode === 'auto' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';


  // Load theme preference from storage or user data
  useEffect(() => {
    if (userThemeMode) {
      // Use user's database preference if available
      setThemeMode(userThemeMode);
      setIsLoading(false);
    } else {
      // Fall back to local storage
      loadThemePreference();
    }
  }, [userThemeMode]);

  // Sync with user theme mode changes
  useEffect(() => {
    if (userThemeMode && userThemeMode !== themeMode) {
      setThemeMode(userThemeMode);
    }
  }, [userThemeMode]);

  // Monitor high contrast accessibility setting
  useEffect(() => {
    const checkHighContrast = async () => {
      try {
        const enabled = await AccessibilityInfo.isHighContrastEnabled();
        setIsHighContrast(enabled);
      } catch (error) {
        console.log('High contrast detection not available on this platform');
        setIsHighContrast(false);
      }
    };
    
    checkHighContrast();
    
    const subscription = AccessibilityInfo.addEventListener(
      'highContrastChanged',
      (enabled) => setIsHighContrast(enabled)
    );
    
    return () => subscription?.remove();
  }, []);

  // Monitor system color scheme changes
  useEffect(() => {
    // Also check Appearance API
    const appearanceScheme = Appearance.getColorScheme();
  }, [systemColorScheme]);

  // Add Appearance listener as backup
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Color scheme changed
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem('theme_mode');
      
      if (savedThemeMode !== null && ['auto', 'light', 'dark'].includes(savedThemeMode)) {
        setThemeMode(savedThemeMode as ThemeMode);
      } else {
        setThemeMode('auto');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setThemeMode('auto'); // Fallback to auto
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const setTheme = (isDark: boolean) => {
    const mode = isDark ? 'dark' : 'light';
    setThemeMode(mode);
    saveThemeMode(mode);
  };

  const setThemeModeHandler = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
  };

  const toggleTheme = () => {
    // When toggling, switch between light and dark (not auto)
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeModeHandler(newMode);
  };

  // Apply theme colors with high contrast adjustments
  const colors = useMemo(() => {
    const baseColors = isDarkMode ? darkTheme : lightTheme;
    
    if (isHighContrast) {
      // Apply high contrast adjustments for maximum accessibility
      return {
        ...baseColors,
        textSecondary: isDarkMode ? '#FFFFFF' : '#000000',
        border: isDarkMode ? '#FFFFFF' : '#000000',
        divider: isDarkMode ? '#FFFFFF' : '#000000',
        inputBorder: isDarkMode ? '#FFFFFF' : '#000000',
      };
    }
    
    return baseColors;
  }, [isDarkMode, isHighContrast]);

  const value: ThemeContextType = {
    isDarkMode,
    themeMode,
    colors,
    isHighContrast,
    toggleTheme,
    setTheme,
    setThemeMode: setThemeModeHandler,
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};