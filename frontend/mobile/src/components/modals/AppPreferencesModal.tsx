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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { NotificationModal, NotificationType } from '../modals/NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES } from '../../constants/animations';
import { imageCacheService } from '../../services/imageCacheService';

const { height: screenHeight } = Dimensions.get('window');

interface AppPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AppPreferencesModal: React.FC<AppPreferencesModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { isDarkMode, themeMode, setThemeMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [preferences, setPreferences] = useState({
    preferredLanguage: user?.preferredLanguage || 'en',
    notifications: user?.notifications ?? true,
    autoSave: user?.autoSave ?? true,
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

  // Clear cache modal animation values
  const clearCacheModalTranslateY = useSharedValue(screenHeight);
  const clearCacheModalOpacity = useSharedValue(0);

  // Sync preferences when user data changes
  useEffect(() => {
    if (user) {
      setPreferences({
        preferredLanguage: user.preferredLanguage || 'en',
        notifications: user.notifications ?? true,
        autoSave: user.autoSave ?? true,
      });
    }
  }, [user]);

  useEffect(() => {
    if (visible) {
      // Reset animations when modal opens
      headerOpacity.value = 0;
      contentOpacity.value = 0;
      sectionsOpacity.value = 0;

      // iOS easing curve
      const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);

      // Entrance animations
      headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
      contentOpacity.value = withDelay(100, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
      sectionsOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    }
  }, [visible]);

  // Clear cache modal animations - using ShareModal style
  useEffect(() => {
    if (showClearCacheModal) {
      // iOS sheet presentation timing
      clearCacheModalOpacity.value = withTiming(1, {
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2)
      });
      clearCacheModalTranslateY.value = withSpring(0, SPRING_CONFIGS.MODAL);
    } else {
      // iOS sheet dismissal - faster opacity, slower slide for natural feel
      clearCacheModalOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2)
      });
      clearCacheModalTranslateY.value = withSpring(screenHeight, {
        damping: 35,
        stiffness: 400,
        mass: 1
      });
    }
  }, [showClearCacheModal]);


  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const sectionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sectionsOpacity.value,
  }));

  // Clear cache modal animated styles - separate like ShareModal
  const clearCacheBackdropStyle = useAnimatedStyle(() => ({
    opacity: clearCacheModalOpacity.value,
  }));

  const clearCacheModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: clearCacheModalTranslateY.value }],
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

  const handleLanguageChange = (language: 'en' | 'it') => {
    const updates = { ...preferences, preferredLanguage: language };
    setPreferences(updates);
    i18n.changeLanguage(language);
    debouncedSave({ preferredLanguage: language });
  };

  const handleClearCacheRequest = () => {
    setShowClearCacheModal(true);
  };

  const handleClearCache = async () => {
    setShowClearCacheModal(false);
    setIsClearingCache(true);
    try {
      // Get cache stats before clearing
      const stats = await imageCacheService.getCacheStats();

      // Clear the image cache
      await imageCacheService.clearCache();

      // Show success notification with stats
      const sizeInMB = (stats.totalSize / (1024 * 1024)).toFixed(1);
      setNotification({
        visible: true,
        type: 'success',
        title: safeT('common.success'),
        message: safeT('profile.cacheCleared', `Cache cancellata con successo! Liberati ${sizeInMB}MB di spazio.`),
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: safeT('profile.cacheClearError', 'Impossibile cancellare la cache. Riprova.'),
      });
    } finally {
      setIsClearingCache(false);
    }
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
    <TouchableOpacity activeOpacity={0.7} style={styles.themeOption} onPress={onPress}>
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
          <TouchableOpacity activeOpacity={0.7} style={styles.cancelButton} onPress={onClose}>
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

              <TouchableOpacity activeOpacity={0.7}
                style={styles.languageOption}
                onPress={() => handleLanguageChange('en')}
              >
                <View style={styles.languageOptionContent}>
                  <Text style={styles.languageFlag}>🇺🇸</Text>
                  <View style={styles.languageTextContent}>
                    <Text style={styles.languageOptionTitle}>English</Text>
                    <Text style={styles.languageOptionSubtitle}>English</Text>
                  </View>
                </View>
                <View style={[styles.radioButton, preferences.preferredLanguage === 'en' && styles.radioButtonSelected]}>
                  {preferences.preferredLanguage === 'en' && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}
                style={styles.languageOption}
                onPress={() => handleLanguageChange('it')}
              >
                <View style={styles.languageOptionContent}>
                  <Text style={styles.languageFlag}>🇮🇹</Text>
                  <View style={styles.languageTextContent}>
                    <Text style={styles.languageOptionTitle}>Italiano</Text>
                    <Text style={styles.languageOptionSubtitle}>Italian</Text>
                  </View>
                </View>
                <View style={[styles.radioButton, preferences.preferredLanguage === 'it' && styles.radioButtonSelected]}>
                  {preferences.preferredLanguage === 'it' && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Notifications Section */}
            <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.notificationSettings', 'Notification Settings')}
              </Text>

              <PreferenceRow
                title={safeT('profile.pushNotifications', 'Push Notifications')}
                subtitle={safeT('profile.pushNotificationsDesc', 'Receive notifications about new recipes and updates')}
              >
                <Switch
                  value={preferences.notifications}
                  onValueChange={(value) => {
                    const updates = { ...preferences, notifications: value };
                    setPreferences(updates);
                    debouncedSave({ notifications: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                />
              </PreferenceRow>

              <PreferenceRow
                title={safeT('profile.emailNotifications', 'Email Notifications')}
                subtitle={safeT('profile.emailNotificationsDesc', 'Receive recipe suggestions via email')}
                disabled
              >
                <Switch
                  value={false}
                  onValueChange={() => { }}
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
                  onValueChange={(value) => {
                    const updates = { ...preferences, autoSave: value };
                    setPreferences(updates);
                    debouncedSave({ autoSave: value });
                  }}
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
                onPress={() => {
                  setThemeMode('auto');
                  debouncedSave({ themeMode: 'auto' });
                }}
              />

              <ThemeOption
                title={safeT('profile.themeLight', 'Light')}
                subtitle={safeT('profile.themeLightDesc', 'Always use light theme')}
                isSelected={themeMode === 'light'}
                onPress={() => {
                  setThemeMode('light');
                  debouncedSave({ themeMode: 'light' });
                }}
              />

              <ThemeOption
                title={safeT('profile.themeDark', 'Dark')}
                subtitle={safeT('profile.themeDarkDesc', 'Always use dark theme')}
                isSelected={themeMode === 'dark'}
                onPress={() => {
                  setThemeMode('dark');
                  debouncedSave({ themeMode: 'dark' });
                }}
              />
            </Animated.View>

            {/* Data & Storage Section */}
            <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.dataStorage', 'Data & Storage')}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.actionRow}
                onPress={handleClearCacheRequest}
                disabled={isClearingCache}
              >
                <View style={styles.actionRowContent}>
                  <Text style={[styles.actionText, isClearingCache && styles.disabledText]}>
                    {safeT('profile.clearCache', 'Cancella Cache')}
                  </Text>
                  <Text style={styles.actionSubtext}>
                    {safeT('profile.clearCacheDesc', 'Libera spazio di archiviazione cancellando i dati temporanei')}
                  </Text>
                </View>
                {isClearingCache && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.actionLoader} />
                )}
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} style={styles.actionRow} disabled>
                <View style={styles.actionRowContent}>
                  <Text style={[styles.actionText, styles.disabledText]}>
                    {safeT('profile.exportData', 'Export My Data')}
                  </Text>
                  <Text style={styles.actionSubtext}>
                    {safeT('profile.comingSoon', 'Coming soon')}
                  </Text>
                </View>
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

      {/* Clear Cache Confirmation Modal */}
      <Modal
        visible={showClearCacheModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowClearCacheModal(false)}
      >
        <Animated.View style={[styles.confirmModalOverlay, clearCacheBackdropStyle]}>
          <Animated.View style={[styles.confirmModalContainer, clearCacheModalStyle]}>
            <View style={styles.confirmModalHandle} />

            <View style={styles.confirmModalHeader}>
              <Text style={styles.confirmModalTitle}>
                {safeT('profile.clearCacheConfirm', 'Cancella Cache')}
              </Text>
              <Text style={styles.confirmModalMessage}>
                {safeT('profile.clearCacheMessage', 'Sei sicuro di voler cancellare tutti i dati temporanei? Questa azione non può essere annullata.')}
              </Text>
            </View>

            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
                onPress={() => setShowClearCacheModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmModalButtonText, styles.confirmModalCancelText]}>
                  {safeT('common.cancel', 'Annulla')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalConfirmButton]}
                onPress={handleClearCache}
                activeOpacity={0.7}
                disabled={isClearingCache}
              >
                <Text style={[styles.confirmModalButtonText, styles.confirmModalConfirmText]}>
                  {isClearingCache ? safeT('profile.clearing', 'Cancellando...') : safeT('profile.clearCache', 'Cancella')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </Modal>
  );
};

const getStyles = (colors: any, insets: { bottom: number }) => StyleSheet.create({
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
    paddingBottom: Math.max(insets.bottom, 16) + 24,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow || '#000',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  actionRowContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
    fontWeight: '500',
  },
  actionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionLoader: {
    marginLeft: 12,
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
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  languageOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageTextContent: {
    flex: 1,
  },
  languageOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  languageOptionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Clear Cache Confirmation Modal Styles (matching ShareModal design)
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  confirmModalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Math.max(insets.bottom, 16) + 18,
  },
  confirmModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.6,
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmModalCancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmModalConfirmButton: {
    backgroundColor: colors.error,
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalCancelText: {
    color: colors.text,
  },
  confirmModalConfirmText: {
    color: colors.buttonText,
  },
});