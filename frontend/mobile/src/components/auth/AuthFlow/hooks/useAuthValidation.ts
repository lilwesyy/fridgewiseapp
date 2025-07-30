import { useTranslation } from 'react-i18next';
import { ValidationResult } from '../types';

export const useAuthValidation = () => {
  const { t } = useTranslation();

  // Safety wrapper for translations
  const safeT = (key: string, fallback?: string) => {
    try {
      const result = t(key);
      if (typeof result === 'string' && result !== key) {
        return result;
      }
      return fallback || key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return fallback || key;
    }
  };

  const validateName = (name: string): ValidationResult => {
    if (!name.trim()) {
      return { isValid: false, message: safeT('validation.nameRequired') };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: safeT('validation.nameTooShort') };
    }
    return { isValid: true, message: '' };
  };

  const validateEmail = (email: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return { isValid: false, message: safeT('validation.emailRequired') };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: safeT('validation.emailInvalid') };
    }
    return { isValid: true, message: '' };
  };

  const validatePassword = (password: string): ValidationResult => {
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

  const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
    if (!confirmPassword) {
      return { isValid: false, message: safeT('validation.confirmPasswordRequired') };
    }
    if (password !== confirmPassword) {
      return { isValid: false, message: safeT('validation.passwordsDoNotMatch') };
    }
    return { isValid: true, message: '' };
  };

  const validateLoginPassword = (password: string): ValidationResult => {
    if (!password) {
      return { isValid: false, message: safeT('validation.passwordRequired') };
    }
    return { isValid: true, message: '' };
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength <= 2) return safeT('auth.passwordWeak');
    if (strength <= 3) return safeT('auth.passwordMedium');
    return safeT('auth.passwordStrong');
  };

  return {
    validateName,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateLoginPassword,
    getPasswordStrengthText,
    safeT,
  };
};