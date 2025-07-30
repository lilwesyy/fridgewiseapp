import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useAuthValidation } from '../hooks/useAuthValidation';
import { AnimatedContainer } from '../../../ui';
import { AuthHeader } from './AuthHeader';
import { FormInput } from './FormInput';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { TermsCheckbox } from './TermsCheckbox';
import { getAuthStyles } from '../styles';
import { AuthMode, RegisterForm, FormValidation, NotificationProps } from '../types';

interface RegisterScreenProps {
  onAuthModeChange: (mode: AuthMode) => void;
  onNotification: (notification: NotificationProps) => void;
  onEmailVerificationRequired: (email: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onAuthModeChange,
  onNotification,
  onEmailVerificationRequired,
}) => {
  const { colors } = useTheme();
  const { i18n: i18nInstance } = useTranslation();
  const { register, sendEmailVerification } = useAuth();
  const { 
    validateName, 
    validateEmail, 
    validatePassword, 
    validateConfirmPassword, 
    safeT 
  } = useAuthValidation();
  const styles = getAuthStyles(colors, {});

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [validation, setValidation] = useState<FormValidation>({
    name: { isValid: true, message: '' },
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '', strength: 0 },
    confirmPassword: { isValid: true, message: '' },
  });

  const handleFormChange = (field: keyof RegisterForm, value: string | boolean) => {
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

      onEmailVerificationRequired(registerForm.email);
      await sendEmailVerification(registerForm.email);

    } catch (error: any) {
      onNotification({
        visible: true,
        type: 'error',
        title: safeT('common.error'),
        message: error.message,
      });
    }
  };

  const isFormValid = 
    validation.name.isValid && 
    validation.email.isValid && 
    validation.password.isValid && 
    validation.confirmPassword.isValid && 
    registerForm.acceptTerms;

  return (
    <SafeAreaView style={styles.authContainer}>
      <AnimatedContainer animationType="slideLeft">
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <AuthHeader
            title={safeT('auth.createAccount')}
            onBack={() => onAuthModeChange('welcome')}
          />

          <View style={styles.authForm}>
            <FormInput
              label={safeT('auth.name')}
              value={registerForm.name}
              onChangeText={(text) => handleFormChange('name', text)}
              placeholder={safeT('auth.name')}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              autoComplete="name"
              validation={validation.name}
              showError={validation.name.message !== ''}
            />

            <FormInput
              label={safeT('auth.email')}
              value={registerForm.email}
              onChangeText={(text) => handleFormChange('email', text)}
              placeholder={safeT('auth.email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              validation={validation.email}
              showError={validation.email.message !== ''}
            />

            <View>
              <FormInput
                label={safeT('auth.password')}
                value={registerForm.password}
                onChangeText={(text) => handleFormChange('password', text)}
                placeholder={safeT('auth.password')}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                validation={validation.password}
                showError={validation.password.message !== ''}
              />
              <PasswordStrengthIndicator
                strength={validation.password.strength || 0}
                password={registerForm.password}
              />
            </View>

            <FormInput
              label={safeT('auth.confirmPassword')}
              value={registerForm.confirmPassword}
              onChangeText={(text) => handleFormChange('confirmPassword', text)}
              placeholder={safeT('auth.confirmPassword')}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"  
              autoComplete="new-password"
              validation={validation.confirmPassword}
              showError={validation.confirmPassword.message !== ''}
            />

            <TermsCheckbox
              isChecked={registerForm.acceptTerms}
              onToggle={() => handleFormChange('acceptTerms', !registerForm.acceptTerms)}
            />

            <TouchableOpacity 
              style={[
                styles.primaryButton,
                !isFormValid && styles.primaryButtonDisabled
              ]} 
              onPress={handleRegister}
              disabled={!isFormValid}
            >
              <Text style={[
                styles.primaryButtonText,
                !isFormValid && styles.primaryButtonTextDisabled
              ]}>
                {safeT('auth.createAccount')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => onAuthModeChange('login')}
            >
              <Text style={styles.linkButtonText}>
                {safeT('auth.alreadyHaveAccount')} {safeT('auth.signIn')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </AnimatedContainer>
    </SafeAreaView>
  );
};