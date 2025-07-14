import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationModal, NotificationType } from './NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

interface DietaryPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DietaryPreferencesModal: React.FC<DietaryPreferencesModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState(user?.dietaryRestrictions || []);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success' as NotificationType,
    title: '',
    message: '',
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const summaryOpacity = useSharedValue(0);
  const sectionsOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset animations when modal opens
      headerOpacity.value = 0;
      summaryOpacity.value = 0;
      sectionsOpacity.value = 0;
      
      // Entrance animations
      headerOpacity.value = withTiming(1, { duration: 600 });
      summaryOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
      sectionsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    }
  }, [visible]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const summaryAnimatedStyle = useAnimatedStyle(() => ({
    opacity: summaryOpacity.value,
  }));

  const sectionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sectionsOpacity.value,
  }));

  const safeT = (key: string, fallback?: string) => {
    try {
      const result = t(key);
      return typeof result === 'string' && result !== key ? result : (fallback || key);
    } catch (error) {
      return fallback || key;
    }
  };

  const dietaryOptions = [
    { 
      key: 'vegetarian', 
      emoji: '🌱',
      description: 'No meat, poultry, or fish'
    },
    { 
      key: 'vegan', 
      emoji: '🌿',
      description: 'No animal products'
    },
    { 
      key: 'gluten-free', 
      emoji: '🌾',
      description: 'No wheat, barley, or rye'
    },
    { 
      key: 'dairy-free', 
      emoji: '🥛',
      description: 'No milk or dairy products'
    },
    { 
      key: 'nut-free', 
      emoji: '🥜',
      description: 'No tree nuts or peanuts'
    },
    { 
      key: 'soy-free', 
      emoji: '🫘',
      description: 'No soy products'
    },
    { 
      key: 'egg-free', 
      emoji: '🥚',
      description: 'No eggs or egg products'
    },
    { 
      key: 'low-carb', 
      emoji: '🥩',
      description: 'Reduced carbohydrates'
    },
    { 
      key: 'keto', 
      emoji: '🧈',
      description: 'High fat, very low carb'
    },
    { 
      key: 'paleo', 
      emoji: '🦴',
      description: 'Whole foods, no processed'
    },
  ];

  const debouncedSave = (restrictions: string[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setIsUpdating(true);
      try {
        await updateProfile({ dietaryRestrictions: restrictions });
        setNotification({
          visible: true,
          type: 'success',
          title: safeT('common.success'),
          message: safeT('profile.dietaryPreferencesUpdated', 'Dietary preferences updated'),
        });
      } catch (error) {
        setNotification({
          visible: true,
          type: 'error',
          title: safeT('common.error'),
          message: safeT('profile.saveError', 'Failed to save preferences'),
        });
      } finally {
        setIsUpdating(false);
      }
    }, 1000);
  };

  const handleDietaryRestrictionToggle = (restriction: string) => {
    const newRestrictions = dietaryRestrictions.includes(restriction)
      ? dietaryRestrictions.filter(r => r !== restriction)
      : [...dietaryRestrictions, restriction];
    
    setDietaryRestrictions(newRestrictions);
    debouncedSave(newRestrictions);
  };

  const clearAllRestrictions = () => {
    setDietaryRestrictions([]);
    debouncedSave([]);
  };

  const DietaryOption: React.FC<{
    option: typeof dietaryOptions[0];
    isSelected: boolean;
    onToggle: () => void;
  }> = ({ option, isSelected, onToggle }) => (
    <TouchableOpacity style={styles.dietaryOption} onPress={onToggle}>
      <View style={styles.optionLeft}>
        <Text style={styles.optionEmoji}>{option.emoji}</Text>
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>
            {safeT(`profile.dietary.${option.key}`, option.key.replace('-', ' '))}
          </Text>
          <Text style={styles.optionDescription}>
            {safeT(`profile.dietary.${option.key}Desc`, option.description)}
          </Text>
        </View>
      </View>
      <Switch
        value={isSelected}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="white"
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {safeT('profile.dietaryPreferences', 'Dietary Preferences')}
          </Text>
          <View style={styles.headerRight}>
            {isUpdating && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Summary */}
          <Animated.View style={[styles.summaryContainer, summaryAnimatedStyle]}>
            <Text style={styles.summaryTitle}>
              {safeT('profile.selectedRestrictions', 'Selected Restrictions')}
            </Text>
            <Text style={styles.summaryCount}>
              {dietaryRestrictions.length} {safeT('profile.of', 'of')} {dietaryOptions.length} {safeT('profile.selected', 'selected')}
            </Text>
            {dietaryRestrictions.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearAllRestrictions}>
                <Text style={styles.clearButtonText}>
                  {safeT('profile.clearAll', 'Clear All')}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Dietary Options */}
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>
              {safeT('profile.availableOptions', 'Available Options')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {safeT('profile.dietaryHelpText', 'Select your dietary restrictions to get personalized recipe suggestions')}
            </Text>
            
            {dietaryOptions.map((option) => (
              <DietaryOption
                key={option.key}
                option={option}
                isSelected={dietaryRestrictions.includes(option.key)}
                onToggle={() => handleDietaryRestrictionToggle(option.key)}
              />
            ))}
          </Animated.View>

          {/* Info Section */}
          <Animated.View style={[styles.infoSection, sectionsAnimatedStyle]}>
            <Text style={styles.infoTitle}>
              💡 {safeT('profile.howItWorks', 'How it works')}
            </Text>
            <Text style={styles.infoText}>
              {safeT('profile.dietaryExplanation', 'Your dietary preferences help us filter recipes and suggest ingredients that match your lifestyle. You can change these settings anytime.')}
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  dietaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});