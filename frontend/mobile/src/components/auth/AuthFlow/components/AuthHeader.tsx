import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuthValidation } from '../hooks/useAuthValidation';
import { getAuthStyles } from '../styles';
import { AuthMode } from '../types';

interface AuthHeaderProps {
  title: string;
  onBack: () => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, onBack }) => {
  const { colors } = useTheme();
  const { safeT } = useAuthValidation();
  const styles = getAuthStyles(colors, {});

  return (
    <View style={styles.authHeader}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backButtonText}>{String(`← ${safeT('common.back')}`)}</Text>
      </TouchableOpacity>
      <Text style={styles.authTitle}>{title}</Text>
    </View>
  );
};