import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: (preferences: {
    preferredLanguage: 'en' | 'it';
    dietaryRestrictions: string[];
  }) => void;
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
    <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx={12} cy={7} r={4} stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'it'>('en');
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([]);
  
  const stepOpacity = useSharedValue(1);
  const slideX = useSharedValue(0);

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: t('onboarding.welcome.title') || 'Welcome to FridgeWise',
      subtitle: t('onboarding.welcome.subtitle') || 'Your AI-powered cooking assistant',
      description: t('onboarding.welcome.description') || 'Transform your ingredients into delicious recipes with artificial intelligence',
      icon: <CameraIcon />
    },
    {
      id: 1,
      title: t('onboarding.scan.title') || 'Scan Your Fridge',
      subtitle: t('onboarding.scan.subtitle') || 'AI-powered ingredient detection',
      description: t('onboarding.scan.description') || 'Just take a photo of your fridge contents and let our AI identify all your ingredients automatically',
      icon: <CameraIcon />
    },
    {
      id: 2,
      title: t('onboarding.ai.title') || 'Smart Recognition',
      subtitle: t('onboarding.ai.subtitle') || 'Advanced machine learning',
      description: t('onboarding.ai.description') || 'Our AI accurately recognizes hundreds of ingredients and suggests the best recipes based on what you have',
      icon: <AIIcon />
    },
    {
      id: 3,
      title: t('onboarding.recipes.title') || 'Personalized Recipes',
      subtitle: t('onboarding.recipes.subtitle') || 'Tailored to your taste',
      description: t('onboarding.recipes.description') || 'Get recipe suggestions that match your dietary preferences and cooking skill level',
      icon: <RecipeIcon />
    },
    {
      id: 4,
      title: t('onboarding.language.title') || 'Choose Your Language',
      subtitle: t('onboarding.language.subtitle') || 'Select your preferred language',
      description: t('onboarding.language.description') || 'FridgeWise supports multiple languages for the best experience',
      icon: <ProfileIcon />
    },
    {
      id: 5,
      title: t('onboarding.dietary.title') || 'Dietary Preferences',
      subtitle: t('onboarding.dietary.subtitle') || 'Tell us about your diet',
      description: t('onboarding.dietary.description') || 'Select your dietary restrictions to get personalized recipe recommendations',
      icon: <ProfileIcon />
    }
  ];

  const dietaryOptions = [
    { key: 'vegetarian', label: t('profile.dietary.vegetarian') || 'Vegetarian', emoji: '🥬' },
    { key: 'vegan', label: t('profile.dietary.vegan') || 'Vegan', emoji: '🌱' },
    { key: 'gluten-free', label: t('profile.dietary.gluten-free') || 'Gluten-free', emoji: '🌾' },
    { key: 'dairy-free', label: t('profile.dietary.dairy-free') || 'Dairy-free', emoji: '🥛' },
    { key: 'nut-free', label: t('profile.dietary.nut-free') || 'Nut-free', emoji: '🥜' },
    { key: 'soy-free', label: t('profile.dietary.soy-free') || 'Soy-free', emoji: '🫘' },
    { key: 'egg-free', label: t('profile.dietary.egg-free') || 'Egg-free', emoji: '🥚' },
    { key: 'low-carb', label: t('profile.dietary.low-carb') || 'Low-carb', emoji: '🥩' },
    { key: 'keto', label: t('profile.dietary.keto') || 'Keto', emoji: '🧈' },
    { key: 'paleo', label: t('profile.dietary.paleo') || 'Paleo', emoji: '🦴' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      stepOpacity.value = withTiming(0, { duration: 200 }, () => {
        slideX.value = withTiming(-50, { duration: 0 }, () => {
          setCurrentStep(currentStep + 1);
          slideX.value = withTiming(0, { duration: 300 });
          stepOpacity.value = withTiming(1, { duration: 300 });
        });
      });
    } else {
      onComplete({
        preferredLanguage: selectedLanguage,
        dietaryRestrictions: selectedDietaryRestrictions
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      stepOpacity.value = withTiming(0, { duration: 200 }, () => {
        slideX.value = withTiming(50, { duration: 0 }, () => {
          setCurrentStep(currentStep - 1);
          slideX.value = withTiming(0, { duration: 300 });
          stepOpacity.value = withTiming(1, { duration: 300 });
        });
      });
    }
  };

  const handleLanguageSelect = (language: 'en' | 'it') => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language);
  };

  const handleDietaryToggle = (restriction: string) => {
    setSelectedDietaryRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const stepAnimatedStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
    transform: [{ translateX: slideX.value }],
  }));

  const currentStepData = steps[currentStep];
  const isLanguageStep = currentStep === 4;
  const isDietaryStep = currentStep === 5;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
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
      </View>

      <Animated.View style={[styles.content, stepAnimatedStyle]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              {currentStepData.icon}
            </View>
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
            <Text style={styles.description}>{currentStepData.description}</Text>
          </View>

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
                {t('onboarding.dietary.hint') || 'You can select multiple options or skip this step'}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <Text style={[styles.navButtonText, styles.backButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            {t('common.back') || 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.nextButtonText]}>
            {isLastStep ? (t('onboarding.getStarted') || 'Get Started') : (t('common.next') || 'Next')}
          </Text>
        </TouchableOpacity>
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
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
    paddingTop: 40,
    paddingBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
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
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
});