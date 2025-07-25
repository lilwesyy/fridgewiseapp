import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useDailyUsage } from '../hooks/useDailyUsage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface DailyUsageIndicatorProps {
  type?: 'recipeGeneration' | 'aiChat' | 'imageAnalysis';
  showText?: boolean;
}

export const DailyUsageIndicator: React.FC<DailyUsageIndicatorProps> = ({
  type = 'recipeGeneration',
  showText = true
}) => {
  const { colors } = useTheme();
  const { usage, isLoading } = useDailyUsage();
  const { user } = useAuth();
  const { t } = useTranslation();

  if (isLoading || !usage) {
    return null;
  }

  let usageData;
  let label;

  switch (type) {
    case 'recipeGeneration':
      usageData = usage.recipeGenerations;
      label = t('usage.recipeGenerations', 'Recipe Generations');
      break;
    case 'aiChat':
      usageData = usage.aiChatMessages;
      label = t('usage.aiChatMessages', 'AI Messages');
      break;
    case 'imageAnalysis':
      usageData = usage.imageAnalyses;
      label = t('usage.imageAnalyses', 'Image Analyses');
      break;
  }

  const isAdmin = user?.role === 'admin';
  const percentage = isAdmin ? 0 : (usageData.used / usageData.limit) * 100;
  const isNearLimit = !isAdmin && percentage > 80;
  const isAtLimit = !isAdmin && usageData.remaining === 0;

  const styles = getStyles(colors, isNearLimit, isAtLimit, isAdmin);

  return (
    <View style={styles.container}>
      {showText && (
        <Text style={styles.label}>
          {isAdmin 
            ? `${label}: ${t('usage.unlimited', 'Unlimited')} (Admin)`
            : `${label}: ${usageData.used}/${usageData.limit}`
          }
        </Text>
      )}
      {!isAdmin && (
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${Math.min(percentage, 100)}%` }
            ]} 
          />
        </View>
      )}
      {isAdmin && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminText}>∞</Text>
        </View>
      )}
      {showText && !isAdmin && usageData.remaining > 0 && (
        <Text style={styles.remaining}>
          {usageData.remaining} {t('usage.remaining')}
        </Text>
      )}
      {showText && isAtLimit && (
        <Text style={styles.limitReached}>
          {t('usage.limitReached', 'Daily limit reached')}
        </Text>
      )}
    </View>
  );
};

const getStyles = (colors: any, isNearLimit: boolean, isAtLimit: boolean, isAdmin?: boolean) => StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: isAdmin ? colors.primary : colors.text,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.inputBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: isAtLimit 
      ? colors.error || '#ef4444'
      : isNearLimit 
        ? colors.warning || '#f59e0b'
        : colors.success || '#10b981',
    borderRadius: 3,
  },
  adminBadge: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.buttonText || '#fff',
    textAlign: 'center',
  },
  remaining: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  limitReached: {
    fontSize: 12,
    color: colors.error || '#ef4444',
    fontWeight: '600',
    marginTop: 2,
  },
});