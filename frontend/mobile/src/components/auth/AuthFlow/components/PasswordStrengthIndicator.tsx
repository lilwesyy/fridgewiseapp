import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuthValidation } from '../hooks/useAuthValidation';
import { getAuthStyles } from '../styles';

interface PasswordStrengthIndicatorProps {
  strength: number;
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  strength,
  password,
}) => {
  const { colors } = useTheme();
  const { getPasswordStrengthText } = useAuthValidation();
  const styles = getAuthStyles(colors, {});

  if (password.length === 0) {
    return null;
  }

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return colors.error;
    if (strength <= 3) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.passwordStrengthContainer}>
      <View style={styles.passwordStrengthBar}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.passwordStrengthSegment,
              {
                backgroundColor: level <= strength
                  ? getStrengthColor(strength)
                  : colors.border
              }
            ]}
          />
        ))}
      </View>
      <Text style={[
        styles.passwordStrengthText,
        { color: getStrengthColor(strength) }
      ]}>
        {getPasswordStrengthText(strength)}
      </Text>
    </View>
  );
};