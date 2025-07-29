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
  TouchableWithoutFeedback,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationModal, NotificationType } from '../modals/NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASING_CURVES } from '../../constants/animations';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { height: screenHeight } = Dimensions.get('window');

interface AccountInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, token, deleteAccount } = useAuth();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Animation values
  const headerOpacity = useSharedValue(0);

  // Animazioni per il modale di cancellazione dell'account
  const deleteSlideY = useSharedValue(screenHeight);
  const deleteOpacity = useSharedValue(0);
  const deletePulseScale = useSharedValue(1);


  useEffect(() => {
    if (visible) {
      // Reset animations when modal opens
      headerOpacity.value = 0;
      
      // iOS easing curve
      const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);
      
      // Entrance animations
      headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing });
    }
  }, [visible]);

  useEffect(() => {
    if (showDeleteModal) {
      const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);

      deletePulseScale.value = withRepeat(
        withTiming(1.3, { duration: ANIMATION_DURATIONS.MODAL, easing }),
        -1,
        true
      );
      deleteOpacity.value = 1;
      deleteSlideY.value = withSpring(0, SPRING_CONFIGS.MODAL);
    } else {
      const easing = Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2);

      deleteOpacity.value = withTiming(0, { duration: ANIMATION_DURATIONS.QUICK, easing });
      deleteSlideY.value = withTiming(screenHeight, { duration: ANIMATION_DURATIONS.QUICK, easing });
    }
  }, [showDeleteModal]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const deleteBackdropStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  const deleteModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: deleteSlideY.value }],
  }));

  const deletePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deletePulseScale.value }],
  }), [deletePulseScale]);

  const deletePulseHaloStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 48,
    backgroundColor: 'transparent',
    opacity: 0.6,
    transform: [{ scale: deletePulseScale.value }],
  }), [deletePulseScale]);

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
    const date = new Date(user.createdAt as string);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(i18n.language === 'it' ? 'it-IT' : 'en-US', options);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error', 'Error'),
        message: safeT('profile.passwordRequired', 'Password is required to delete account'),
      });
      return;
    }

    // Verifica che ci sia un token valido
    if (!token) {
      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error', 'Error'),
        message: safeT('auth.tokenExpired', 'Your session has expired. Please log in again.'),
      });
      return;
    }

    setShowDeleteModal(false);
    try {
      await deleteAccount(deletePassword);
      onClose();
      setDeletePassword(''); // Clear password
      setNotification({
        visible: true,
        type: 'success',
        title: safeT('profile.accountDeleted', 'Account Deleted'),
        message: safeT('profile.accountDeletedMessage', 'Your account has been successfully deleted.'),
      });
    } catch (error: any) {
      setDeletePassword(''); // Clear password on error

      // Gestisce errori specifici
      let errorMessage = safeT('profile.deleteAccountError', 'Failed to delete account. Please try again.');

      if (error?.message) {
        if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
          errorMessage = safeT('auth.unauthorized', 'You are not authorized to perform this action. Please log in again.');
        } else if (error.message.toLowerCase().includes('invalid password') || error.message.toLowerCase().includes('wrong password')) {
          errorMessage = safeT('profile.wrongPassword', 'The password you entered is incorrect.');
        } else {
          errorMessage = error.message;
        }
      }

      setNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error', 'Error'),
        message: errorMessage,
      });
    }
  };

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
            {safeT('profile.accountInfo', 'Account Information')}
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
              <View style={[styles.fieldContainer, { marginBottom: 0 }]}>
                <Text style={styles.fieldLabel}>
                  {safeT('profile.memberSince', 'Member since')}
                </Text>
                <Text style={styles.fieldValue}>
                  {getMemberSinceDate()}
                </Text>
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
                    onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
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
                    onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
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
                    onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
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

            {/* Danger Zone */}
            <View style={[styles.section, styles.dangerSection]}>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <Text style={styles.dangerButtonText}>
                  {safeT('profile.deleteAccount', 'Delete Account')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.dangerWarning}>
                {safeT('profile.deleteAccountWarning', 'This action cannot be undone. All your data will be permanently deleted.')}
              </Text>
            </View>
        </ScrollView>
      </SafeAreaView>

      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        transparent
        visible={showDeleteModal}
        animationType="none"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setDeletePassword('');
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowDeleteModal(false);
          setDeletePassword('');
        }}>
          <Animated.View style={[styles.deleteBackdrop, deleteBackdropStyle]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <TouchableWithoutFeedback>
                <Animated.View style={[styles.deleteModal, deleteModalStyle]}>
                  <View style={styles.deleteHandle} />
                  <View style={styles.deleteHeader}>
                    <View style={styles.deleteIconContainer}>
                      <Animated.View style={deletePulseHaloStyle} />
                      <Animated.View style={deletePulseStyle}>
                        <Ionicons name="trash" size={48} color={colors.error} />
                      </Animated.View>
                    </View>
                    <Text style={styles.deleteTitle}>
                      {safeT('profile.confirmDeleteTitle', 'Delete Account')}
                    </Text>
                    <Text style={styles.deleteMessage}>
                      {safeT('profile.confirmDeleteMessage', 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.')}
                    </Text>
                  </View>

                  {/* Password Field */}
                  <View style={styles.deletePasswordSection}>
                    <Text style={styles.deletePasswordLabel}>
                      {safeT('profile.enterPasswordToConfirm', 'Enter your password to confirm:')}
                    </Text>
                    <TextInput
                      style={styles.deletePasswordInput}
                      value={deletePassword}
                      onChangeText={setDeletePassword}
                      placeholder={safeT('profile.enterPassword', 'Enter password')}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      autoComplete="current-password"
                      textContentType="password"
                      returnKeyType="done"
                    />
                  </View>

                  <View style={styles.deleteActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles.deleteCancelButton, { marginRight: 6 }]}
                      onPress={() => {
                        setShowDeleteModal(false);
                        setDeletePassword('');
                      }}
                    >
                      <Text style={styles.deleteCancelButtonText}>
                        {safeT('common.cancel', 'Cancel')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles.deleteConfirmButton, { marginLeft: 6 }]}
                      onPress={confirmDeleteAccount}
                    >
                      <Text style={styles.deleteConfirmButtonText}>
                        {safeT('profile.deleteAccount', 'Delete Account')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
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
  // Danger Zone Styles
  dangerSection: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  dangerTitle: {
    color: '#ef4444',
    fontSize: 18,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerWarning: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Delete Modal Styles (replicating DeleteConfirmationModal design)
  deleteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  deleteModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    maxHeight: '90%',
  },
  deleteHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  deleteHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  deletePasswordSection: {
    width: '100%',
    marginBottom: 20,
  },
  deletePasswordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'left',
  },
  deletePasswordInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    width: '100%',
  },
  deleteActionsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 0,
    marginBottom: Platform.OS === 'ios' ? 8 : 16,
    alignItems: 'stretch',
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.buttonText,
  },
});