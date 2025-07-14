import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface MaintenanceScreenProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

const MaintenanceIcon = ({ colors }: { colors: any }) => {
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
        <Circle cx={60} cy={60} r={50} stroke={colors.primary} strokeWidth={3} strokeDasharray="8 4" />
        <G transform="translate(60, 60)">
          <Path
            d="M-15 -20 L15 -20 L15 -10 L25 -10 L0 15 L-25 -10 L-15 -10 Z"
            fill={colors.primary}
          />
        </G>
      </Svg>
    </Animated.View>
  );
};

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  onRetry,
  isRetrying = false,
}) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [retryCount, setRetryCount] = useState(0);

  // Safe translation helper
  const safeT = (key: string, fallback: string = key) => {
    try {
      const result = t(key);
      return typeof result === 'string' ? result : fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const iconScale = useSharedValue(0.8);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Entrance animations
    fadeIn.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
    slideUp.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) });
    iconScale.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    
    // Button press animation
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    setTimeout(() => {
      onRetry();
    }, 200);
  };

  const getMaintenanceMessage = () => {
    const language = i18n.language;
    
    if (language === 'it') {
      return {
        title: "Servizio Temporaneamente Non Disponibile",
        subtitle: "Aggiornamento in corso",
        description: "Ci scusiamo per l'inconveniente. L'app è attualmente in fase di aggiornamento per offrirti un servizio migliore.",
        details: "Il nostro team sta lavorando per ripristinare il servizio il prima possibile.",
        retryButton: "Riprova",
        retryText: retryCount > 0 ? `Tentativo ${retryCount + 1}` : "Tocca per riprovare"
      };
    }
    
    return {
      title: "Service Temporarily Unavailable",
      subtitle: "Update in Progress",
      description: "We apologize for the inconvenience. The app is currently being updated to provide you with better service.",
      details: "Our team is working to restore service as soon as possible.",
      retryButton: "Retry",
      retryText: retryCount > 0 ? `Attempt ${retryCount + 1}` : "Tap to retry"
    };
  };

  const messages = getMaintenanceMessage();

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, containerStyle]}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <MaintenanceIcon colors={colors} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>{messages.title}</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>{messages.subtitle}</Text>

        {/* Description */}
        <Text style={styles.description}>{messages.description}</Text>

        {/* Details */}
        <Text style={styles.details}>{messages.details}</Text>

        {/* Status indicators */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusRed]} />
            <Text style={styles.statusText}>
              {safeT('maintenance.serverStatus', 'Server Status')}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusYellow]} />
            <Text style={styles.statusText}>
              {safeT('maintenance.updating', 'Updating')}
            </Text>
          </View>
        </View>

        {/* Retry button */}
        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
            onPress={handleRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <Text style={styles.retryButtonText}>{messages.retryButton}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Retry info */}
        {!isRetrying && (
          <Text style={styles.retryInfo}>{messages.retryText}</Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FridgeWise</Text>
          <Text style={styles.footerSubtext}>
            {safeT('maintenance.thankYou', 'Thank you for your patience')}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  details: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusRed: {
    backgroundColor: '#EF4444',
  },
  statusYellow: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonDisabled: {
    backgroundColor: colors.textTertiary,
    shadowOpacity: 0.1,
  },
  retryButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  retryInfo: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});