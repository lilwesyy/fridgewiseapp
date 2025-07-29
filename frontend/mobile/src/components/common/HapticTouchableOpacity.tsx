import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { HapticService } from '../../services/hapticService';

interface HapticTouchableOpacityProps extends TouchableOpacityProps {
  /**
   * Type of haptic feedback to trigger
   * - 'light': Light tap for regular buttons
   * - 'medium': Medium impact for important actions
   * - 'heavy': Heavy impact for significant actions
   * - 'primary': Medium impact for primary action buttons
   * - 'selection': For picker/selector interactions
   * - 'none': Disable haptic feedback
   */
  hapticType?: 'light' | 'medium' | 'heavy' | 'primary' | 'selection' | 'none';
  
  /**
   * Whether to trigger haptic feedback on press
   * @default true
   */
  enableHaptic?: boolean;
}

/**
 * TouchableOpacity with built-in haptic feedback
 * 
 * Usage:
 * <HapticTouchableOpacity hapticType="light" onPress={handlePress}>
 *   <Text>Button</Text>
 * </HapticTouchableOpacity>
 */
export const HapticTouchableOpacity: React.FC<HapticTouchableOpacityProps> = ({
  hapticType = 'light',
  enableHaptic = true,
  onPress,
  children,
  ...props
}) => {
  const handlePress = (event: any) => {
    // Trigger haptic feedback before the actual onPress
    if (enableHaptic && hapticType !== 'none') {
      switch (hapticType) {
        case 'light':
          HapticService.light();
          break;
        case 'medium':
          HapticService.medium();
          break;
        case 'heavy':
          HapticService.heavy();
          break;
        case 'primary':
          HapticService.primaryAction();
          break;
        case 'selection':
          HapticService.selection();
          break;
      }
    }
    
    // Call the original onPress handler
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
    >
      {children}
    </TouchableOpacity>
  );
};

export default HapticTouchableOpacity;