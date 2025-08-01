import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useAuthValidation } from '../hooks/useAuthValidation';
import { AnimatedContainer } from '../../../ui';
import { AuthHeader } from './AuthHeader';
import { FormInput } from './FormInput';
import { OTPInput } from '../../../ui/OTPInput';
import { getAuthStyles } from '../styles';
import { AuthMode, FormValidation, NotificationProps } from '../types';

interface ForgotPasswordScreenProps {
  onAuthModeChange: (mode: AuthMode) => void;
  onNotification: (notification: NotificationProps) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onAuthModeChange,
  onNotification,
}) => {
  const { colors } = useTheme();
  const { forgotPassword, verifyResetToken, resetPassword } = useAuth();
  const { validateEmail, validatePassword, safeT } = useAuthValidation();
  const styles = getAuthStyles(colors, {});

  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [resetForm, setResetForm] = useState({
    token: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [validation, setValidation] = useState<FormValidation>({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' },
    confirmPassword: { isValid: true, message: '' },
  });

  const handleSendResetCode = async () => {
    const emailValidation = validateEmail(email);
    setValidation({ ...validation, email: emailValidation });

    if (!emailValidation.isValid) {
      return;
    }

    try {
      await forgotPassword(email);
      onNotification({
        visible: true,
        type: 'success',
        title: safeT('common.success'),
        message: safeT('auth.resetPasswordSuccess'),
      });
      setStep('verify');
    } catch (error: any) {
      onNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message || safeT('auth.resetPasswordError'),
      });
    }
  };

  const handleVerifyOTP = async () => {
    if (resetForm.token.length !== 6) {
      return;
    }

    try {
      await verifyResetToken(resetForm.token);
      setStep('reset');
    } catch (error: any) {
      onNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message || safeT('auth.otpVerificationFailed'),
      });
    }
  };

  const handleResetPassword = async () => {
    const passwordValidation = validatePassword(resetForm.newPassword);
    const confirmPasswordValidation = resetForm.newPassword === resetForm.confirmPassword
      ? { isValid: true, message: '' }
      : { isValid: false, message: safeT('auth.passwordMismatch') };

    setValidation({
      ...validation,
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation,
    });

    if (!passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      return;
    }

    try {
      await resetPassword(resetForm.token, resetForm.newPassword);
      onNotification({
        visible: true,
        type: 'success',
        title: safeT('common.success'),
        message: safeT('auth.passwordResetSuccess'),
      });
      onAuthModeChange('login');
    } catch (error: any) {
      // If the token is invalid, go back to verify step
      setStep('verify');
      onNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message || safeT('auth.invalidResetToken'),
      });
    }
  };

  const handleResendCode = async () => {
    try {
      await forgotPassword(email);
      onNotification({
        visible: true,
        type: 'success',
        title: safeT('common.success'),
        message: safeT('auth.resetPasswordSuccess'),
      });
    } catch (error: any) {
      onNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message || safeT('auth.resetPasswordError'),
      });
    }
  };

  if (step === 'email') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <AnimatedContainer animationType="slideLeft">
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <AuthHeader
              title={safeT('auth.resetPassword')}
              onBack={() => onAuthModeChange('login')}
            />

            <View style={styles.authForm}>
              <Text style={styles.authSubtitle}>
                {safeT('auth.resetPasswordInstructions')}
              </Text>

              <FormInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setValidation({ ...validation, email: { isValid: true, message: '' } });
                }}
                placeholder={safeT('auth.email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                validation={validation.email}
              />

              <TouchableOpacity style={styles.primaryButton} onPress={handleSendResetCode}>
                <Text style={styles.primaryButtonText}>{safeT('auth.sendResetCode', 'Send Reset Code')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => onAuthModeChange('login')}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.backToLogin', 'Back to Login')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </AnimatedContainer>
      </SafeAreaView>
    );
  }

  if (step === 'verify') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <AnimatedContainer animationType="slideLeft">
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <AuthHeader
              title={safeT('auth.verifyCode', 'Verify Code')}
              onBack={() => setStep('email')}
            />

            <View style={styles.authForm}>
              <Text style={styles.authSubtitle}>
                {safeT('auth.enterResetCode', 'Enter the reset code sent to your email')}
              </Text>
              <Text style={styles.emailAddress}>{email}</Text>

              <View style={styles.otpContainer}>
                <OTPInput
                  length={6}
                  value={resetForm.token}
                  onChange={(code) => setResetForm({ ...resetForm, token: code })}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.primaryButton,
                  resetForm.token.length !== 6 && styles.primaryButtonDisabled
                ]} 
                onPress={handleVerifyOTP}
                disabled={resetForm.token.length !== 6}
              >
                <Text style={[
                  styles.primaryButtonText,
                  resetForm.token.length !== 6 && styles.primaryButtonTextDisabled
                ]}>
                  {safeT('auth.verifyCode', 'Verify Code')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={handleResendCode}
              >
                <Text style={styles.linkButtonText}>
                  {safeT('auth.resendCode', 'Resend reset code')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </AnimatedContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.authContainer}>
      <AnimatedContainer animationType="slideLeft">
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <AuthHeader
            title={safeT('auth.resetPassword')}
            onBack={() => setStep('verify')}
          />

          <View style={styles.authForm}>
            <Text style={styles.authSubtitle}>
              {safeT('auth.newPasswordInstructions', 'Enter your new password')}
            </Text>

            <FormInput
              value={resetForm.newPassword}
              onChangeText={(value) => {
                setResetForm({ ...resetForm, newPassword: value });
                setValidation({ ...validation, password: { isValid: true, message: '' } });
              }}
              placeholder={safeT('auth.newPassword')}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              validation={validation.password}
            />

            <FormInput
              value={resetForm.confirmPassword}
              onChangeText={(value) => {
                setResetForm({ ...resetForm, confirmPassword: value });
                setValidation({ ...validation, confirmPassword: { isValid: true, message: '' } });
              }}
              placeholder={safeT('auth.confirmPassword')}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              validation={validation.confirmPassword}
              onSubmitEditing={handleResetPassword}
              returnKeyType="go"
            />

            <TouchableOpacity 
              style={[
                styles.primaryButton,
                (!resetForm.newPassword || !resetForm.confirmPassword) && styles.primaryButtonDisabled
              ]} 
              onPress={handleResetPassword}
              disabled={!resetForm.newPassword || !resetForm.confirmPassword}
            >
              <Text style={[
                styles.primaryButtonText,
                (!resetForm.newPassword || !resetForm.confirmPassword) && styles.primaryButtonTextDisabled
              ]}>
                {safeT('auth.resetPassword')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={handleResendCode}
            >
              <Text style={styles.linkButtonText}>
                {safeT('auth.resendCode', 'Resend reset code')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </AnimatedContainer>
    </SafeAreaView>
  );
};