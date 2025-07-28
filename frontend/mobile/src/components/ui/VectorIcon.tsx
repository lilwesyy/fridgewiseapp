import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { Platform } from 'react-native';

interface VectorIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  filled?: boolean; // For iOS-style filled/outline behavior
}

export const VectorIcon: React.FC<VectorIconProps> = ({
  name,
  size = Platform.OS === 'ios' ? 24 : 22,
  color,
  style,
  filled = false
}) => {
  const { colors } = useTheme();
  const iconColor = color || colors.textSecondary;
  
  // Convert icon name to iOS-style outline/filled
  const getIconName = (iconName: string, isFilled: boolean) => {
    // If already has -outline suffix, handle it
    if (iconName.endsWith('-outline')) {
      return isFilled ? iconName.replace('-outline', '') : iconName;
    }
    // If it's a base name, add -outline if not filled
    return isFilled ? iconName : `${iconName}-outline`;
  };

  const finalIconName = getIconName(name, filled);

  return (
    <Ionicons 
      name={finalIconName} 
      size={size} 
      color={iconColor} 
      style={style} 
    />
  );
};

// Common icon mappings with iOS-style Ionicons
export const IconMap = {
  // Navigation
  home: 'home',
  camera: 'camera',
  menu: 'menu',
  
  // Actions
  close: 'close',
  check: 'checkmark',
  edit: 'create',
  delete: 'trash',
  share: 'share',
  add: 'add',
  
  // Arrows
  arrowBack: 'chevron-back',
  arrowForward: 'chevron-forward',
  arrowUp: 'chevron-up',
  arrowDown: 'chevron-down',
  
  // Status
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
  success: 'checkmark-circle',
  
  // Food & cooking
  restaurant: 'restaurant',
  kitchen: 'home',
  
  // Common UI
  search: 'search',
  favorite: 'heart',
  bookmark: 'bookmark',
  person: 'person',
  settings: 'settings',
  
  // Additional iOS-style icons
  star: 'star',
  time: 'time',
  location: 'location',
  mail: 'mail',
  phone: 'call',
  image: 'image',
  document: 'document-text',
  folder: 'folder',
  download: 'download',
  upload: 'cloud-upload',
  refresh: 'refresh',
  filter: 'filter',
  sort: 'swap-vertical',
  grid: 'grid',
  list: 'list',
  play: 'play',
  pause: 'pause',
  stop: 'stop',
} as const;

// Convenience component for mapped icons
interface MappedIconProps {
  icon: keyof typeof IconMap;
  size?: number;
  color?: string;
  style?: any;
  filled?: boolean;
}

export const MappedIcon: React.FC<MappedIconProps> = ({
  icon,
  size = Platform.OS === 'ios' ? 24 : 22,
  color,
  style,
  filled = false
}) => {
  const iconName = IconMap[icon];
  
  return (
    <VectorIcon
      name={iconName}
      size={size}
      color={color}
      style={style}
      filled={filled}
    />
  );
};