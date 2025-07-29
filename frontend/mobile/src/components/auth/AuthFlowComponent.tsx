import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { OTPInput, AnimatedContainer } from '../ui';
import { LogoComponent } from '../ui/LogoComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface AuthFlowComponentProps {
  onNotification: (notification: {
    visible: boolean;
    type: 'error' | 'success' | 'warning';
    title: string;
    message: string;
  }) => void;
}

type AuthMode = 'welcome' | 'login' | 'register' | 'forgot-password' | 'verify-code' | 'reset-password' | 'verify-email';

const AuthFlowComponent: React.FC<AuthFlowComponentProps> = ({ onNotification }) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { login, register, logout, forgotPassword, resetPassword, sendEmailVerification, verifyEmail } = useAuth();
  const { isDarkMode, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [authMode, setAuthMode] = useState<AuthMode>('welcome');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [emailVerificationForm, setEmailVerificationForm] = useState({ email: '', token: '' });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: '' });
  const [verifyCodeForm, setVerifyCodeForm] = useState({ email: '', code: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmNewPassword: '' });

  const [validation, setValidation] = useState({
    name: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '', strength: 0 },
    confirmPassword: { isValid: false, message: '' },
  });

  const [loginValidation, setLoginValidation] = useState({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' },
  });

  // Safety wrapper for translations
  const safeT = (key: string, fallback?: string) => {
    try {
      const result = t(key);
      // Check if translation exists and is not just the key
      if (typeof result === 'string' && result !== key) {
        return result;
      }
      return fallback || key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return fallback || key;
    }
  };

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) {
      return { isValid: false, message: safeT('validation.nameRequired') };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: safeT('validation.nameTooShort') };
    }
    return { isValid: true, message: '' };
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return { isValid: false, message: safeT('validation.emailRequired') };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: safeT('validation.emailInvalid') };
    }
    return { isValid: true, message: '' };
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return { isValid: false, message: safeT('validation.passwordRequired'), strength: 0 };
    }
    if (password.length < 8) {
      return { isValid: false, message: safeT('validation.passwordTooShort'), strength: 1 };
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const isValid = strength >= 3;
    const message = isValid ? '' : safeT('validation.passwordWeak');

    return { isValid, message, strength };
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (!confirmPassword) {
      return { isValid: false, message: safeT('validation.confirmPasswordRequired') };
    }
    if (password !== confirmPassword) {
      return { isValid: false, message: safeT('validation.passwordsDoNotMatch') };
    }
    return { isValid: true, message: '' };
  };

  const validateLoginEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return { isValid: false, message: safeT('validation.emailRequired') };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: safeT('validation.emailInvalid') };
    }
    return { isValid: true, message: '' };
  };

  const validateLoginPassword = (password: string) => {
    if (!password) {
      return { isValid: false, message: safeT('validation.passwordRequired') };
    }
    return { isValid: true, message: '' };
  };

  // Form handlers
  const handleLoginFormChange = (field: string, value: string) => {
    const newForm = { ...loginForm, [field]: value };
    setLoginForm(newForm);

    if (field === 'email') {
      setLoginValidation(prev => ({ ...prev, email: { isValid: true, message: '' } }));
    } else if (field === 'password') {
      setLoginValidation(prev => ({ ...prev, password: { isValid: true, message: '' } }));
    }
  };

  const handleRegisterFormChange = (field: string, value: string | boolean) => {
    const newForm = { ...registerForm, [field]: value };
    setRegisterForm(newForm);

    if (field === 'name') {
      setValidation(prev => ({ ...prev, name: validateName(value as string) }));
    } else if (field === 'email') {
      setValidation(prev => ({ ...prev, email: validateEmail(value as string) }));
    } else if (field === 'password') {
      const passwordValidation = validatePassword(value as string);
      const confirmPasswordValidation = validateConfirmPassword(value as string, newForm.confirmPassword);
      setValidation(prev => ({
        ...prev,
        password: passwordValidation,
        confirmPassword: confirmPasswordValidation
      }));
    } else if (field === 'confirmPassword') {
      setValidation(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(newForm.password, value as string)
      }));
    }
  };

  // Action handlers
  const handleLogin = async () => {
    const emailValidation = validateLoginEmail(loginForm.email);
    const passwordValidation = validateLoginPassword(loginForm.password);

    setLoginValidation({
      email: emailValidation,
      password: passwordValidation,
    });

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      return;
    }

    try {
      await login(loginForm.email, loginForm.password);
    } catch (error: any) {
      if (error.requireEmailVerification) {
        setEmailVerificationForm({ email: error.email || loginForm.email, token: '' });
        setAuthMode('verify-email');
        try {
          await sendEmailVerification(error.email || loginForm.email);
        } catch (sendError) {
          console.error('Failed to send verification code:', sendError);
        }
      } else {
        if (error.message && error.message.toLowerCase().includes('invalid credentials')) {
          setLoginValidation({
            email: { isValid: false, message: safeT('auth.loginError') },
            password: { isValid: false, message: safeT('auth.loginError') },
          });
        } else {
          onNotification({
            visible: true,
            type: 'error',
            title: safeT('common.error'),
            message: error.message,
          });
        }
      }
    }
  };

  const handleRegister = async () => {
    const nameValidation = validateName(registerForm.name);
    const emailValidation = validateEmail(registerForm.email);
    const passwordValidation = validatePassword(registerForm.password);
    const confirmPasswordValidation = validateConfirmPassword(registerForm.password, registerForm.confirmPassword);

    setValidation({
      name: nameValidation,
      email: emailValidation,
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation,
    });

    if (!nameValidation.isValid || !emailValidation.isValid || !passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      onNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: safeT('validation.fixErrors'),
      });
      return;
    }

    if (!registerForm.acceptTerms) {
      onNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: safeT('validation.acceptTermsRequired'),
      });
      return;
    }

    try {
      let preferredLanguage: 'en' | 'it' = 'en';
      let dietaryRestrictions: string[] = [];

      try {
        const savedPreferences = await AsyncStorage.getItem('user_preferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          preferredLanguage = preferences.preferredLanguage || (i18nInstance?.language as 'en' | 'it') || 'en';
          dietaryRestrictions = preferences.dietaryRestrictions || [];
        } else {
          preferredLanguage = (i18nInstance?.language as 'en' | 'it') || 'en';
        }
      } catch (error) {
        preferredLanguage = (i18nInstance?.language as 'en' | 'it') || 'en';
      }

      await register(registerForm.email, registerForm.password, registerForm.name, preferredLanguage, dietaryRestrictions);

      setEmailVerificationForm({ email: registerForm.email, token: '' });
      await sendEmailVerification(registerForm.email);
      setAuthMode('verify-email');

    } catch (error: any) {
      onNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message,
      });
    }
  };

  // Additional handlers for forgot password, email verification, etc.
  // (Implementation would continue here with the rest of the auth handlers)

  const styles = getStyles(colors, insets);

  if (authMode === 'welcome') {
    return (
      <>
        <SafeAreaView style={styles.welcomeContainer}>
          <AnimatedContainer animationType="staggered">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.welcomeHeader}>
                <View style={styles.logoSection}>
                  <LogoComponent width={120} height={108} />
                  <Text style={styles.welcomeTitle}>FridgeWise</Text>
                  <Text style={styles.welcomeTagline}>Smart. Simple. Delicious.</Text>
                </View>
                <Text style={styles.welcomeSubtitle}>
                  {safeT('home.subtitle')}
                </Text>
              </View>
            </ScrollView>
          </AnimatedContainer>
        </SafeAreaView>

        <AnimatedContainer animationType="slideUp" delay={150}>
          <View style={[styles.fixedBottomButtons, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setAuthMode('register')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{safeT('auth.register')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setAuthMode('login')}
            >
              <Text style={styles.secondaryButtonText}>{safeT('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </AnimatedContainer>
      </>
    );
  }

  if (authMode === 'login') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <AnimatedContainer animationType="slideLeft">
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setAuthMode('welcome')}
              >
                <Text style={styles.backButtonText}>{String(`← ${safeT('common.back')}`)}</Text>
              </TouchableOpacity>
              <Text style={styles.authTitle}>{safeT('auth.signIn')}</Text>
            </View>

            <View style={styles.authForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.email')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      !loginValidation.email.isValid ? styles.inputError : null
                    ]}
                    value={loginForm.email}
                    onChangeText={(text) => handleLoginFormChange('email', text)}
                    placeholder={safeT('auth.email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    autoComplete="email"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                {!loginValidation.email.isValid && (
                  <Text style={styles.errorText}>{loginValidation.email.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{safeT('auth.password')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      !loginValidation.password.isValid ? styles.inputError : null
                    ]}
                    value={loginForm.password}
                    onChangeText={(text) => handleLoginFormChange('password', text)}
                    placeholder={safeT('auth.password')}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    autoComplete="current-password"
                    placeholderTextColor={colors.textSecondary}
                    onSubmitEditing={handleLogin}
                    returnKeyType="go"
                  />
                </View>
                {!loginValidation.password.isValid && (
                  <Text style={styles.errorText}>{loginValidation.password.message}</Text>
                )}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>{safeT('auth.signIn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setAuthMode('forgot-password')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setAuthMode('register')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.dontHaveAccount')} {safeT('auth.register')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </AnimatedContainer>
      </SafeAreaView>
    );
  }

  // For now, return a simple placeholder for other auth modes
  // In a complete implementation, you would add all the other auth screens here
  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.authTitle}>Auth Mode: {authMode}</Text>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => setAuthMode('welcome')}
        >
          <Text style={styles.primaryButtonText}>Back to Welcome</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, insets: any) => StyleSheet.create({
  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  welcomeTagline: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
    fontFamily: 'System',
  },

  // Fixed Bottom Buttons
  fixedBottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: colors.buttonText,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Auth Screens
  authContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  authHeader: {
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  backButton: {
    marginBottom: 32,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'System',
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },

  // Form
  authForm: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    fontFamily: 'System',
    elevation: 1,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontFamily: 'System',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default AuthFlowComponent;