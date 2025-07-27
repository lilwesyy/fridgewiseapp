import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import Svg, { Path, Circle } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export type TabName = 'home' | 'camera' | 'recipes' | 'saved' | 'profile';

interface BottomNavigationProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TabIcon: React.FC<{ name: TabName; isActive: boolean; colors: any }> = ({ name, isActive, colors }) => {
  const iconColor = isActive ? colors.primary : colors.textSecondary;
  const size = 24;

  switch (name) {
    case 'home':
      return <MaterialIcons name="home" size={size} color={iconColor} />;
    
    case 'camera':
      return <MaterialIcons name="camera-alt" size={size} color={iconColor} />;
    
    case 'recipes':
      return <MaterialIcons name="menu-book" size={size} color={iconColor} />;
    
    case 'saved':
      return <MaterialIcons name="bookmark" size={size} color={iconColor} />;
    
    case 'profile':
      return <MaterialIcons name="person" size={size} color={iconColor} />;
    
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
    backgroundColor: colors.surface,
    borderTopWidth: isHighContrast ? 2 : 1,
    borderTopColor: isHighContrast ? colors.text : colors.border,
    paddingBottom: 20,
    paddingTop: 12,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 56,
  },
  iconContainer: {
    marginBottom: 4,
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 2,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});