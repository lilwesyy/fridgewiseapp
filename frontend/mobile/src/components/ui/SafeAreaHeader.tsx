import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface SafeAreaHeaderProps {
  title?: string;
  subtitle?: string;
  leftButton?: {
    icon: string;
    onPress: () => void;
    accessibilityLabel?: string;
  };
  rightButton?: {
    icon: string;
    onPress: () => void;
    accessibilityLabel?: string;
  };
  backgroundColor?: string;
  textColor?: string;
  children?: React.ReactNode;
  style?: any;
  showBorder?: boolean;
}

export const SafeAreaHeader: React.FC<SafeAreaHeaderProps> = ({
  title,
  subtitle,
  leftButton,
  rightButton,
  backgroundColor,
  textColor,
  children,
  style,
  showBorder = true,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor || colors.surface,
      paddingTop: insets.top,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: showBorder ? StyleSheet.hairlineWidth : 0,
      borderBottomColor: colors.border,
      shadowColor: colors.shadow || '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44, // Standard iOS header height
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: textColor || colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      color: textColor ? `${textColor}80` : colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    buttonPressed: {
      backgroundColor: colors.card,
    },
    invisibleButton: {
      opacity: 0,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Left Button */}
        {leftButton ? (
          <TouchableOpacity
            style={styles.button}
            onPress={leftButton.onPress}
            accessibilityLabel={leftButton.accessibilityLabel}
            activeOpacity={0.7}
          >
            <Ionicons
              name={leftButton.icon}
              size={24}
              color={textColor || colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.button, styles.invisibleButton]} />
        )}

        {/* Title/Content */}
        {children ? (
          <View style={styles.titleContainer}>
            {children}
          </View>
        ) : (
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}

        {/* Right Button */}
        {rightButton ? (
          <TouchableOpacity
            style={styles.button}
            onPress={rightButton.onPress}
            accessibilityLabel={rightButton.accessibilityLabel}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightButton.icon}
              size={24}
              color={textColor || colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.button, styles.invisibleButton]} />
        )}
      </View>
    </View>
  );
};

// Helper hook for getting optimal header height including safe area
export const useHeaderHeight = () => {
  const insets = useSafeAreaInsets();
  const baseHeight = Platform.OS === 'ios' ? 44 : 56; // Standard header heights
  const padding = 32; // Top and bottom padding
  
  return {
    headerHeight: insets.top + baseHeight + padding,
    safeAreaTop: insets.top,
    contentHeight: baseHeight + padding,
  };
};

// Utility for screens that need custom header spacing
export const getHeaderSpacing = (insets: { top: number }) => ({
  paddingTop: Platform.OS === 'ios' ? insets.top + 16 : insets.top + 24,
  marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
});
