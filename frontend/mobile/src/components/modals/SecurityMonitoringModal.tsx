import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES, SPRING_CONFIGS } from '../../constants/animations';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { height: screenHeight } = Dimensions.get('window');

interface SecurityData {
  csp: {
    totalReports: number;
    blockedRequests: number;
    topViolatedDirectives: Array<{
      directive: string;
      count: number;
    }>;
    recentReports: Array<{
      documentUri: string;
      violatedDirective: string;
      blockedUri: string;
      timestamp: string;
    }>;
  };
  rateLimiting: {
    totalBlocked: number;
    topBlockedIPs: Array<{
      ip: string;
      count: number;
      lastBlocked: string;
    }>;
    recentBlocks: Array<{
      ip: string;
      endpoint: string;
      timestamp: string;
      reason: string;
    }>;
  };
  authentication: {
    failedLogins: number;
    suspiciousActivity: Array<{
      ip: string;
      attempts: number;
      lastAttempt: string;
    }>;
  };
}

interface SecurityMonitoringModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SecurityMonitoringModal({ visible, onClose }: SecurityMonitoringModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(false);
  const styles = getStyles(colors, insets);

  // Animation values - Bottom sheet style
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fetchSecurityData();
      // Bottom sheet entrance animation
      opacity.value = withTiming(1, {
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2),
      });
      translateY.value = withSpring(0, SPRING_CONFIGS.MODAL);
    } else {
      // Bottom sheet exit animation
      opacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.QUICK,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2),
      });
      translateY.value = withTiming(screenHeight, {
        duration: ANIMATION_DURATIONS.QUICK,
        easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2),
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${baseUrl}/api/admin/security`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityData(data.data);
      } else {
        Alert.alert(t('common.error'), t('admin.errorLoadingSecurityData'));
      }
    } catch (error) {
      console.log('Error fetching security data:', error);
      Alert.alert(t('common.error'), t('admin.errorLoadingSecurityData'));
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    if (loading) return;
    
    // Bottom sheet exit animation
    opacity.value = withTiming(0, {
      duration: ANIMATION_DURATIONS.QUICK,
      easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2),
    });
    translateY.value = withTiming(screenHeight, {
      duration: ANIMATION_DURATIONS.QUICK,
      easing: Easing.bezier(EASING_CURVES.IOS_EASE_IN.x1, EASING_CURVES.IOS_EASE_IN.y1, EASING_CURVES.IOS_EASE_IN.x2, EASING_CURVES.IOS_EASE_IN.y2),
    });
    
    // Call onClose after animation
    setTimeout(() => {
      onClose();
    }, ANIMATION_DURATIONS.QUICK);
  };

  const handleOverlayPress = () => {
    handleClose();
  };

  const renderSecurityCard = (title: string, value: string | number, icon: string, subtitle?: string) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );


  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleOverlayPress}
        />
        <Animated.View style={[styles.modalBox, modalStyle]}>
          {/* Bottom sheet handle */}
          <View style={styles.handle} />
          
          <Text style={styles.title}>{t('admin.securityMonitoring')}</Text>
          <Text style={styles.subtitle}>{t('admin.securityMonitoringDesc')}</Text>

          <View style={styles.content}>
            {loading && !securityData ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('admin.loadingSecurityData')}</Text>
              </View>
            ) : securityData ? (
              <View style={styles.contentContainer}>
                <View style={styles.section}>
                  <View style={styles.statsGrid}>
                    {/* CSP Cards */}
                    {securityData.csp && renderSecurityCard(t('admin.totalReports'), securityData.csp.totalReports, 'shield-outline')}
                    {securityData.csp && renderSecurityCard(t('admin.blockedRequests'), securityData.csp.blockedRequests, 'ban-outline')}
                    
                    {/* Rate Limiting Card */}
                    {securityData.rateLimiting && renderSecurityCard(t('admin.totalBlocked'), securityData.rateLimiting.totalBlocked, 'flash-off-outline')}
                    
                    {/* Authentication Card */}
                    {securityData.authentication && renderSecurityCard(t('admin.failedLogins'), securityData.authentication.failedLogins, 'key-outline')}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('admin.errorLoadingSecurityData')}</Text>
                <TouchableOpacity onPress={fetchSecurityData} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>{t('common.ok')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors: any, insets: { bottom: number }) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Math.max(insets?.bottom || 0, 16),
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 200,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.6,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    alignSelf: 'center',
  },
  content: {
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.buttonText,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: -32,
    marginHorizontal: 4,
  },
  closeButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});