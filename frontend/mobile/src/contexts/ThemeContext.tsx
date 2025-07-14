import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
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
  background: '#F0F0F0',
  surface: '#FFFFFF',
  card: '#F8F9FA',
  sectionHeader: '#FFFFFF',
  
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  
  primary: 'rgb(22, 163, 74)',
  primaryDark: 'rgb(16, 120, 56)',
  
  success: 'rgb(22, 163, 74)',
  error: '#FF3B30',
  warning: '#FF9500',
  
  border: '#E5E5EA',
  divider: '#E5E7EB',
  
  button: 'rgb(22, 163, 74)',
  buttonText: '#FFFFFF',
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
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',
  
  primary: 'rgb(30, 215, 96)',
  primaryDark: 'rgb(22, 163, 74)',
  
  success: 'rgb(30, 215, 96)',
  error: '#FF453A',
  warning: '#FF9F0A',
  
  border: '#38383A',
  divider: '#38383A',
  
  button: 'rgb(30, 215, 96)',
  buttonText: '#000000',
  inputBackground: '#2C2C2E',
  inputBorder: '#38383A',
  
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log('🎨 ThemeProvider Debug:', {
    systemColorScheme,
    themeMode,
    currentTime: new Date().toLocaleTimeString()
  });

  // Calculate if dark mode should be active
  const isDarkMode = themeMode === 'auto' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  console.log('🌙 Theme Result:', {
    isDarkMode,
    systemColorScheme,
    themeMode
  });

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Monitor system color scheme changes
  useEffect(() => {
    console.log('🔄 System color scheme changed:', systemColorScheme);
    
    // Also check Appearance API
    const appearanceScheme = Appearance.getColorScheme();
    console.log('🎨 Appearance API says:', appearanceScheme);
  }, [systemColorScheme]);

  // Add Appearance listener as backup
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('📲 Appearance listener triggered:', colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem('theme_mode');
      console.log('📱 Loaded theme from storage:', savedThemeMode);
      
      if (savedThemeMode !== null && ['auto', 'light', 'dark'].includes(savedThemeMode)) {
        console.log('✅ Setting theme mode to:', savedThemeMode);
        setThemeMode(savedThemeMode as ThemeMode);
      } else {
        console.log('🔄 No saved theme, defaulting to auto');
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

  const colors = isDarkMode ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    isDarkMode,
    themeMode,
    colors,
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