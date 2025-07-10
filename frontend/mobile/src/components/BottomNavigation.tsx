import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

export type TabName = 'home' | 'camera' | 'recipes' | 'saved' | 'profile';

interface BottomNavigationProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TabIcon: React.FC<{ name: TabName; isActive: boolean }> = ({ name, isActive }) => {
  const iconColor = isActive ? 'rgb(22, 163, 74)' : '#9CA3AF';
  const size = 24;

  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 12L5 10M5 10L12 3L19 10M5 10V20A1 1 0 006 21H9M19 10L21 12M19 10V20A1 1 0 0018 21H15M9 21V16A1 1 0 0110 15H14A1 1 0 0115 16V21M9 21H15"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    
    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16 13C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13C8 10.7909 9.79086 9 12 9C14.2091 9 16 10.7909 16 13Z"
            stroke={iconColor}
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      );
    
    case 'recipes':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M8 7H16"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M8 11H16"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M8 15H12"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );
    
    case 'saved':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z"
            stroke={iconColor}
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M20 21C20 16.0294 16.4183 12 12 12C7.58172 12 4 16.0294 4 21"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );
    
    default:
      return null;
  }
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const { t } = useTranslation();

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
        >
          <View style={styles.iconContainer}>
            <TabIcon name={tab.key} isActive={activeTab === tab.key} />
          </View>
          <Text style={[styles.label, activeTab === tab.key && styles.activeLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
    paddingTop: 12,
    shadowColor: '#000',
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
    color: '#6B7280',
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 2,
  },
  activeLabel: {
    color: 'rgb(22, 163, 74)',
    fontWeight: '600',
  },
});