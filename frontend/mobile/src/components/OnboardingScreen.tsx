import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Image,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path, Circle, G, LinearGradient, Stop, Defs } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

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
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onSkip }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'it'>('en');
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([]);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Slide entry animations
  const slideInAnim = useRef(new Animated.Value(width)).current;
  const scaleInAnim = useRef(new Animated.Value(0.8)).current;
  const bounceInAnim = useRef(new Animated.Value(0)).current;
  
  const swipePanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      
      if (dx > 50 && currentStep > 0) {
        handlePrevious();
      } else if (dx < -50 && currentStep < steps.length - 1) {
        handleNext();
      } else if (dx < -50 && currentStep === steps.length - 1) {
        onComplete({
          preferredLanguage: selectedLanguage,
          dietaryRestrictions: selectedDietaryRestrictions
        });
      }
    },
  });

  // Initialize animations
  useEffect(() => {
    // Continuous floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Step change animations
  useEffect(() => {
    // Reset animations for new step
    slideInAnim.setValue(width);
    scaleInAnim.setValue(0.8);
    bounceInAnim.setValue(0);
    fadeAnim.setValue(0);

    // Different entrance animation per step
    const getEntranceAnimation = () => {
      switch (currentStep) {
        case 0:
          // Welcome: Scale + fade in
          return Animated.parallel([
            Animated.timing(scaleInAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.out(Easing.back(1.1)),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]);
        
        case 1:
          // Camera: Slide in from right
          return Animated.parallel([
            Animated.timing(slideInAnim, {
              toValue: 0,
              duration: 700,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]);
        
        case 2:
          // AI: Bounce in
          return Animated.parallel([
            Animated.spring(bounceInAnim, {
              toValue: 1,
              tension: 100,
              friction: 6,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]);
        
        case 3:
          // Cooking: Slide up + fade
          return Animated.parallel([
            Animated.timing(slideInAnim, {
              toValue: 0,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]);
        
        case 4:
          // Dietary: Scale in from small
          return Animated.parallel([
            Animated.spring(scaleInAnim, {
              toValue: 1,
              tension: 80,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]);
        
        default:
          return Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          });
      }
    };

    getEntranceAnimation().start();

    // Start specific animations per step
    if (currentStep === 1) {
      // Scanning animation
      setTimeout(() => {
        Animated.loop(
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: false,
          })
        ).start();
      }, 700);
    } else if (currentStep === 2) {
      // Rotation animation for AI step
      setTimeout(() => {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 8000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      }, 500);
    }
  }, [currentStep]);

  useEffect(() => {
    if (i18n && i18n.language) {
      setSelectedLanguage((i18n.language as 'en' | 'it') || 'en');
    }
  }, [i18n.language]);

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

  if (!t || typeof t !== 'function') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{safeT('onboarding.ui.loading', 'Loading...')}</Text>
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
    },
    {
      id: 1,
      title: safeT('onboarding.scan.title', 'Snap a photo, get recipes'),
      subtitle: safeT('onboarding.scan.subtitle', 'AI-powered ingredient recognition'),
      description: safeT('onboarding.scan.description', 'Take a photo of your ingredients and let AI do the heavy lifting. No typing, no lists.'),
    },
    {
      id: 2,
      title: safeT('onboarding.ai.title', 'Smart suggestions that work'),
      subtitle: safeT('onboarding.ai.subtitle', 'Recipes based on what you actually have'),
      description: safeT('onboarding.ai.description', 'Get personalized recipes that match your ingredients, time, and cooking skills.'),
    },
    {
      id: 3,
      title: safeT('onboarding.recipes.title', 'Cook with confidence'),
      subtitle: safeT('onboarding.recipes.subtitle', 'Step-by-step guidance'),
      description: safeT('onboarding.recipes.description', 'Clear instructions, cooking tips, and smart timers help you create amazing meals every time.'),
    },
    {
      id: 4,
      title: safeT('onboarding.dietary.title', 'Your Dietary Preferences'),
      subtitle: safeT('onboarding.dietary.subtitle', 'Personalized just for you'),
      description: safeT('onboarding.dietary.description', 'Let us know about any dietary restrictions so we can suggest the right recipes.'),
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


  const handleDietaryToggle = (restriction: string) => {
    setSelectedDietaryRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const currentStepData = steps[currentStep];
  const isDietaryStep = currentStep === 4;

  return (
    <SafeAreaView style={styles.container} {...swipePanResponder.panHandlers}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              { 
                width: `${((currentStep + 1) / steps.length) * 100}%`
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {steps.length}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.headerButton, currentStep === 0 && styles.headerButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <Text style={[styles.headerButtonText, currentStep === 0 && styles.headerButtonTextDisabled]}>
            ← {safeT('common.back', 'Back')}
          </Text>
        </TouchableOpacity>

        {onSkip && currentStep === 0 && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>
              {safeT('common.skip', 'Skip')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.headerButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? `${safeT('common.start', 'Start')} →` : `${safeT('common.next', 'Next')} →`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 0: Welcome Hero */}
          {currentStep === 0 && (
            <Animated.View 
              style={[
                styles.heroContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleInAnim }]
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.logoWrapper,
                  { 
                    transform: [
                      { 
                        translateY: floatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -20]
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.logoBackground}>
                  <LogoComponent width={80} height={72} />
                </View>
              </Animated.View>

              <Text style={styles.heroTitle}>{currentStepData.title}</Text>
              <Text style={styles.heroSubtitle}>{currentStepData.subtitle}</Text>

              <Animated.View 
                style={[
                  styles.ingredientsShowcase,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View style={styles.ingredientRow}>
                  <View style={styles.ingredientBubble}>
                    <Text style={styles.ingredientEmoji}>🍅</Text>
                  </View>
                  <View style={styles.ingredientBubble}>
                    <Text style={styles.ingredientEmoji}>🥕</Text>
                  </View>
                  <View style={styles.ingredientBubble}>
                    <Text style={styles.ingredientEmoji}>🧄</Text>
                  </View>
                </View>
                <Text style={styles.magicArrow}>↓</Text>
                <Text style={styles.magicText}>✨ 100+ {safeT('onboarding.ui.recipeIdeas', 'recipe ideas')}</Text>
              </Animated.View>

              <Text style={styles.heroDescription}>{currentStepData.description}</Text>
            </Animated.View>
          )}

          {/* Step 1: Camera Scan */}
          {currentStep === 1 && (
            <Animated.View 
              style={[
                styles.scanContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideInAnim }]
                }
              ]}
            >
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>

              <View style={styles.phoneFrameContainer}>
                <View style={styles.phoneFrame}>
                  {/* Dynamic Island */}
                  <View style={styles.dynamicIsland} />
                  
                  <View style={styles.phoneScreen}>
                    <Image 
                      source={require('../../assets/fridge.png')} 
                      style={styles.cameraPreview}
                      resizeMode="cover"
                    />
                    
                    {/* Animated Scanning Line */}
                    <Animated.View 
                      style={[
                        styles.scanLine,
                        {
                          transform: [{
                            translateY: scanAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 320]
                            })
                          }]
                        }
                      ]}
                    />
                    
                    {/* Scan Points - Ingredienti rilevati - Posizioni realistiche */}
                    {/* Latte - Posizione tipica: porta del frigo, ripiano alto */}
                    <Animated.View 
                      style={[
                        styles.scanPoint, 
                        { top: '48%', right: '12%' },
                        {
                          transform: [
                            { scale: pulseAnim.interpolate({
                              inputRange: [1, 1.1],
                              outputRange: [1, 1.05]
                            }) }
                          ]
                        }
                      ]}
                    >
                      <View style={styles.scanDot} />
                      <Text style={styles.scanLabel}>{safeT('onboarding.ingredients.milk', 'Latte')}</Text>
                    </Animated.View>
                    
                    {/* Formaggio - Posizione tipica: ripiano centrale del frigo, ora più in basso e leggermente a sinistra */}
                    <Animated.View 
                      style={[
                        styles.scanPoint, 
                        { top: '48%', left: '18%' },
                        {
                          transform: [
                            { scale: pulseAnim.interpolate({
                              inputRange: [1, 1.1],
                              outputRange: [1, 1.1]
                            }) }
                          ]
                        }
                      ]}
                    >
                      <View style={styles.scanDot} />
                      <Text style={styles.scanLabel}>{safeT('onboarding.ingredients.cheese', 'Formaggio')}</Text>
                    </Animated.View>
                    
                    {/* Uova - Ora in alto a destra (ex latte) */}
                    <Animated.View 
                      style={[
                        styles.scanPoint, 
                        { top: '25%', right: '8%' },
                        {
                          transform: [
                            { scale: pulseAnim.interpolate({
                              inputRange: [1, 1.1],
                              outputRange: [1, 1.2]
                            }) }
                          ]
                        }
                      ]}
                    >
                      <View style={styles.scanDot} />
                      <Text style={styles.scanLabel}>{safeT('onboarding.ingredients.eggs', 'Uova')}</Text>
                    </Animated.View>
                    
                    {/* Pomodori - Posizione tipica: ripiano alto a sinistra del frigo, ora leggermente più in basso */}
                    <Animated.View 
                      style={[
                        styles.scanPoint, 
                        { top: '23%', left: '7%' },
                        {
                          transform: [
                            { scale: pulseAnim.interpolate({
                              inputRange: [1, 1.1],
                              outputRange: [1, 1.15]
                            }) }
                          ]
                        }
                      ]}
                    >
                      <View style={styles.scanDot} />
                      <Text style={styles.scanLabel}>{safeT('onboarding.ingredients.tomato', 'Pomodori')}</Text>
                    </Animated.View>
                    
                    {/* Basilico - Più in basso */}
                    <Animated.View 
                      style={[
                        styles.scanPoint, 
                        { bottom: '18%', left: '30%' },
                        {
                          transform: [
                            { scale: pulseAnim.interpolate({
                              inputRange: [1, 1.1],
                              outputRange: [1, 1.12]
                            }) }
                          ]
                        }
                      ]}
                    >
                      <View style={styles.scanDot} />
                      <Text style={styles.scanLabel}>{safeT('onboarding.ingredients.basil', 'Basilico')}</Text>
                    </Animated.View>
                  </View>
                  
                  {/* iPhone Home Indicator */}
                  <View style={styles.homeIndicator} />
                </View>
              </View>

              <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            </Animated.View>
          )}

          {/* Step 2: AI Suggestions */}
          {currentStep === 2 && (
            <Animated.View 
              style={[
                styles.aiContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: bounceInAnim }]
                }
              ]}
            >
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>

              <View style={styles.aiFlowContainer}>
                <View style={styles.ingredientsInput}>
                  <View style={styles.ingredientChip}>
                    <Text style={styles.chipEmoji}>🍅</Text>
                    <Text style={styles.chipText}>{safeT('onboarding.ingredients.tomato', 'Tomato')}</Text>
                  </View>
                  <View style={styles.ingredientChip}>
                    <Text style={styles.chipEmoji}>🧄</Text>
                    <Text style={styles.chipText}>{safeT('onboarding.ingredients.garlic', 'Garlic')}</Text>
                  </View>
                  <View style={styles.ingredientChip}>
                    <Text style={styles.chipEmoji}>🌿</Text>
                    <Text style={styles.chipText}>{safeT('onboarding.ingredients.basil', 'Basil')}</Text>
                  </View>
                </View>

                <Animated.View 
                  style={[
                    styles.aiProcessor,
                    {
                      transform: [{
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.aiIcon}>🤖</Text>
                  <Text style={styles.aiText}>{safeT('onboarding.ui.ai', 'AI')}</Text>
                </Animated.View>

                <View style={styles.recipeSuggestions}>
                  <View style={styles.recipeCard}>
                    <Text style={styles.recipeEmoji}>🍝</Text>
                    <Text style={styles.recipeName}>{safeT('onboarding.demoRecipes.pastaArrabbiata', 'Pasta Arrabbiata')}</Text>
                    <Text style={styles.recipeTime}>15 {safeT('onboarding.ui.minutes', 'min')}</Text>
                  </View>
                  <View style={styles.recipeCard}>
                    <Text style={styles.recipeEmoji}>🍕</Text>
                    <Text style={styles.recipeName}>{safeT('onboarding.demoRecipes.margheritaPizza', 'Margherita Pizza')}</Text>
                    <Text style={styles.recipeTime}>25 {safeT('onboarding.ui.minutes', 'min')}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            </Animated.View>
          )}

          {/* Step 3: Cooking Guidance */}
          {currentStep === 3 && (
            <Animated.View 
              style={[
                styles.cookingContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideInAnim.interpolate({
                    inputRange: [0, width],
                    outputRange: [0, 50]
                  }) }]
                }
              ]}
            >
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>

              <View style={styles.cookingDemo}>
                <View style={styles.recipeSteps}>
                  <View style={[styles.stepItem, styles.stepActive]}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>{safeT('onboarding.cooking.steps.heatOil', 'Heat olive oil in a pan')}</Text>
                  </View>
                  
                  <View style={[styles.stepItem, styles.stepNext]}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>{safeT('onboarding.cooking.steps.addGarlic', 'Add minced garlic')}</Text>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>{safeT('onboarding.cooking.steps.addTomatoes', 'Add crushed tomatoes')}</Text>
                  </View>
                </View>

                <View style={styles.cookingVisual}>
                  <View style={styles.panIcon}>
                    <Text style={styles.panEmoji}>🍳</Text>
                  </View>
                  <View style={styles.timerBadge}>
                    <Text style={styles.timerIcon}>⏱️</Text>
                    <Text style={styles.timerText}>2:45</Text>
                  </View>
                </View>

                <View style={styles.cookingTips}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>{safeT('onboarding.cooking.tip', 'Tip: Keep heat at medium to avoid burning the garlic')}</Text>
                </View>
              </View>

              <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            </Animated.View>
          )}

          {/* Step 4: Dietary Preferences */}
          {isDietaryStep && (
            <Animated.View 
              style={[
                styles.selectionContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleInAnim }]
                }
              ]}
            >
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>

              <View style={styles.dietaryGrid}>
                {dietaryOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dietaryCard,
                      selectedDietaryRestrictions.includes(option.key) && styles.dietaryCardSelected
                    ]}
                    onPress={() => handleDietaryToggle(option.key)}
                  >
                    <Text style={styles.dietaryEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.dietaryLabel,
                      selectedDietaryRestrictions.includes(option.key) && styles.dietaryLabelSelected
                    ]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.selectionHint}>
                {safeT('onboarding.dietary.hint', 'You can select multiple options or skip this step')}
              </Text>
            </Animated.View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  
  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  headerButtonTextDisabled: {
    color: colors.textSecondary,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Step 0: Hero
  heroContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoWrapper: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  ingredientsShowcase: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  ingredientBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ingredientEmoji: {
    fontSize: 36,
  },
  magicArrow: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  magicText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Step 1: Scan
  scanContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  stepSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  phoneFrameContainer: {
    marginBottom: 40,
  },
  phoneFrame: {
    width: 220,
    height: 380,
    backgroundColor: '#1a1a1a', // Titanium Black come iPhone 16 Pro
    borderRadius: 32, // Bordi più arrotondati come iPhone moderni
    padding: 6,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 26, // Arrotondato per seguire la cornice
    overflow: 'hidden',
    position: 'relative',
  },
  // iPhone 16 Pro Dynamic Island
  dynamicIsland: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -37, // Half of width (74/2)
    width: 74,
    height: 20,
    backgroundColor: '#000',
    borderRadius: 12,
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 6,
  },
  // iPhone Home Indicator (bottom bar)
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -40, // Half of width (80/2)
    width: 80,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    zIndex: 20,
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  scanPoint: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  scanDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    marginBottom: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  scanLabel: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 60,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Step 2: AI
  aiContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  aiFlowContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ingredientsInput: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  aiProcessor: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiIcon: {
    fontSize: 32,
  },
  aiText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
    marginTop: 4,
  },
  recipeSuggestions: {
    flexDirection: 'row',
    gap: 16,
  },
  recipeCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  recipeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  recipeTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Step 3: Cooking
  cookingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  cookingDemo: {
    width: '100%',
    marginBottom: 40,
  },
  recipeSteps: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepActive: {
    opacity: 1,
  },
  stepNext: {
    opacity: 0.7,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  cookingVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  panIcon: {
    alignItems: 'center',
  },
  panEmoji: {
    fontSize: 48,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  timerIcon: {
    fontSize: 16,
  },
  timerText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '700',
  },
  cookingTips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    lineHeight: 20,
  },

  // Selection Steps (Dietary)
  selectionContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },

  // Dietary Grid
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  dietaryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    width: (width - 60) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  dietaryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dietaryEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  dietaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  dietaryLabelSelected: {
    color: 'white',
  },
  selectionHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});