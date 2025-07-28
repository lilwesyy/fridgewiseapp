import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  SafeAreaView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SupportModal } from '../modals/SupportModal';
import { NotificationModal, NotificationType } from '../modals/NotificationModal';
import { AccountInfoModal } from '../modals/AccountInfoModal';
import { AppPreferencesModal } from '../modals/AppPreferencesModal';
import { DietaryPreferencesModal } from '../modals/DietaryPreferencesModal';
import { AvatarEditModal } from '../modals/AvatarEditModal';
import { PrivacyPolicyModal } from '../modals/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../modals/TermsOfServiceModal';
import { AdminStatsModal } from '../modals/AdminStatsModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES, ANIMATION_DELAYS } from '../../constants/animations';

interface ProfileScreenProps {
  onLogout: () => void;
}



// Icons Components - Using Ionicons for consistency
const UserIcon = ({ color }: { color: string }) => (
  <Ionicons name="person-outline" size={20} color={color} />
);

const SettingsIcon = ({ color }: { color: string }) => (
  <Ionicons name="settings-outline" size={20} color={color} />
);

const FoodIcon = ({ color }: { color: string }) => (
  <Ionicons name="nutrition-outline" size={20} color={color} />
);

const SupportIcon = ({ color }: { color: string }) => (
  <Ionicons name="help-circle-outline" size={20} color={color} />
);

const AdminIcon = ({ color }: { color: string }) => (
  <Ionicons name="shield-outline" size={20} color={color} />
);

const ChevronIcon = ({ color }: { color: string }) => (
  <Ionicons name="chevron-forward" size={16} color={color} />
);

const EditIcon = ({ color }: { color: string }) => (
  <Ionicons name="create-outline" size={16} color={color} />
);

