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
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { NotificationModal, NotificationType } from './NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface AppPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AppPreferencesModal: React.FC<AppPreferencesModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { isDarkMode, themeMode, setThemeMode, colors } = useTheme();
  const styles = getStyles(colors);
  const [isUpdating, setIsUpdating] = useState(false);
  const [preferences, setPreferences] = useState({
    preferredLanguage: user?.preferredLanguage || 'en',
    notifications: true,
    autoSave: true,
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success' as NotificationType,
    title: '',
    message: '',
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const sectionsOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset animations when modal opens
      headerOpacity.value = 0;
      contentOpacity.value = 0;
      sectionsOpacity.value = 0;
      
      // Entrance animations
      headerOpacity.value = withTiming(1, { duration: 600 });
      contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
      sectionsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    }
  }, [visible]);


  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
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

  const debouncedSave = (updates: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setIsUpdating(true);
      try {
        await updateProfile(updates);
        setNotification({
          visible: true,
          type: 'success',
          title: safeT('common.success'),
          message: safeT('profile.saveSuccess', 'Preferences updated successfully'),
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

  const handleLanguageToggle = () => {
    const newLanguage = preferences.preferredLanguage === 'en' ? 'it' : 'en';
    const updates = { ...preferences, preferredLanguage: newLanguage };
    setPreferences(updates);
    i18n.changeLanguage(newLanguage);
    debouncedSave({ preferredLanguage: newLanguage });
  };

  const PreferenceRow: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    disabled?: boolean;
  }> = ({ title, subtitle, children, disabled = false }) => (
    <View style={[styles.preferenceRow, disabled && styles.disabledRow]}>
      <View style={styles.preferenceContent}>
        <Text style={[styles.preferenceTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.preferenceSubtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.preferenceControl}>
        {children}
      </View>
    </View>
  );

  const ThemeOption: React.FC<{
    title: string;
    subtitle: string;
    isSelected: boolean;
    onPress: () => void;
  }> = ({ title, subtitle, isSelected, onPress }) => (
    <TouchableOpacity style={styles.themeOption} onPress={onPress}>
      <View style={styles.themeOptionContent}>
        <Text style={styles.themeOptionTitle}>{title}</Text>
        <Text style={styles.themeOptionSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
        {isSelected && <View style={styles.radioButtonInner} />}
      </View>
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
            {safeT('profile.preferences', 'App Preferences')}
          </Text>
          <View style={styles.headerRight}>
            {isUpdating && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <ScrollView 
            style={styles.scrollContainer} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Language Section */}
            <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.languageSettings', 'Language Settings')}
              </Text>
              
              <PreferenceRow
                title={safeT('profile.language', 'Language')}
                subtitle={preferences.preferredLanguage === 'en' ? 'English' : 'Italiano'}
              >
                <Switch
                  value={preferences.preferredLanguage === 'it'}
                  onValueChange={handleLanguageToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                />
              </PreferenceRow>
            </Animated.View>

            {/* Notifications Section */}
            <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.notificationSettings', 'Notification Settings')}
              </Text>
              
              <PreferenceRow
                title={safeT('profile.pushNotifications', 'Push Notifications')}
                subtitle={safeT('profile.pushNotificationsDesc', 'Receive notifications about new recipes and updates')}
                disabled
              >
                <Switch
                  value={preferences.notifications}
                  onValueChange={() => {}}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                  disabled
                />
              </PreferenceRow>

              <PreferenceRow
                title={safeT('profile.emailNotifications', 'Email Notifications')}
                subtitle={safeT('profile.emailNotificationsDesc', 'Receive recipe suggestions via email')}
                disabled
              >
                <Switch
                  value={false}
                  onValueChange={() => {}}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                  disabled
                />
              </PreferenceRow>
            </Animated.View>

            {/* App Behavior Section */}
            <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.appBehavior', 'App Behavior')}
              </Text>
              
              <PreferenceRow
                title={safeT('profile.autoSave', 'Auto-save Profile Changes')}
                subtitle={safeT('profile.autoSaveDesc', 'Automatically save changes to your profile')}
              >
                <Switch
                  value={preferences.autoSave}
                  onValueChange={(value) => setPreferences({ ...preferences, autoSave: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                />
              </PreferenceRow>

            </Animated.View>

            {/* Appearance Section */}
            <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.appearance', 'Appearance')}
              </Text>
              
              <ThemeOption
                title={safeT('profile.themeAuto', 'Automatic')}
                subtitle={safeT('profile.themeAutoDesc', 'Follow system setting')}
                isSelected={themeMode === 'auto'}
                onPress={() => setThemeMode('auto')}
              />
              
              <ThemeOption
                title={safeT('profile.themeLight', 'Light')}
                subtitle={safeT('profile.themeLightDesc', 'Always use light theme')}
                isSelected={themeMode === 'light'}
                onPress={() => setThemeMode('light')}
              />
              
              <ThemeOption
                title={safeT('profile.themeDark', 'Dark')}
                subtitle={safeT('profile.themeDarkDesc', 'Always use dark theme')}
                isSelected={themeMode === 'dark'}
                onPress={() => setThemeMode('dark')}
              />
            </Animated.View>

            {/* Data & Storage Section */}
            <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.dataStorage', 'Data & Storage')}
              </Text>
              
              <TouchableOpacity style={styles.actionRow} disabled>
                <Text style={[styles.actionText, styles.disabledText]}>
                  {safeT('profile.clearCache', 'Clear Cache')}
                </Text>
                <Text style={styles.actionSubtext}>
                  {safeT('profile.comingSoon', 'Coming soon')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionRow} disabled>
                <Text style={[styles.actionText, styles.disabledText]}>
                  {safeT('profile.exportData', 'Export My Data')}
                </Text>
                <Text style={styles.actionSubtext}>
                  {safeT('profile.comingSoon', 'Coming soon')}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Coming Soon Notice */}
            <Animated.View style={[styles.noticeContainer, sectionsAnimatedStyle]}>
              <Text style={styles.noticeText}>
                {safeT('profile.featuresComingSoon', 'Some features are coming in future updates')}
              </Text>
            </Animated.View>
          </ScrollView>
        </Animated.View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  disabledRow: {
    opacity: 0.5,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  preferenceControl: {
    marginLeft: 16,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  actionRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  actionText: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '500',
  },
  actionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noticeContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  noticeText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  themeOptionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});