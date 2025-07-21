import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Image,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

const LogoComponent: React.FC<{ width?: number; height?: number }> = ({ width = 60, height = 54 }) => (
  <Svg width={width} height={height} viewBox="0 0 267 241">
    <G>
      <G>
        <Path
          opacity="0.973"
          d="m206.03101,0c3.374,0.174 6.707,0.674 10,1.5c10.926,4.018 16.26,11.852 16,23.5c-0.794,11.216 -4.294,21.549 -10.5,31c-16.359,23.467 -35.193,44.967 -56.5,64.5c-42.519,37.697 -87.186,72.531 -134,104.5c-0.333,-0.5 -0.667,-1 -1,-1.5c33.982,-64.834 73.816,-125.668 119.5,-182.5c11.309,-12.65 23.809,-23.817 37.5,-33.5c6.009,-3.684 12.342,-6.184 19,-7.5z"
          fill="white"
        />
      </G>
      <G>
        <Path
          opacity="0.94"
          d="m68.03101,26c6.552,-0.474 10.385,2.526 11.5,9c0.748,8.853 -0.252,17.519 -3,26c-10.067,28.465 -23.067,55.465 -39,81c0.267,-28.554 3.933,-56.888 11,-85c2.516,-10.198 7.016,-19.364 13.5,-27.5c1.932,-1.459 3.932,-2.625 6,-3.5z"
          fill="white"
        />
      </G>
      <G>
        <Path
          opacity="0.906"
          d="m5.03101,102c3.472,-0.537 6.305,0.463 8.5,3c1.985,6.323 3.151,12.823 3.5,19.5c-1.074,16.687 -3.408,33.187 -7,49.5c-5.431,-18.081 -8.764,-36.581 -10,-55.5c-0.284,-6.217 1.382,-11.717 5,-16.5z"
          fill="white"
        />
      </G>
      <G>
        <Path
          opacity="0.956"
          d="m241.03101,143c6.891,-0.599 13.558,0.235 20,2.5c8.351,8.935 7.684,17.268 -2,25c-12.697,8.125 -26.364,14.125 -41,18c-34.818,9.247 -70.151,15.247 -106,18c32.85,-21.763 67.516,-40.429 104,-56c8.319,-2.99 16.652,-5.49 25,-7.5z"
          fill="white"
        />
      </G>
      <G>
        <Path
          opacity="0.911"
          d="m186.03101,225c6.009,-0.166 12.009,0.001 18,0.5c6.464,0.38 10.131,3.713 11,10c-1.409,2.879 -3.743,4.545 -7,5c-22.268,1.801 -44.268,-0.032 -66,-5.5c14.501,-4.628 29.168,-7.961 44,-10z"
          fill="white"
        />
      </G>
    </G>
  </Svg>
);

interface OnboardingScreenProps {
  onComplete: (preferences: {
    preferredLanguage: 'en' | 'it';
    dietaryRestrictions: string[];
  }) => void;
  onSkip?: () => void;
}

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

const CameraIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 13C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13C8 10.7909 9.79086 9 12 9C14.2091 9 16 10.7909 16 13Z"
      stroke="white"
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const AIIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 17L12 22L22 17"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 12L12 17L22 12"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RecipeIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ProfileIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={7} r={4} stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onSkip }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'it'>('en');
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([]);
  
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      
      // Swipe right (vai indietro) - dx positivo
      if (dx > 50 && currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
      // Swipe left (vai avanti) - dx negativo  
      else if (dx < -50 && currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
      // Se siamo all'ultimo step e swipe left, completa onboarding
      else if (dx < -50 && currentStep === steps.length - 1) {
        onComplete({
          preferredLanguage: selectedLanguage,
          dietaryRestrictions: selectedDietaryRestrictions
        });
      }
    },
  });



  // Initialize selected language when i18n is ready
  useEffect(() => {
    if (i18n && i18n.language) {
      setSelectedLanguage((i18n.language as 'en' | 'it') || 'en');
    }
  }, [i18n.language]);

  // Safe translation function
  const safeT = (key: string, fallback: string) => {
    try {
      if (!t || typeof t !== 'function') {
        return fallback;
      }
      const result = t(key);
      return typeof result === 'string' && result !== key ? result : fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Don't render if translation is not ready
  if (!t || typeof t !== 'function') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: safeT('onboarding.welcome.title', 'Never waste food again'),
      subtitle: safeT('onboarding.welcome.subtitle', 'Turn what you have into what you love'),
      description: safeT('onboarding.welcome.description', 'FridgeWise helps you cook delicious meals with ingredients you already have at home.'),
      icon: <CameraIcon />
    },
    {
      id: 1,
      title: safeT('onboarding.scan.title', 'Snap a photo, get recipes'),
      subtitle: safeT('onboarding.scan.subtitle', 'AI-powered ingredient recognition'),
      description: safeT('onboarding.scan.description', 'Take a photo of your ingredients and let AI do the heavy lifting. No typing, no lists.'),
      icon: <CameraIcon />
    },
    {
      id: 2,
      title: safeT('onboarding.ai.title', 'Smart suggestions that work'),
      subtitle: safeT('onboarding.ai.subtitle', 'Recipes based on what you actually have'),
      description: safeT('onboarding.ai.description', 'Get personalized recipes that match your ingredients, time, and cooking skills.'),
      icon: <AIIcon />
    },
    {
      id: 3,
      title: safeT('onboarding.recipes.title', 'Cook with confidence'),
      subtitle: safeT('onboarding.recipes.subtitle', 'Step-by-step guidance'),
      description: safeT('onboarding.recipes.description', 'Clear instructions, cooking tips, and smart timers help you create amazing meals every time.'),
      icon: <RecipeIcon />
    },
    {
      id: 4,
      title: safeT('onboarding.language.title', 'Choose Your Language'),
      subtitle: safeT('onboarding.language.subtitle', 'Cook in your preferred language'),
      description: safeT('onboarding.language.description', 'Select your language for the best cooking experience.'),
      icon: <ProfileIcon />
    },
    {
      id: 5,
      title: safeT('onboarding.dietary.title', 'Your Dietary Preferences'),
      subtitle: safeT('onboarding.dietary.subtitle', 'Personalized just for you'),
      description: safeT('onboarding.dietary.description', 'Let us know about any dietary restrictions so we can suggest the right recipes.'),
      icon: <ProfileIcon />
    }
  ];

  const dietaryOptions = [
    { key: 'vegetarian', label: safeT('profile.dietary.vegetarian', 'Vegetarian'), emoji: '🥬' },
    { key: 'vegan', label: safeT('profile.dietary.vegan', 'Vegan'), emoji: '🌱' },
    { key: 'gluten-free', label: safeT('profile.dietary.gluten-free', 'Gluten-free'), emoji: '🌾' },
    { key: 'dairy-free', label: safeT('profile.dietary.dairy-free', 'Dairy-free'), emoji: '🥛' },
    { key: 'nut-free', label: safeT('profile.dietary.nut-free', 'Nut-free'), emoji: '🥜' },
    { key: 'soy-free', label: safeT('profile.dietary.soy-free', 'Soy-free'), emoji: '🫘' },
    { key: 'egg-free', label: safeT('profile.dietary.egg-free', 'Egg-free'), emoji: '🥚' },
    { key: 'low-carb', label: safeT('profile.dietary.low-carb', 'Low-carb'), emoji: '🥩' },
    { key: 'keto', label: safeT('profile.dietary.keto', 'Keto'), emoji: '🧈' },
    { key: 'paleo', label: safeT('profile.dietary.paleo', 'Paleo'), emoji: '🦴' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        preferredLanguage: selectedLanguage,
        dietaryRestrictions: selectedDietaryRestrictions
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLanguageSelect = (language: 'en' | 'it') => {
    setSelectedLanguage(language);

    // Safely change language
    try {
      if (i18n && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(language);
      }
    } catch (error) {
      console.warn('Failed to change language:', error);
    }
  };

  const handleDietaryToggle = (restriction: string) => {
    setSelectedDietaryRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };


  const currentStepData = steps[currentStep];
  const isLanguageStep = currentStep === 4;
  const isDietaryStep = currentStep === 5;
  const isLastStep = currentStep === steps.length - 1;

  // Determine if next button should be disabled
  const isNextDisabled = false;

  // Safety check for currentStepData
  if (!currentStepData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>Loading step...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive
              ]}
            />
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={styles.headerButtons}>
          {currentStep > 0 && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setCurrentStep(currentStep - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.headerButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {onSkip && currentStep === 0 && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>
                {safeT('common.skip', 'Skip')}
              </Text>
            </TouchableOpacity>
          )}
          
          {(currentStep < steps.length - 1 || currentStep === steps.length - 1) && (
            <TouchableOpacity 
              style={[
                styles.headerButton,
                currentStep === steps.length - 1 && styles.completeHeaderButton
              ]}
              onPress={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  onComplete({
                    preferredLanguage: selectedLanguage,
                    dietaryRestrictions: selectedDietaryRestrictions
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.headerButtonText,
                currentStep === steps.length - 1 && styles.completeHeaderButtonText
              ]}>
                {currentStep === steps.length - 1 ? 'Start' : 'Next'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Unique layout for each step */}
          {currentStep === 0 && (
            <View style={styles.heroLayout}>
              <View style={styles.heroContent}>
                <View style={styles.logoContainer}>
                  <LogoComponent width={50} height={45} />
                </View>
                <Text style={styles.heroTitle}>Your kitchen. Unlimited recipes.</Text>
                <Text style={styles.heroSubtitle}>AI turns any ingredients into amazing meals</Text>
                
                <View style={styles.ingredientGrid}>
                  <View style={styles.ingredientCircle}>
                    <Text style={styles.bigEmoji}>🍅</Text>
                  </View>
                  <View style={styles.ingredientCircle}>
                    <Text style={styles.bigEmoji}>🧄</Text>
                  </View>
                  <View style={styles.ingredientCircle}>
                    <Text style={styles.bigEmoji}>🌿</Text>
                  </View>
                  <View style={styles.ingredientCircle}>
                    <Text style={styles.bigEmoji}>🧀</Text>
                  </View>
                </View>
                
                <Text style={styles.magicText}>✨ = 200+ recipe possibilities</Text>
                
                <View style={styles.quickStats}>
                  <View style={styles.statBubble}>
                    <Text style={styles.statEmoji}>⚡</Text>
                    <Text style={styles.statText}>Instant recipes</Text>
                  </View>
                  <View style={styles.statBubble}>
                    <Text style={styles.statEmoji}>🎯</Text>
                    <Text style={styles.statText}>Zero waste</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {currentStep === 1 && (
            <View style={styles.scanLayout}>
              <Text style={styles.scanTitle}>Just point and shoot</Text>
              <View style={styles.phoneDemo}>
                <View style={styles.phoneScreen}>
                  <View style={styles.cameraViewfinder}>
                    <Image 
                      source={require('../../assets/fridge.png')} 
                      style={styles.fridgeImage}
                      resizeMode="cover"
                    />
                    <View style={styles.scanningLine}></View>
                    <Text style={styles.viewfinderText}>Scanning...</Text>
                  </View>
                </View>
                <View style={styles.scanResults}>
                  <Text style={styles.foundText}>Found:</Text>
                  <Text style={styles.ingredientFound}>🍅 Tomatoes</Text>
                  <Text style={styles.ingredientFound}>🧄 Garlic</Text>
                  <Text style={styles.ingredientFound}>🌿 Basil</Text>
                </View>
              </View>
              <Text style={styles.scanDescription}>AI recognizes ingredients instantly</Text>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.gameLayout}>
              <Text style={styles.gameTitle}>Recipe roulette!</Text>
              <Text style={styles.gameSubtitle}>Same ingredients, endless possibilities</Text>
              
              <View style={styles.rouletteDemo}>
                <View style={styles.fixedIngredients}>
                  <View style={styles.smallChip}>
                    <Text style={styles.chipText}>🍅</Text>
                  </View>
                  <View style={styles.smallChip}>
                    <Text style={styles.chipText}>🧄</Text>
                  </View>
                  <View style={styles.smallChip}>
                    <Text style={styles.chipText}>🌿</Text>
                  </View>
                </View>
                
                <Text style={styles.plusSign}>+</Text>
                
                <View style={styles.rouletteWheel}>
                  <Text style={styles.wheelEmoji}>🍝</Text>
                  <Text style={styles.recipeTypeText}>Italian</Text>
                </View>
                
                <Text style={styles.equalsSign}>=</Text>
                
                <View style={styles.resultCard}>
                  <Text style={styles.resultEmoji}>🍝</Text>
                  <Text style={styles.resultName}>Spaghetti Aglio</Text>
                  <Text style={styles.resultTime}>15 min</Text>
                </View>
              </View>
              
              <View style={styles.alternativeResults}>
                <Text style={styles.alternativesLabel}>Or try:</Text>
                <View style={styles.miniCards}>
                  <View style={styles.miniCard}>
                    <Text style={styles.miniEmoji}>🥗</Text>
                    <Text style={styles.miniName}>Bruschetta</Text>
                  </View>
                  <View style={styles.miniCard}>
                    <Text style={styles.miniEmoji}>🍕</Text>
                    <Text style={styles.miniName}>Margherita</Text>
                  </View>
                  <View style={styles.miniCard}>
                    <Text style={styles.miniEmoji}>🍲</Text>
                    <Text style={styles.miniName}>Soup</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.confidenceLayout}>
              <Text style={styles.confidenceTitle}>Cook like a pro</Text>
              <Text style={styles.confidenceSubtitle}>Smart guidance every step of the way</Text>
              
              <View style={styles.cookingDemo}>
                <View style={styles.chefAvatar}>
                  <Text style={styles.chefEmoji}>👩‍🍳</Text>
                  <View style={styles.speechBubble}>
                    <Text style={styles.bubbleText}>Add garlic when oil sizzles!</Text>
                  </View>
                </View>
                
                <View style={styles.cookingScene}>
                  <View style={styles.panContainer}>
                    <Text style={styles.panEmoji}>🍳</Text>
                    <View style={styles.heatIndicator}>
                      <Text style={styles.flameEmoji}>🔥</Text>
                      <Text style={styles.heatText}>Medium heat</Text>
                    </View>
                  </View>
                  
                  <View style={styles.smartFeatures}>
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>⏱️</Text>
                      <Text style={styles.featureText}>Smart timers</Text>
                    </View>
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>🔔</Text>
                      <Text style={styles.featureText}>Audio cues</Text>
                    </View>
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>💡</Text>
                      <Text style={styles.featureText}>Pro tips</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.successRate}>
                <Text style={styles.successText}>98% success rate with our guidance</Text>
                <View style={styles.stars}>
                  <Text style={styles.starText}>⭐⭐⭐⭐⭐</Text>
                </View>
              </View>
            </View>
          )}

          {/* Language Selection */}
          {isLanguageStep && (
            <View style={styles.selectionContainer}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'en' && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect('en')}
              >
                <Text style={styles.languageFlag}>🇺🇸</Text>
                <View style={styles.languageTextContainer}>
                  <Text style={styles.languageTitle}>English</Text>
                  <Text style={styles.languageSubtitle}>English</Text>
                </View>
                {selectedLanguage === 'en' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'it' && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect('it')}
              >
                <Text style={styles.languageFlag}>🇮🇹</Text>
                <View style={styles.languageTextContainer}>
                  <Text style={styles.languageTitle}>Italiano</Text>
                  <Text style={styles.languageSubtitle}>Italian</Text>
                </View>
                {selectedLanguage === 'it' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Dietary Restrictions Selection */}
          {isDietaryStep && (
            <View style={styles.selectionContainer}>
              <View style={styles.dietaryGrid}>
                {dietaryOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dietaryOption,
                      selectedDietaryRestrictions.includes(option.key) && styles.dietaryOptionSelected
                    ]}
                    onPress={() => handleDietaryToggle(option.key)}
                  >
                    <Text style={styles.dietaryEmoji}>{option.emoji}</Text>
                    <Text style={styles.dietaryLabel}>{option.label}</Text>
                    {selectedDietaryRestrictions.includes(option.key) && (
                      <View style={styles.dietaryCheckmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.selectionHint}>
                {safeT('onboarding.dietary.hint', 'You can select multiple options or skip this step')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>


    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    position: 'relative',
  },
  
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  
  headerButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  
  completeHeaderButton: {
    backgroundColor: colors.primary,
  },
  
  completeHeaderButtonText: {
    color: 'white',
  },
  
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  selectionContainer: {
    alignItems: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: width - 40,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  languageOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  languageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dietaryOption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: (width - 80) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  dietaryOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  dietaryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  dietaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  dietaryCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 20,
    paddingTop: 12,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: colors.textSecondary,
  },
  nextButtonText: {
    color: 'white',
  },
  navButtonTextDisabled: {
    color: colors.border,
  },
  
  // Step 0: Hero Layout - Redesigned
  heroLayout: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  
  heroContent: {
    alignItems: 'center',
  },
  
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  
  heroSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  
  ingredientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 25,
  },
  
  ingredientCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  
  bigEmoji: {
    fontSize: 32,
  },
  
  magicText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  
  quickStats: {
    flexDirection: 'row',
    gap: 20,
  },
  
  statBubble: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
  },
  
  statEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Step 1: Scan Layout
  scanLayout: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  scanTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 40,
  },
  
  phoneDemo: {
    alignItems: 'center',
    gap: 30,
  },
  
  phoneScreen: {
    width: 200,
    height: 300,
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 15,
    elevation: 8,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  
  cameraViewfinder: {
    flex: 1,
    backgroundColor: '#00000010',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  
  fridgeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  
  scanningLine: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.primary,
  },
  
  viewfinderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  scanResults: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    gap: 8,
  },
  
  foundText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  
  ingredientFound: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
  },
  
  scanDescription: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  
  // Step 2: AI Layout
  aiLayout: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  
  aiTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  
  matchingDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  ingredientsColumn: {
    flex: 1,
    alignItems: 'center',
  },
  
  recipesColumn: {
    flex: 1,
    alignItems: 'center',
  },
  
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  
  ingredientChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    elevation: 2,
  },
  
  ingredientChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  
  aiMagic: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  
  aiIcon: {
    fontSize: 40,
    marginBottom: 5,
  },
  
  aiText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  
  sparkles: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 5,
  },
  
  sparkle: {
    fontSize: 12,
    color: colors.primary,
  },
  
  recipeMatch: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    minWidth: 100,
  },
  
  recipeIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  
  recipeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 3,
  },
  
  matchScore: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
  
  // Step 3: Cooking Layout
  cookingLayout: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  
  cookingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  
  cookingGuide: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 25,
    elevation: 6,
  },
  
  stepProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 25,
  },
  
  progressStep: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  completed: {
    backgroundColor: colors.primary,
  },
  
  active: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primary + '50',
  },
  
  stepNumber: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  
  currentStep: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  stepInstruction: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
    lineHeight: 24,
  },
  
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  
  timerIcon: {
    fontSize: 18,
  },
  
  timerText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  
  cookingTips: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  
  tipLabel: {
    fontSize: 16,
  },
  
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  
  // Step 2: Game Layout (Recipe Roulette)
  gameLayout: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  gameTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  gameSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  
  rouletteDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 40,
  },
  
  fixedIngredients: {
    flexDirection: 'row',
    gap: 8,
  },
  
  smallChip: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  chipText: {
    fontSize: 20,
  },
  
  plusSign: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  
  rouletteWheel: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  
  wheelEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  
  recipeTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
  
  equalsSign: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    minWidth: 100,
  },
  
  resultEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  
  resultName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  
  resultTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  alternativeResults: {
    alignItems: 'center',
  },
  
  alternativesLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 15,
    fontWeight: '600',
  },
  
  miniCards: {
    flexDirection: 'row',
    gap: 12,
  },
  
  miniCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minWidth: 70,
  },
  
  miniEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  
  miniName: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Step 3: Confidence Layout (Cook Like a Pro)
  confidenceLayout: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  confidenceTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  confidenceSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  
  cookingDemo: {
    alignItems: 'center',
    gap: 30,
    marginBottom: 40,
  },
  
  chefAvatar: {
    alignItems: 'center',
    position: 'relative',
  },
  
  chefEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  
  speechBubble: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    elevation: 3,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxWidth: 200,
  },
  
  bubbleText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  cookingScene: {
    alignItems: 'center',
    gap: 20,
  },
  
  panContainer: {
    alignItems: 'center',
  },
  
  panEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  
  heatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  
  flameEmoji: {
    fontSize: 16,
  },
  
  heatText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  
  smartFeatures: {
    flexDirection: 'row',
    gap: 15,
  },
  
  feature: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    minWidth: 70,
  },
  
  featureIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  
  featureText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  successRate: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 2,
  },
  
  successText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '700',
    marginBottom: 8,
  },
  
  stars: {
    alignItems: 'center',
  },
  
  starText: {
    fontSize: 18,
  },
});