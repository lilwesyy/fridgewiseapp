import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CameraScreen } from './src/components/CameraScreen';
import { IngredientsScreen } from './src/components/IngredientsScreen';
import { RecipeScreen } from './src/components/RecipeScreen';
import './src/i18n';

type Screen = 'home' | 'camera' | 'ingredients' | 'recipe';

interface AppState {
  currentScreen: Screen;
  ingredients: any[];
  recipe: any;
}

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading, login } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'home',
    ingredients: [],
    recipe: null,
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async () => {
    try {
      await login(loginForm.email, loginForm.password);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleImageAnalyzed = (ingredients: any[]) => {
    setAppState({
      ...appState,
      currentScreen: 'ingredients',
      ingredients,
    });
  };

  const handleRecipeGenerated = (recipe: any) => {
    setAppState({
      ...appState,
      currentScreen: 'recipe',
      recipe,
    });
  };

  const handleStartOver = () => {
    setAppState({
      currentScreen: 'home',
      ingredients: [],
      recipe: null,
    });
  };

  const handleGoBack = () => {
    if (appState.currentScreen === 'camera') {
      setAppState({ ...appState, currentScreen: 'home' });
    } else if (appState.currentScreen === 'ingredients') {
      setAppState({ ...appState, currentScreen: 'camera' });
    } else if (appState.currentScreen === 'recipe') {
      setAppState({ ...appState, currentScreen: 'ingredients' });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>FridgeWiseAI</Text>
        <Text style={styles.subtitle}>{t('auth.signIn')}</Text>
        
        <View style={styles.loginForm}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <Text style={styles.input}>{loginForm.email}</Text>
          
          <Text style={styles.label}>{t('auth.password')}</Text>
          <Text style={styles.input}>{loginForm.password}</Text>
          
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
        
        <StatusBar style="auto" />
      </View>
    );
  }

  switch (appState.currentScreen) {
    case 'camera':
      return (
        <CameraScreen
          onImageAnalyzed={handleImageAnalyzed}
          onGoBack={handleGoBack}
        />
      );
    
    case 'ingredients':
      return (
        <IngredientsScreen
          ingredients={appState.ingredients}
          onGenerateRecipe={handleRecipeGenerated}
          onGoBack={handleGoBack}
        />
      );
    
    case 'recipe':
      return (
        <RecipeScreen
          recipe={appState.recipe}
          onGoBack={handleGoBack}
          onStartOver={handleStartOver}
        />
      );
    
    default:
      return (
        <View style={styles.container}>
          <Text style={styles.title}>FridgeWiseAI</Text>
          <Text style={styles.subtitle}>
            {t('common.welcome', { name: user.name || user.email })}
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => setAppState({ ...appState, currentScreen: 'camera' })}
          >
            <Text style={styles.buttonText}>{t('camera.title')}</Text>
          </TouchableOpacity>
          
          <StatusBar style="auto" />
        </View>
      );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6C757D',
    marginBottom: 40,
    textAlign: 'center',
  },
  loginForm: {
    width: '100%',
    maxWidth: 300,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
