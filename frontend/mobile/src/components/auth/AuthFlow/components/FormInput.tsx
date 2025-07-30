import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAuthStyles } from '../styles';
import { ValidationResult } from '../types';

interface FormInputProps extends TextInputProps {
  label: string;
  validation?: ValidationResult;
  showError?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  validation,
  showError = true,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = getAuthStyles(colors, {});

  const hasError = validation && !validation.isValid && showError;

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            hasError ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
      </View>
      {hasError && validation?.message && (
        <Text style={styles.errorText}>{validation.message}</Text>
      )}
    </View>
  );
};