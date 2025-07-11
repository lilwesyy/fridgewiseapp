import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CameraScreen } from './src/components/CameraScreen';
import { IngredientsScreen } from './src/components/IngredientsScreen';
import { RecipeScreen } from './src/components/RecipeScreen';
import { RecipesScreen } from './src/components/RecipesScreen';
import { SavedScreen } from './src/components/SavedScreen';
import { ProfileScreen } from './src/components/ProfileScreen';
import { HomeScreen } from './src/components/HomeScreen';
import { BottomNavigation, TabName } from './src/components/BottomNavigation';
import Svg, { Path, G } from 'react-native-svg';
import './src/i18n';

type Screen = 'home' | 'camera' | 'ingredients' | 'recipe' | 'recipes' | 'saved' | 'profile';

interface AppState {
  currentScreen: Screen;
  activeTab: TabName;
  ingredients: any[];
  recipe: any;
  isRecipeJustGenerated: boolean;
  allRecipes: any[]; // Array of all recipes for navigation
  currentRecipeIndex: number; // Current recipe index
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

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { user, token, isLoading, login, register } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'home',
    activeTab: 'home',
    ingredients: [],
    recipe: null,
    isRecipeJustGenerated: false,
    allRecipes: [],
    currentRecipeIndex: 0,
  });

  const [authMode, setAuthMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async () => {
    try {
      await login(loginForm.email, loginForm.password);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleRegister = async () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }
    try {
      await register(registerForm.email, registerForm.password, registerForm.name);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
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
    });
  };

  const handleTabPress = (tab: TabName) => {
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

  const handleLogout = () => {
    setAppState({
      currentScreen: 'home',
      activeTab: 'home',
      ingredients: [],
      recipe: null,
      isRecipeJustGenerated: false,
      allRecipes: [],
      currentRecipeIndex: 0,
    });
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

  const handleSelectRecipeFromList = (recipe: any, allRecipes: any[], index: number, tab: TabName) => {
    setAppState({
      ...appState,
      currentScreen: 'recipe',
      recipe,
      activeTab: tab,
      isRecipeJustGenerated: false,
      allRecipes,
      currentRecipeIndex: index,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="rgb(22, 163, 74)" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    if (authMode === 'welcome') {
      return (
        <SafeAreaView style={styles.welcomeContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeHeader}>
              <View style={styles.logoSection}>
                <LogoComponent width={120} height={108} />
                <Text style={styles.welcomeTitle}>FridgeWise</Text>
                <Text style={styles.welcomeTagline}>Smart. Simple. Delicious.</Text>
              </View>
              <Text style={styles.welcomeSubtitle}>
                {t('home.subtitle')}
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
          
          <View style={styles.fixedBottomButtons}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => setAuthMode('register')}
            >
              <Text style={styles.primaryButtonText}>{t('auth.register')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setAuthMode('login')}
            >
              <Text style={styles.secondaryButtonText}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
          
          <StatusBar style="dark" />
        </SafeAreaView>
      );
    }
    
    if (authMode === 'login') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setAuthMode('welcome')}
              >
                <Text style={styles.backButtonText}>← {t('common.back')}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{t('auth.signIn')}</Text>
            </View>
            
            <View style={styles.authForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <TextInput
                  style={styles.input}
                  value={loginForm.email}
                  onChangeText={(text) => setLoginForm({ ...loginForm, email: text })}
                  placeholder={t('auth.email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <TextInput
                  style={styles.input}
                  value={loginForm.password}
                  onChangeText={(text) => setLoginForm({ ...loginForm, password: text })}
                  placeholder={t('auth.password')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>{t('auth.signIn')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setAuthMode('register')}
              >
                <Text style={styles.linkButtonText}>
                  Don't have an account? {t('auth.register')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <StatusBar style="dark" />
        </SafeAreaView>
      );
    }
    
    if (authMode === 'register') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setAuthMode('welcome')}
              >
                <Text style={styles.backButtonText}>← {t('common.back')}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{t('auth.register')}</Text>
            </View>
            
            <View style={styles.authForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.name')}</Text>
                <TextInput
                  style={styles.input}
                  value={registerForm.name}
                  onChangeText={(text) => setRegisterForm({ ...registerForm, name: text })}
                  placeholder={t('auth.name')}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <TextInput
                  style={styles.input}
                  value={registerForm.email}
                  onChangeText={(text) => setRegisterForm({ ...registerForm, email: text })}
                  placeholder={t('auth.email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <TextInput
                  style={styles.input}
                  value={registerForm.password}
                  onChangeText={(text) => setRegisterForm({ ...registerForm, password: text })}
                  placeholder={t('auth.password')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={registerForm.confirmPassword}
                  onChangeText={(text) => setRegisterForm({ ...registerForm, confirmPassword: text })}
                  placeholder={t('auth.confirmPassword')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
                <Text style={styles.primaryButtonText}>{t('auth.register')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setAuthMode('login')}
              >
                <Text style={styles.linkButtonText}>
                  Already have an account? {t('auth.login')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <StatusBar style="dark" />
        </SafeAreaView>
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
        isJustGenerated={appState.isRecipeJustGenerated}
        recipes={appState.allRecipes}
        currentIndex={appState.currentRecipeIndex}
        onNavigateToRecipe={handleNavigateToRecipe}
        onRecipeUpdate={async (updatedRecipe) => {
          console.log('🍕 App.tsx - Updating recipe...');
          console.log('🍕 App.tsx - Current recipe ingredients:', appState.recipe?.ingredients?.length || 0);
          console.log('🍕 App.tsx - New recipe ingredients:', updatedRecipe.ingredients?.length || 0);
          
          // Update state immediately for UI responsiveness
          setAppState({ ...appState, recipe: updatedRecipe });
          
          // Save to database
          if (updatedRecipe._id) {
            try {
              console.log('💾 Saving recipe to database...');
              
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
                cookingTime: updatedRecipe.cookingTime,
                servings: updatedRecipe.servings,
                difficulty: updatedRecipe.difficulty,
                dietaryTags: updatedRecipe.dietaryTags
              };
              
              console.log('💾 Request body:', JSON.stringify(requestBody, null, 2));
              
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000'}/api/recipe/${updatedRecipe._id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
              });
              
              if (response.ok) {
                console.log('🎉 Recipe saved successfully to database');
              } else {
                const errorText = await response.text();
                console.error('⚠️ Failed to save recipe to database:', response.status);
                console.error('⚠️ Error response:', errorText);
              }
            } catch (error) {
              console.error('⚠️ Error saving recipe:', error);
            }
          } else {
            console.log('📝 Recipe has no ID, skipping database save');
          }
        }}
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
            onSelectRecipe={(recipe, allRecipes, index) => handleSelectRecipeFromList(recipe, allRecipes, index, 'recipes')}
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
          />
        );
      
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
    <View style={styles.appContainer}>
      {renderMainContent()}
      <BottomNavigation
        activeTab={appState.activeTab}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  // App Container
  appContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  
  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgb(22, 163, 74)',
    fontWeight: '500',
    fontFamily: 'System',
  },

  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  welcomeTagline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgb(22, 163, 74)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  ingredientIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#FEF3F2',
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
    color: '#374151',
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
    color: '#6B7280',
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
    color: '#1F2937',
    fontFamily: 'System',
  },


  // Fixed Bottom Buttons
  fixedBottomButtons: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: 'rgb(22, 163, 74)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: 'rgb(22, 163, 74)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Auth Screens
  authContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    color: 'rgb(22, 163, 74)',
    fontWeight: '600',
    fontFamily: 'System',
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
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
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'System',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    fontFamily: 'System',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    color: 'rgb(22, 163, 74)',
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Home Screen (legacy)
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: 'System',
  },
  button: {
    backgroundColor: 'rgb(22, 163, 74)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: 'rgb(22, 163, 74)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
  },
});