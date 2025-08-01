import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { performanceMonitor } from '../../utils/performanceMonitor';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface PerformanceDebuggerProps {
  enabled?: boolean;
}

export const PerformanceDebugger: React.FC<PerformanceDebuggerProps> = ({ 
  enabled = __DEV__ 
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>({});

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const report = performanceMonitor.getPerformanceReport();
      const loadTimes = performanceMonitor.getAllLoadTimes();
      setPerformanceData({ report, loadTimes });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Only show to admins
  if (!enabled || user?.role !== 'admin') return null;

  const styles = StyleSheet.create({
    debugButton: {
      position: 'absolute',
      top: 200,
      right: 10,
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 20,
      zIndex: 1000,
    },
    debugButtonText: {
      color: colors.buttonText,
      fontSize: 12,
      fontWeight: 'bold',
    },
    modal: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    metricValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    loadTimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 2,
    },
    componentName: {
      color: colors.text,
      fontSize: 13,
    },
    loadTime: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    fastLoad: {
      color: colors.success || '#10B981',
    },
    slowLoad: {
      color: colors.error || '#EF4444',
    },
  });

  const getLoadTimeColor = (time: number) => {
    if (time < 1000) return styles.fastLoad;
    if (time > 2000) return styles.slowLoad;
    return { color: colors.textSecondary };
  };

  return (
    <>
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.debugButtonText}>⚡</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>🚀 Lazy Loading Performance</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Performance Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Summary</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Components Loaded:</Text>
                <Text style={styles.metricValue}>{performanceData.report?.totalComponents || 0}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Average Load Time:</Text>
                <Text style={styles.metricValue}>{performanceData.report?.averageLoadTime || 0}ms</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Fastest Component:</Text>
                <Text style={styles.metricValue}>{performanceData.report?.fastestComponent || 'none'}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Slowest Component:</Text>
                <Text style={styles.metricValue}>{performanceData.report?.slowestComponent || 'none'}</Text>
              </View>
            </View>

            {/* Individual Load Times */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏱️ Component Load Times</Text>
              {Object.entries(performanceData.loadTimes || {}).map(([component, time]) => (
                <View key={component} style={styles.loadTimeRow}>
                  <Text style={styles.componentName}>{component}</Text>
                  <Text style={[styles.loadTime, getLoadTimeColor(time as number)]}>
                    {time}ms
                  </Text>
                </View>
              ))}
              {Object.keys(performanceData.loadTimes || {}).length === 0 && (
                <Text style={styles.metricLabel}>No components loaded yet</Text>
              )}
            </View>

            {/* Performance Tips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Tips</Text>
              <Text style={styles.metricLabel}>
                • Load times &lt;1s are good (green){'\n'}
                • Load times &gt;2s need optimization (red){'\n'}
                • Use preloading for frequently accessed screens{'\n'}
                • Monitor bundle size for slow components
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};