const LogoutIcon = ({ color }: { color: string }) => (
  <Ionicons name="log-out-outline" size={18} color={color} />
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onLogout
}) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, uploadAvatar, deleteAvatar } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileForm, setProfileForm] = useState<{
    name: string;
    email: string;
    preferredLanguage: 'en' | 'it';
    dietaryRestrictions: string[];
  }>({
    name: user?.name || '',
    email: user?.email || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    dietaryRestrictions: user?.dietaryRestrictions || [],
  });
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAdminStatsModal, setShowAdminStatsModal] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: NotificationType;
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const sectionsOpacity = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);
    
    // iOS-style staggered content entrance
    headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    sectionsOpacity.value = withDelay(ANIMATION_DELAYS.STAGGER_1, withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD, easing }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const sectionsStyle = useAnimatedStyle(() => ({
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

  // Section Header Component
  const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
      {icon && <View style={styles.sectionIcon}>{icon}</View>}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Section Container Component
  const Section: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
    <View style={[styles.section, style]}>
      {children}
    </View>
  );

  // Setting Row Component
  const SettingRow: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onPress?: () => void;
  }> = ({ title, subtitle, children, onPress }) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingControl}>
        {children}
      </View>
    </TouchableOpacity>
  );

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
    'nut-free', 'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'
  ];

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
          message: safeT('profile.saveSuccess', 'Profile updated successfully'),
        });
      } catch (error) {
        setNotification({
          visible: true,
          type: 'error',
          title: safeT('common.error'),
          message: safeT('profile.saveError', 'Failed to save profile'),
        });
      } finally {
        setIsUpdating(false);
      }
    }, 1000);
  };

  const handleNameChange = (name: string) => {
    const updates = { ...profileForm, name };
    setProfileForm(updates);
    debouncedSave(updates);
  };

  const handleLanguageToggle = () => {
    const newLanguage: 'en' | 'it' = profileForm.preferredLanguage === 'en' ? 'it' : 'en';
    const updates = { ...profileForm, preferredLanguage: newLanguage };
    setProfileForm(updates);
    i18n.changeLanguage(newLanguage);
    debouncedSave(updates);
  };

  const handleDietaryRestrictionToggle = (restriction: string) => {
    const currentRestrictions = profileForm.dietaryRestrictions;
    const newRestrictions = currentRestrictions.includes(restriction)
      ? currentRestrictions.filter(r => r !== restriction)
      : [...currentRestrictions, restriction];
    
    const updates = { ...profileForm, dietaryRestrictions: newRestrictions };
    setProfileForm(updates);
    debouncedSave(updates);
  };

  const handleLogout = () => {
    setNotification({
      visible: true,
      type: 'warning',
      title: safeT('profile.logoutConfirm', 'Logout'),
      message: safeT('profile.logoutMessage', 'Are you sure you want to logout?'),
      buttons: [
        {
          text: safeT('common.cancel', 'Cancel'),
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: safeT('profile.logout', 'Logout'),
          style: 'destructive',
          onPress: onLogout,
        },
      ],
    });
  };

  const getMemberSinceDate = () => {
    // @ts-ignore - createdAt might exist on user object
    if (!user?.createdAt) return '';
    // @ts-ignore
    const date = new Date(user.createdAt);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long'
    };
    return date.toLocaleDateString(i18n.language === 'it' ? 'it-IT' : 'en-US', options);
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View style={[styles.profileHeader, headerStyle]}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity activeOpacity={0.7}
              style={styles.avatarWrapper}
              onPress={() => setShowAvatarModal(true)}
            >
              {user?.avatar?.url ? (
                <Image
                  source={{ uri: `${user.avatar.url}?v=${Date.now()}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.editAvatarButton}>
                <EditIcon color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || user?.email}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            {safeT('profile.memberSince', 'Member since')} {getMemberSinceDate()}
          </Text>
          {isUpdating && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.savingText}>{safeT('profile.saving', 'Saving...')}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={sectionsStyle}>
          {/* Account & Profile */}
          <Section>
            <SectionHeader 
              title={safeT('profile.accountProfile', 'Account & Profile')} 
              icon={<UserIcon color={colors.textSecondary} />} 
            />
            <SettingRow 
              title={safeT('profile.accountInfo', 'Account Information')}
              subtitle={safeT('profile.manageAccount', 'Name, email, and account details')}
              onPress={() => setShowAccountModal(true)}
            >
              <ChevronIcon color={colors.textSecondary} />
            </SettingRow>
            <SettingRow 
              title={safeT('profile.dietaryPreferences', 'Dietary Preferences')}
              subtitle={`${profileForm.dietaryRestrictions.length} ${safeT('profile.restrictionsSelected', 'restrictions selected')}`}
              onPress={() => setShowDietaryModal(true)}
            >
              <ChevronIcon color={colors.textSecondary} />
            </SettingRow>
          </Section>

          {/* App Settings */}
          <Section>
            <SectionHeader 
              title={safeT('profile.appSettings', 'App Settings')} 
              icon={<SettingsIcon color={colors.textSecondary} />} 
            />
            <SettingRow 
              title={safeT('profile.preferences', 'App Preferences')}
              subtitle={safeT('profile.managePreferences', 'Language, notifications, and app behavior')}
              onPress={() => setShowPreferencesModal(true)}
            >
              <ChevronIcon color={colors.textSecondary} />
            </SettingRow>
          </Section>

          {/* Support & Legal */}
          <Section>
            <SectionHeader 
              title={safeT('profile.supportLegal', 'Support & Legal')} 
              icon={<SupportIcon color={colors.textSecondary} />} 
            />
            <SettingRow 
              title={safeT('profile.help', 'Help & Support')}
              subtitle={safeT('profile.helpDesc', 'Contact support and get help with the app')}
              onPress={() => setShowSupportModal(true)}
            >
              <ChevronIcon color={colors.textSecondary} />
            </SettingRow>
            <SettingRow 
              title={safeT('profile.privacyPolicy', 'Privacy Policy')}
              subtitle={safeT('profile.privacyPolicyDesc', 'Learn how we protect your data')}
              onPress={() => setShowPrivacyModal(true)}
            >
              <ChevronIcon color={colors.textSecondary} />
            </SettingRow>
            <SettingRow 
              title={safeT('profile.termsOfService', 'Terms of Service')}
              subtitle={safeT('profile.termsOfServiceDesc', 'Read our terms and conditions')}
              onPress={() => setShowTermsModal(true)}
            >
              <ChevronIcon color={colors.textSecondary} />
            </SettingRow>
          </Section>

          {/* Admin Section (conditional) */}
          {user?.role === 'admin' && (
            <Section>
              <SectionHeader 
                title={safeT('profile.admin', 'Administration')} 
                icon={<AdminIcon color={colors.textSecondary} />} 
              />
              <SettingRow 
                title={safeT('admin.statsTitle', 'App Statistics')}
                subtitle={safeT('admin.statsDesc', 'View app usage statistics and analytics')}
                onPress={() => setShowAdminStatsModal(true)}
              >
                <ChevronIcon color={colors.textSecondary} />
              </SettingRow>
            </Section>
          )}

          {/* Account Actions */}
          <TouchableOpacity activeOpacity={0.7} style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutButtonContent}>
              <LogoutIcon color="white" />
              <Text style={styles.logoutButtonText}>
                {safeT('profile.logout', 'Logout')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* App Information */}
          <View style={styles.footerSection}>
            <Text style={styles.appVersion}>
              FridgeWiseAI v{process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <SupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      <AccountInfoModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />

      <AppPreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
      />

      <DietaryPreferencesModal
        visible={showDietaryModal}
        onClose={() => setShowDietaryModal(false)}
      />

      <AvatarEditModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onAvatarUpdated={(updatedUser) => {
          // Force re-render and clear image cache
          setProfileForm(prev => ({ ...prev, _forceUpdate: Date.now() }));
        }}
      />
      
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
      
      <TermsOfServiceModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      
      <AdminStatsModal
        visible={showAdminStatsModal}
        onClose={() => setShowAdminStatsModal(false)}
      />
      
      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
        buttons={notification.buttons}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background === '#FFFFFF' ? '#F0F2F5' : 
                     colors.background === '#000000' ? '#1A1A1A' : 
                     colors.backgroundDark || colors.background,
    paddingTop: Platform.OS === 'ios' ? 0 : 24, // SafeAreaView handles iOS automatically
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.buttonText,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  editAvatarText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 16,
  },
  savingText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.surface,
    marginBottom: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.sectionHeader,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 60,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingControl: {
    marginLeft: 16,
  },
  nameInput: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
    minWidth: 120,
    paddingVertical: 4,
  },
  emailText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  footerSection: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 40,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});