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
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');

interface OfflineScreenProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

const OfflineIcon = ({ colors }: { colors: any }) => {
  const pulse = useSharedValue(1);
  
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(1, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="wifi-outline" size={120} color={colors.textSecondary} />
    </Animated.View>
  );
};

export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry, isRetrying = false }) => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const [retryCount, setRetryCount] = useState(0);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const styles = getStyles(colors);

  useEffect(() => {
    // Get network info
    NetInfo.fetch().then(state => {
      setNetworkInfo(state);
    });
  }, []);

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const iconScale = useSharedValue(0.8);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Entrance animations
    fadeIn.value = withTiming(1, { 
      duration: ANIMATION_DURATIONS.STANDARD, 
      easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) 
    });
    slideUp.value = withTiming(0, { 
      duration: ANIMATION_DURATIONS.STANDARD, 
      easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) 
    });
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
      withTiming(0.95, { duration: ANIMATION_DURATIONS.INSTANT }),
      withTiming(1, { duration: ANIMATION_DURATIONS.INSTANT })
    );
    
    setTimeout(() => {
      onRetry();
    }, 200);
  };

  const getOfflineMessage = () => {
    const language = i18n.language;
    
    if (language === 'it') {
      return {
        title: "Connessione Internet Assente",
        subtitle: "Modalità Offline",
        description: "Non è possibile connettersi a internet. Controlla la tua connessione di rete e riprova.",
        details: "Verifica che il WiFi o i dati mobili siano attivi e funzionanti.",
        retryButton: "Riprova Connessione",
        retryText: retryCount > 0 ? `Tentativo ${retryCount + 1}` : "Tocca per riprovare",
        connectionStatus: "Stato connessione:",
        noConnection: "Nessuna connessione",
        wifiDisabled: "WiFi disattivato",
        cellularDisabled: "Dati mobili disattivati"
      };
    }
    
    return {
      title: "No Internet Connection",
      subtitle: "Offline Mode",
      description: "Unable to connect to the internet. Check your network connection and try again.",
      details: "Make sure WiFi or mobile data is enabled and working properly.",
      retryButton: "Retry Connection",
      retryText: retryCount > 0 ? `Attempt ${retryCount + 1}` : "Tap to retry",
      connectionStatus: "Connection status:",
      noConnection: "No connection",
      wifiDisabled: "WiFi disabled",
      cellularDisabled: "Mobile data disabled"
    };
  };

  const messages = getOfflineMessage();

  const getConnectionStatus = () => {
    if (!networkInfo) return messages.noConnection;
    
    if (networkInfo.type === 'wifi' && !networkInfo.isConnected) {
      return messages.wifiDisabled;
    }
    
    if (networkInfo.type === 'cellular' && !networkInfo.isConnected) {
      return messages.cellularDisabled;
    }
    
    return messages.noConnection;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, containerStyle]}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <OfflineIcon colors={colors} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>{messages.title}</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>{messages.subtitle}</Text>

        {/* Description */}
        <Text style={styles.description}>{messages.description}</Text>

        {/* Details */}
        <Text style={styles.details}>{messages.details}</Text>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>{messages.connectionStatus}</Text>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.error || '#FF6B6B' }]} />
            <Text style={styles.statusText}>{getConnectionStatus()}</Text>
          </View>
        </View>

        {/* Retry Button */}
        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
            onPress={handleRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            {isRetrying ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.retryButtonText}>{messages.retryButton}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Retry count */}
        {retryCount > 0 && (
          <Text style={styles.retryCount}>{messages.retryText}</Text>
        )}
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
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    maxWidth: 300,
  },
  details: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 280,
    opacity: 0.8,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minWidth: 180,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 16,
    opacity: 0.7,
  },
});