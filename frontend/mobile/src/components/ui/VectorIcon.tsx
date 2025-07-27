import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

type IconLibrary = 'material' | 'ionicons';

interface VectorIconProps {
  library?: IconLibrary;
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const VectorIcon: React.FC<VectorIconProps> = ({
  library = 'material',
  name,
  size = 24,
  color,
  style
}) => {
  const { colors } = useTheme();
  const iconColor = color || colors.textSecondary;

  switch (library) {
    case 'ionicons':
      return (
        <Ionicons 
          name={name} 
          size={size} 
          color={iconColor} 
          style={style} 
        />
      );
    case 'material':
    default:
      return (
        <MaterialIcons 
          name={name} 
          size={size} 
          color={iconColor} 
          style={style} 
        />
      );
  }
};

// Common icon mappings for easy migration from SVG
export const IconMap = {
  // Navigation
  home: { library: 'material' as IconLibrary, name: 'home' },
  camera: { library: 'material' as IconLibrary, name: 'camera-alt' },
  menu: { library: 'material' as IconLibrary, name: 'menu' },
  
  // Actions
  close: { library: 'material' as IconLibrary, name: 'close' },
  check: { library: 'material' as IconLibrary, name: 'check' },
  edit: { library: 'material' as IconLibrary, name: 'edit' },
  delete: { library: 'material' as IconLibrary, name: 'delete' },
  share: { library: 'material' as IconLibrary, name: 'share' },
  add: { library: 'material' as IconLibrary, name: 'add' },
  
  // Arrows
  arrowBack: { library: 'material' as IconLibrary, name: 'arrow-back' },
  arrowForward: { library: 'material' as IconLibrary, name: 'arrow-forward' },
  arrowUp: { library: 'material' as IconLibrary, name: 'keyboard-arrow-up' },
  arrowDown: { library: 'material' as IconLibrary, name: 'keyboard-arrow-down' },
  
  // Status
  error: { library: 'material' as IconLibrary, name: 'error' },
  warning: { library: 'material' as IconLibrary, name: 'warning' },
  info: { library: 'material' as IconLibrary, name: 'info' },
  success: { library: 'material' as IconLibrary, name: 'check-circle' },
  
  // Food & cooking
  restaurant: { library: 'material' as IconLibrary, name: 'restaurant' },
  kitchen: { library: 'material' as IconLibrary, name: 'kitchen' },
  
  // Common UI
  search: { library: 'material' as IconLibrary, name: 'search' },
  favorite: { library: 'material' as IconLibrary, name: 'favorite' },
  bookmark: { library: 'material' as IconLibrary, name: 'bookmark' },
  person: { library: 'material' as IconLibrary, name: 'person' },
  settings: { library: 'material' as IconLibrary, name: 'settings' },
} as const;

// Convenience component for mapped icons
interface MappedIconProps {
  icon: keyof typeof IconMap;
  size?: number;
  color?: string;
  style?: any;
}

export const MappedIcon: React.FC<MappedIconProps> = ({
  icon,
  size = 24,
  color,
  style
}) => {
  const iconConfig = IconMap[icon];
  
  return (
    <VectorIcon
      library={iconConfig.library}
      name={iconConfig.name}
      size={size}
      color={color}
      style={style}
    />
  );
};