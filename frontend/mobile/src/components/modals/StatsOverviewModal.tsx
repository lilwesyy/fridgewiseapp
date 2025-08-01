import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/apiService';
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

interface StatsData {
  totalUsers: number;
  totalRecipes: number;
  totalAnalyses: number;
  totalIngredients: number;
  popularIngredients: Array<{ name: string; count: number }>;
  recentUsers: Array<{
    _id: string;
    email: string;
    name: string;
    joinedAt: string;
    isVerified: boolean;
    isAdmin: boolean;
    totalRecipes: number;
    totalAnalyses: number;
  }>;
  performance: {
    avgResponseTime: number;
    uptime: number;
    totalRequests: number;
    errorRate: number;
  };
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
}

interface StatsOverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StatsOverviewModal({ visible, onClose }: StatsOverviewModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const styles = getStyles(colors, insets);

  // Animation values - Bottom sheet style
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fetchStats();
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

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/admin/stats');
      if (response.success) {
        setStatsData(response.data);
      } else {
        Alert.alert(t('common.error'), t('admin.loadingStats'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('admin.loadingStats'));
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

  const renderStatCard = (title: string, value: string | number, icon: string, subtitle?: string) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderPerformanceMetrics = () => {
    if (!statsData?.performance) return null;

    const { avgResponseTime, uptime, totalRequests, errorRate } = statsData.performance;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('admin.performanceMetrics')}</Text>
        <View style={styles.metricsGrid}>
          {renderStatCard(t('admin.avgResponseTime'), `${avgResponseTime}ms`, 'speedometer-outline')}
          {renderStatCard(t('admin.uptime'), `${uptime.toFixed(2)}%`, 'pulse-outline')}
          {renderStatCard(t('admin.totalRequests'), totalRequests.toLocaleString(), 'stats-chart-outline')}
          {renderStatCard(t('admin.errorRate'), `${errorRate.toFixed(2)}%`, 'warning-outline')}
        </View>
      </View>
    );
  };

  const renderPopularIngredients = () => {
    if (!statsData?.popularIngredients?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('admin.topIngredients')}</Text>
        <View style={styles.ingredientsList}>
          {statsData.popularIngredients.slice(0, 10).map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Text style={styles.ingredientName}>
                {index + 1}. {ingredient.name}
              </Text>
              <Text style={styles.ingredientCount}>{ingredient.count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderUserGrowthChart = () => {
    if (!statsData?.userGrowth?.length) return null;

    const maxCount = Math.max(...statsData.userGrowth.map(d => d.count));
    const screenWidth = Dimensions.get('window').width - 40;
    const chartWidth = screenWidth - 60;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('admin.userGrowthLast30Days')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartContainer}>
            {statsData.userGrowth.map((data, index) => {
              const height = (data.count / maxCount) * 100;
              return (
                <View key={index} style={styles.chartBar}>
                  <View style={[styles.chartBarFill, { height, backgroundColor: colors.primary }]} />
                  <Text style={styles.chartLabel}>{new Date(data.date).getDate()}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

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

          <Text style={styles.title}>{t('admin.statsOverview')}</Text>
          <Text style={styles.subtitle}>{t('admin.statsOverviewDesc')}</Text>

          <View style={styles.content}>
            {loading && !statsData ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('admin.loadingStats')}</Text>
              </View>
            ) : statsData ? (
              <View style={styles.contentContainer}>
                <View style={styles.section}>
                  <View style={styles.statsGrid}>
                    {renderStatCard(t('admin.totalUsers'), statsData.totalUsers, 'people-outline')}
                    {renderStatCard(t('admin.totalRecipes'), statsData.totalRecipes, 'restaurant-outline')}
                    {renderStatCard(t('admin.totalAnalyses'), statsData.totalAnalyses, 'analytics-outline')}
                    {renderStatCard(t('admin.totalIngredients'), statsData.totalIngredients, 'leaf-outline')}
                  </View>
                </View>

                {renderPerformanceMetrics()}
                {renderUserGrowthChart()}
                {renderPopularIngredients()}
              </View>
            ) : !loading ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('common.error')}</Text>
                <TouchableOpacity onPress={fetchStats} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ingredientsList: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  ingredientName: {
    fontSize: 14,
    color: colors.text,
  },
  ingredientCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.background,
    borderRadius: 12,
    minWidth: 300,
  },
  chartBar: {
    alignItems: 'center',
    marginHorizontal: 2,
    flex: 1,
  },
  chartBarFill: {
    width: 20,
    minHeight: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
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