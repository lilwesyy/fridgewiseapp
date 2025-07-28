import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export type TabName = 'home' | 'camera' | 'recipes' | 'saved' | 'profile';

interface BottomNavigationProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TabIcon: React.FC<{ name: TabName; isActive: boolean; colors: any }> = ({ name, isActive, colors }) => {
  const iconColor = isActive ? colors.primary : colors.textSecondary;
  const size = Platform.OS === 'ios' ? 26 : 24;

  // Use filled icons when active for iOS-style behavior
  switch (name) {
    case 'home':
      return <Ionicons name={isActive ? "home" : "home-outline"} size={size} color={iconColor} />;

    case 'camera':
      return <Ionicons name={isActive ? "camera" : "camera-outline"} size={size} color={iconColor} />;

    case 'recipes':
      return <Ionicons name={isActive ? "restaurant" : "restaurant-outline"} size={size} color={iconColor} />;

    case 'saved':
      return <Ionicons name={isActive ? "bookmark" : "bookmark-outline"} size={size} color={iconColor} />;

    case 'profile':
      return <Ionicons name={isActive ? "person" : "person-outline"} size={size} color={iconColor} />;

    default:
      return null;
  }
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const { t } = useTranslation();
  const { colors, isHighContrast } = useTheme();
  const styles = getStyles(colors, isHighContrast);

  const tabs: { key: TabName; label: string }[] = [
    { key: 'home', label: t('navigation.home') },
    { key: 'camera', label: t('navigation.camera') },
    { key: 'recipes', label: t('navigation.recipes') },
    { key: 'saved', label: t('navigation.saved') },
    { key: 'profile', label: t('navigation.profile') },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => onTabPress(tab.key)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: activeTab === tab.key }}
          accessibilityHint={`Navigate to ${tab.label} screen`}
        >
          <View style={styles.iconContainer}>
            <TabIcon name={tab.key} isActive={activeTab === tab.key} colors={colors} />
          </View>
          <Text style={[styles.label, activeTab === tab.key && styles.activeLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const getStyles = (colors: any, isHighContrast?: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'ios' ? colors.surface + 'F5' : colors.surface, // iOS blur effect
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : (isHighContrast ? 2 : 1),
    borderTopColor: Platform.OS === 'ios' ? colors.border + '80' : (isHighContrast ? colors.text : colors.border),
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // iOS safe area
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? -1 : -2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.1,
    shadowRadius: Platform.OS === 'ios' ? 4 : 8,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'ios' ? 6 : 8,
    minHeight: Platform.OS === 'ios' ? 50 : 56,
  },
  iconContainer: {
    marginBottom: Platform.OS === 'ios' ? 2 : 4,
    height: Platform.OS === 'ios' ? 26 : 24,
    width: Platform.OS === 'ios' ? 26 : 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: Platform.OS === 'ios' ? 10 : 11,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textAlign: 'center',
    marginTop: Platform.OS === 'ios' ? 1 : 2,
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: Platform.OS === 'ios' ? '500' : '600',
  },
});