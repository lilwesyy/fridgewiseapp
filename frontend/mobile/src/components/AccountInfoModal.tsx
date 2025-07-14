import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
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
  Easing,
} from 'react-native-reanimated';

interface AccountInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
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
  const avatarScale = useSharedValue(0.8);
  const sectionsOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset animations when modal opens
      headerOpacity.value = 0;
      avatarScale.value = 0.8;
      sectionsOpacity.value = 0;
      
      // Entrance animations
      headerOpacity.value = withTiming(1, { duration: 600 });
      avatarScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 100 }));
      sectionsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    }
  }, [visible]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
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

  const getMemberSinceDate = () => {
    if (!user?.createdAt) return '';
    const date = new Date(user.createdAt);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(i18n.language === 'it' ? 'it-IT' : 'en-US', options);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, headerStyle]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {safeT('profile.accountInfo', 'Account Information')}
          </Text>
          <View style={styles.headerRight}>
            {isUpdating && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.content, sectionsStyle]}>
          <ScrollView 
            style={styles.scrollContainer} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile Avatar */}
            <View style={styles.avatarSection}>
              <Animated.View style={[styles.avatar, avatarStyle]}>
                <Text style={styles.avatarText}>
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </Animated.View>
            </View>

            {/* Account Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.accountDetails', 'Account Details')}
              </Text>
              
              {/* Name Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {safeT('profile.name', 'Name')}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.name}
                  onChangeText={handleNameChange}
                  placeholder={safeT('profile.enterName', 'Enter your name')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {safeT('profile.email', 'Email')}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={user?.email || ''}
                  editable={false}
                />
                <Text style={styles.fieldNote}>
                  {safeT('profile.emailNotEditable', 'Email cannot be changed')}
                </Text>
              </View>

              {/* Member Since */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {safeT('profile.memberSince', 'Member since')}
                </Text>
                <Text style={styles.fieldValue}>
                  {getMemberSinceDate()}
                </Text>
              </View>

              {/* Account Type */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {safeT('profile.accountType', 'Account Type')}
                </Text>
                <View style={styles.badgeContainer}>
                  <Text style={[
                    styles.badge, 
                    user?.role === 'admin' ? styles.adminBadge : styles.userBadge
                  ]}>
                    {user?.role === 'admin' ? 
                      safeT('profile.admin', 'Admin') : 
                      safeT('profile.user', 'User')
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {safeT('profile.security', 'Security')}
              </Text>
              
              <TouchableOpacity style={styles.actionRow} disabled>
                <Text style={styles.actionText}>
                  {safeT('profile.changePassword', 'Change Password')}
                </Text>
                <Text style={styles.actionSubtext}>
                  {safeT('profile.comingSoon', 'Coming soon')}
                </Text>
              </TouchableOpacity>
            </View>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.buttonText,
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
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledInput: {
    backgroundColor: colors.card,
    color: colors.textSecondary,
  },
  fieldNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userBadge: {
    backgroundColor: colors.card,
    color: colors.primary,
  },
  adminBadge: {
    backgroundColor: colors.warning,
    color: colors.text,
  },
  actionRow: {
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});