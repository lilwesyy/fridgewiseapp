import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuthValidation } from '../hooks/useAuthValidation';
import { getAuthStyles } from '../styles';

interface TermsCheckboxProps {
  isChecked: boolean;
  onToggle: () => void;
}

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({ isChecked, onToggle }) => {
  const { colors } = useTheme();
  const { safeT } = useAuthValidation();
  const styles = getAuthStyles(colors, {});

  return (
    <View style={styles.checkboxContainer}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={onToggle}
      >
        <View style={[
          styles.checkboxBox,
          isChecked && styles.checkboxBoxChecked
        ]}>
          {isChecked && (
            <Ionicons name="checkmark" size={16} color={colors.buttonText} />
          )}
        </View>
        <Text style={styles.checkboxText}>
          {safeT('auth.acceptTerms')} 
          <Text style={styles.linkText}>{safeT('auth.termsAndConditions')}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};