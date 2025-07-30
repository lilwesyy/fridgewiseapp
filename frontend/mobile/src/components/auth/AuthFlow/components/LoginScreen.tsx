import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useAuthValidation } from '../hooks/useAuthValidation';
import { AnimatedContainer } from '../../../ui';
import { AuthHeader } from './AuthHeader';
import { FormInput } from './FormInput';
import { getAuthStyles } from '../styles';
import { AuthMode, LoginForm, FormValidation, NotificationProps } from '../types';

interface LoginScreenProps {
  onAuthModeChange: (mode: AuthMode) => void;
  onNotification: (notification: NotificationProps) => void;
  onEmailVerificationRequired: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onAuthModeChange,
  onNotification,
  onEmailVerificationRequired,
}) => {
  const { colors } = useTheme();
  const { login, sendEmailVerification } = useAuth();
  const { validateEmail, validateLoginPassword, safeT } = useAuthValidation();
  const styles = getAuthStyles(colors, {});

  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [validation, setValidation] = useState<FormValidation>({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' },
  });

  const handleFormChange = (field: keyof LoginForm, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    
    // Reset validation on change
    if (field === 'email') {
      setValidation(prev => ({ ...prev, email: { isValid: true, message: '' } }));
    } else if (field === 'password') {
      setValidation(prev => ({ ...prev, password: { isValid: true, message: '' } }));
    }
  };

  const handleLogin = async () => {
    const emailValidation = validateEmail(loginForm.email);
    const passwordValidation = validateLoginPassword(loginForm.password);

    setValidation({
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
        onEmailVerificationRequired(error.email || loginForm.email);
        try {
          await sendEmailVerification(error.email || loginForm.email);
        } catch (sendError) {
          console.error('Failed to send verification code:', sendError);
        }
      } else {
        if (error.message && error.message.toLowerCase().includes('invalid credentials')) {
          setValidation({
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

  const handleResetOnboarding = () => {
    Alert.alert(
      safeT('auth.resetOnboarding'),
      safeT('auth.resetOnboardingConfirm'),
      [
        {
          text: safeT('common.cancel'),
          style: 'cancel',
        },
        {
          text: safeT('common.ok'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('onboarding_completed');
              await AsyncStorage.removeItem('user_preferences');
              onNotification({
                visible: true,
                type: 'success',
                title: safeT('common.success'),
                message: safeT('auth.resetOnboardingSuccess'),
              });
            } catch (error) {
              onNotification({
                visible: true,
                type: 'error',
                title: safeT('common.error'),
                message: safeT('auth.resetOnboardingError'),
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <AnimatedContainer animationType="slideLeft">
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <AuthHeader
            title={safeT('auth.signIn')}
            onBack={() => onAuthModeChange('welcome')}
          />

          <View style={styles.authForm}>
            <FormInput
              label={safeT('auth.email')}
              value={loginForm.email}
              onChangeText={(text) => handleFormChange('email', text)}
              placeholder={safeT('auth.email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              validation={validation.email}
            />

            <FormInput
              label={safeT('auth.password')}
              value={loginForm.password}
              onChangeText={(text) => handleFormChange('password', text)}
              placeholder={safeT('auth.password')}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="current-password"
              onSubmitEditing={handleLogin}
              returnKeyType="go"
              validation={validation.password}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>{safeT('auth.signIn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => onAuthModeChange('forgot-password')}
            >
              <Text style={styles.linkButtonText}>
                {safeT('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => onAuthModeChange('register')}
            >
              <Text style={styles.linkButtonText}>
                {safeT('auth.dontHaveAccount')} {safeT('auth.register')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.linkButton, { marginTop: 20 }]}
              onPress={handleResetOnboarding}
            >
              <Text style={[styles.linkButtonText, { fontSize: 14, opacity: 0.7 }]}>
                {safeT('auth.resetOnboarding')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </AnimatedContainer>
    </SafeAreaView>
  );
};