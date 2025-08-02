
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

interface SystemHealthData {
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
    uptime: number;
  };
  serverInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memoryUsage: {
      used: number;
      total: number;
      rss: number;
    };
    systemMemory: {
      total: number;
      used: number;
      free: number;
    };
  };
  environment: {
    nodeEnv: string;
    timezone: string;
    version: string;
    lastDeployment?: string;
    pid: number;
  };
}

interface SystemInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SystemInfoModal({ visible, onClose }: SystemInfoModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [systemHealthData, setSystemHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const styles = getStyles(colors, insets);

  // Animation values - Bottom sheet style
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fetchSystemHealthData();
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

  const fetchSystemHealthData = async () => {
    try {
      setLoading(true);

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3001';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch data from health endpoint
      const response = await fetch(`${baseUrl}/api/admin/health`, { headers });

      if (response.ok) {
        const data = await response.json();
        setSystemHealthData(data.data);
      } else {
        Alert.alert('Error', 'Unable to load system health data');
      }
    } catch (error) {
      console.log('Error fetching system health data:', error);
      Alert.alert('Error', 'Error loading system health data');
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const renderSystemCard = (title: string, value: string | number, icon: string, subtitle?: string) => (
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

          <Text style={styles.title}>{t('admin.systemInfo')}</Text>
          <Text style={styles.subtitle}>{t('admin.systemInfoDesc')}</Text>

          <View style={styles.content}>
            {loading && !systemHealthData ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('admin.loadingStats')}</Text>
              </View>
            ) : systemHealthData ? (
              <View style={styles.contentContainer}>
                <View style={styles.section}>
                  <View style={styles.statsGrid}>
                    {/* System Health Cards */}
                    {systemHealthData.systemHealth && renderSystemCard('CPU Usage', `${systemHealthData.systemHealth.cpuUsage.toFixed(1)}%`, 'hardware-chip-outline')}
                    {systemHealthData.systemHealth && renderSystemCard('Memory Usage', `${systemHealthData.systemHealth.memoryUsage.toFixed(1)}%`, 'server-outline')}
                    {systemHealthData.systemHealth && renderSystemCard('Disk Usage', `${systemHealthData.systemHealth.diskUsage.toFixed(1)}%`, 'save-outline')}
                    {systemHealthData.systemHealth && renderSystemCard('Active Connections', systemHealthData.systemHealth.activeConnections, 'people-outline')}
                    
                    {/* Server Info Cards */}
                    {systemHealthData.serverInfo && renderSystemCard('Node Version', systemHealthData.serverInfo.nodeVersion, 'logo-nodejs')}
                    {systemHealthData.serverInfo && renderSystemCard('Platform', `${systemHealthData.serverInfo.platform} (${systemHealthData.serverInfo.arch})`, 'desktop-outline')}
                    
                    {/* Environment Cards */}
                    {systemHealthData.environment && renderSystemCard('Environment', systemHealthData.environment.nodeEnv.toUpperCase(), 'settings-outline')}
                    {systemHealthData.systemHealth && renderSystemCard('Uptime', formatUptime(systemHealthData.systemHealth.uptime), 'time-outline')}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('common.error')}</Text>
                <TouchableOpacity onPress={fetchSystemHealthData} style={styles.retryButton}>
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
  detailsContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listItemText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  listItemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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