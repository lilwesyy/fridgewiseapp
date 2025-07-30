import React, { useState } from 'react';
import { View, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { WelcomeScreen, LoginScreen, RegisterScreen, AuthHeader } from './components';
import { OTPInput } from '../../ui/OTPInput';
import { AnimatedContainer } from '../../ui';
import { getAuthStyles } from './styles';
import { AuthMode, AuthFlowComponentProps } from './types';

export const AuthFlowComponent: React.FC<AuthFlowComponentProps> = ({ onNotification, initialMode = 'welcome' }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { sendEmailVerification, verifyEmail } = useAuth();
  const insets = useSafeAreaInsets();
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [emailVerificationEmail, setEmailVerificationEmail] = useState('');
  const [emailVerificationForm, setEmailVerificationForm] = useState({
    email: '',
    token: ''
  });
  const styles = getAuthStyles(colors, {});

  const handleAuthModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
  };

  const handleEmailVerificationRequired = (email: string) => {
    setEmailVerificationEmail(email);
    setEmailVerificationForm({ email, token: '' });
    setAuthMode('verify-email');
  };

  const handleEmailVerification = async () => {
    try {
      await verifyEmail(emailVerificationForm.email, emailVerificationForm.token);
      
      onNotification({
        visible: true,
        type: 'success',
        title: t('auth.verificationSuccess'),
        message: t('auth.verificationSuccessMessage'),
      });

      // Clear forms - user will be automatically logged in or go to login
      setEmailVerificationForm({ email: '', token: '' });
      setAuthMode('login');
    } catch (error: any) {
      onNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: error.message || t('auth.invalidVerificationCode'),
      });
    }
  };

  const handleResendVerificationCode = async () => {
    try {
      await sendEmailVerification(emailVerificationForm.email);
      onNotification({
        visible: true,
        type: 'success',
        title: t('auth.codeSent'),
        message: t('auth.verificationCodeSent'),
      });
    } catch (error: any) {
      onNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: error.message || t('auth.resendError'),
      });
    }
  };

  switch (authMode) {
    case 'welcome':
      return (
        <WelcomeScreen 
          onAuthModeChange={handleAuthModeChange}
        />
      );

    case 'login':
      return (
        <LoginScreen
          onAuthModeChange={handleAuthModeChange}
          onNotification={onNotification}
          onEmailVerificationRequired={handleEmailVerificationRequired}
        />
      );

    case 'register':
      return (
        <RegisterScreen
          onAuthModeChange={handleAuthModeChange}
          onNotification={onNotification}
          onEmailVerificationRequired={handleEmailVerificationRequired}
        />
      );

    case 'verify-email':
      return (
        <SafeAreaView style={styles.authContainer}>
          <AnimatedContainer animationType="slideLeft">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <AuthHeader
              title={t('auth.verifyEmail')}
              onBack={() => setAuthMode('login')}
            />

            <View style={styles.authForm}>
              <Text style={styles.authSubtitle}>
                {t('auth.verifyEmailInstructions')}
              </Text>
              <Text style={styles.emailAddress}>{emailVerificationForm.email}</Text>
              <View style={styles.otpContainer}>
                <OTPInput
                  length={6}
                  value={emailVerificationForm.token}
                  onChange={(code) => setEmailVerificationForm({ ...emailVerificationForm, token: code })}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.primaryButton,
                  emailVerificationForm.token.length !== 6 && styles.primaryButtonDisabled
                ]} 
                onPress={handleEmailVerification}
                disabled={emailVerificationForm.token.length !== 6}
              >
                <Text style={[
                  styles.primaryButtonText,
                  emailVerificationForm.token.length !== 6 && styles.primaryButtonTextDisabled
                ]}>
                  {t('auth.verifyEmail', 'Verify Email')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={handleResendVerificationCode}
              >
                <Text style={styles.linkButtonText}>
                  {t('auth.resendCode', 'Resend verification code')}
                </Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </AnimatedContainer>
        </SafeAreaView>
      );

    // Placeholder for other auth modes
    // In a complete implementation, you would add components for:
    // - forgot-password
    // - verify-code
    // - reset-password
    default:
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
  }
};