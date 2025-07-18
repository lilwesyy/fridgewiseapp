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
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES } from '../constants/animations';

interface AccountInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, token } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success' as NotificationType,
    title: '',
    message: '',
  });


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

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return safeT('profile.passwordMinLength', 'Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return safeT('profile.passwordCase', 'Password must contain both uppercase and lowercase letters');
    }
    if (!/(?=.*\d)/.test(password)) {
      return safeT('profile.passwordNumber', 'Password must contain at least one number');
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      return safeT('profile.passwordSpecial', 'Password must contain at least one special character');
    }
    return null;
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: safeT('profile.passwordMismatch', 'Passwords do not match'),
      });
      return;
    }

    const passwordError = validatePassword(passwordForm.newPassword);
    if (passwordError) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: passwordError,
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          visible: true,
          type: 'success',
          title: safeT('common.success'),
          message: safeT('profile.passwordChanged', 'Password changed successfully'),
        });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setNotification({
          visible: true,
          type: 'error',
          title: safeT('common.error'),
          message: result.error || safeT('profile.passwordChangeError', 'Failed to change password'),
        });
      }
    } catch (error) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: safeT('profile.passwordChangeError', 'Failed to change password'),
      });
    } finally {
      setIsChangingPassword(false);
    }
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
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} style={styles.cancelButton} onPress={onClose}>
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
        </View>

        <View style={styles.content}>
          <ScrollView 
            style={styles.scrollContainer} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
            {/* Profile Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
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
                {safeT('profile.changePassword', 'Change Password')}
              </Text>

              <View style={styles.passwordForm}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {safeT('profile.currentPassword', 'Current Password')}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={passwordForm.currentPassword}
                      onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                      placeholder={safeT('profile.enterCurrentPassword', 'Enter current password')}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      autoComplete="current-password"
                      textContentType="password"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {safeT('profile.newPassword', 'New Password')}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={passwordForm.newPassword}
                      onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                      placeholder={safeT('profile.enterNewPassword', 'Enter new password')}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      autoComplete="new-password"
                      textContentType="newPassword"
                      autoCorrect={false}
                    />
                    <Text style={styles.passwordRequirements}>
                      {safeT('profile.passwordRequirements', 'Min 8 chars, uppercase, lowercase, number, special char')}
                    </Text>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {safeT('profile.confirmPassword', 'Confirm Password')}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={passwordForm.confirmPassword}
                      onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                      placeholder={safeT('profile.confirmNewPassword', 'Confirm new password')}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      autoComplete="new-password"
                      textContentType="newPassword"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.passwordButtons}>
                    <TouchableOpacity activeOpacity={0.7} 
                      style={[styles.button, styles.cancelButton]} 
                      onPress={() => {
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                    >
                      <Text style={styles.cancelButtonText}>
                        {safeT('profile.clear', 'Clear')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.7} 
                      style={[styles.button, styles.saveButton]} 
                      onPress={handlePasswordChange}
                      disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    >
                      {isChangingPassword ? (
                        <ActivityIndicator size="small" color={colors.buttonText} />
                      ) : (
                        <Text style={styles.saveButtonText}>
                          {safeT('common.save', 'Save')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
              </View>
            </View>
          </ScrollView>
        </View>
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
    paddingBottom: 150,
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
    shadowColor: colors.shadow || '#000',
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
  changePasswordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  passwordForm: {
    marginTop: 0,
  },
  passwordRequirements: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  passwordButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});