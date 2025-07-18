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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SupportModal } from './SupportModal';
import { NotificationModal, NotificationType } from './NotificationModal';
import { AccountInfoModal } from './AccountInfoModal';
import { AppPreferencesModal } from './AppPreferencesModal';
import { DietaryPreferencesModal } from './DietaryPreferencesModal';
import { AvatarEditModal } from './AvatarEditModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { TermsOfServiceModal } from './TermsOfServiceModal';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES, ANIMATION_DELAYS } from '../constants/animations';

interface ProfileScreenProps {
  onLogout: () => void;
  onShowAdminStats?: () => void;
}



// Icons Components
const UserIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx={12} cy={7} r={4} stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SettingsIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke="rgb(22, 163, 74)" strokeWidth={2}/>
    <Path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.548 4.34276 9.72569 4.07447C9.90339 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.548 19.9255 9.72569C20.1938 9.90339 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const FoodIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3 6H21" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SupportIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="rgb(22, 163, 74)" strokeWidth={2}/>
    <Path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 17H12.01" stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const AdminIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 15C16.4183 15 20 18.5817 20 23H4C4 18.5817 7.58172 15 12 15Z" stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx={12} cy={7} r={4} stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M14 2L16 4L20 0" stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke="#C7C7CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const EditIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="rgb(22, 163, 74)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onLogout, 
  onShowAdminStats 
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
                <EditIcon />
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
              icon={<UserIcon />} 
            />
            <SettingRow 
              title={safeT('profile.accountInfo', 'Account Information')}
              subtitle={safeT('profile.manageAccount', 'Name, email, and account details')}
              onPress={() => setShowAccountModal(true)}
            >
              <ChevronIcon />
            </SettingRow>
            <SettingRow 
              title={safeT('profile.dietaryPreferences', 'Dietary Preferences')}
              subtitle={`${profileForm.dietaryRestrictions.length} ${safeT('profile.restrictionsSelected', 'restrictions selected')}`}
              onPress={() => setShowDietaryModal(true)}
            >
              <ChevronIcon />
            </SettingRow>
          </Section>

          {/* App Settings */}
          <Section>
            <SectionHeader 
              title={safeT('profile.appSettings', 'App Settings')} 
              icon={<SettingsIcon />} 
            />
            <SettingRow 
              title={safeT('profile.preferences', 'App Preferences')}
              subtitle={safeT('profile.managePreferences', 'Language, notifications, and app behavior')}
              onPress={() => setShowPreferencesModal(true)}
            >
              <ChevronIcon />
            </SettingRow>
          </Section>

          {/* Support & Legal */}
          <Section>
            <SectionHeader 
              title={safeT('profile.supportLegal', 'Support & Legal')} 
              icon={<SupportIcon />} 
            />
            <SettingRow 
              title={safeT('profile.help', 'Help & Support')}
              subtitle={safeT('profile.helpDesc', 'Contact support and get help with the app')}
              onPress={() => setShowSupportModal(true)}
            >
              <ChevronIcon />
            </SettingRow>
            <SettingRow 
              title={safeT('profile.privacyPolicy', 'Privacy Policy')}
              subtitle={safeT('profile.privacyPolicyDesc', 'Learn how we protect your data')}
              onPress={() => setShowPrivacyModal(true)}
            >
              <ChevronIcon />
            </SettingRow>
            <SettingRow 
              title={safeT('profile.termsOfService', 'Terms of Service')}
              subtitle={safeT('profile.termsOfServiceDesc', 'Read our terms and conditions')}
              onPress={() => setShowTermsModal(true)}
            >
              <ChevronIcon />
            </SettingRow>
          </Section>

          {/* Admin Section (conditional) */}
          {user?.role === 'admin' && onShowAdminStats && (
            <Section>
              <SectionHeader 
                title={safeT('profile.admin', 'Administration')} 
                icon={<AdminIcon />} 
              />
              <SettingRow 
                title={safeT('admin.statsTitle', 'App Statistics')}
                subtitle={safeT('admin.statsDesc', 'View app usage statistics and analytics')}
                onPress={onShowAdminStats}
              >
                <ChevronIcon />
              </SettingRow>
            </Section>
          )}

          {/* Account Actions */}
          <Section>
            <TouchableOpacity activeOpacity={0.7} style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>
                {safeT('profile.logout', 'Logout')}
              </Text>
            </TouchableOpacity>
          </Section>

          {/* App Information */}
          <Section style={styles.footerSection}>
            <Text style={styles.appVersion}>
              FridgeWise v1.0.0
            </Text>
          </Section>
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
    backgroundColor: colors.background,
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
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  footerSection: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 40,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});