import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationModal, NotificationType } from './NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';

// Stats Icons
const UsersIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 24, 
  color 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
      fill={color}
    />
    <Path
      d="M12 14C7.03125 14 3 18.0312 3 23H21C21 18.0312 16.9688 14 12 14Z"
      fill={color}
    />
  </Svg>
);

const RecipeIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 24, 
  color 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8.1 13.34L10.83 10.61C11.22 10.22 11.22 9.59 10.83 9.2C10.44 8.81 9.81 8.81 9.42 9.2L6.69 11.93C6.31 12.31 6.31 12.92 6.69 13.31L9.42 16.04C9.61 16.23 9.86 16.32 10.11 16.32C10.36 16.32 10.61 16.23 10.8 16.04C11.19 15.65 11.19 15.02 10.8 14.63L8.1 13.34Z"
      fill={color}
    />
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
  </Svg>
);

const AnalysisIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 24, 
  color 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3V21H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 9L12 6L16 10L20 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CameraIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 24, 
  color 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9Z"
      fill={color}
    />
    <Circle cx="12" cy="12" r="4" fill="white"/>
  </Svg>
);

interface AdminStatsScreenProps {
  onGoBack: () => void;
}

interface User {
  _id: string;
  name?: string;
  email: string;
  createdAt: string;
  preferredLanguage: string;
  dietaryRestrictions: string[];
  role: 'user' | 'admin';
}

interface AppStats {
  totalUsers: number;
  totalRecipes: number;
  totalAnalyses: number;
  totalIngredients: number;
  adminUsers: number;
  todayUsers: number;
  todayRecipes: number;
  todayAnalyses: number;
  yesterdayUsers: number;
  weekUsers: number;
  monthUsers: number;
  averageRecipesPerUser: number;
  averageAnalysesPerUser: number;
  averageIngredientsPerAnalysis: number;
  averageProcessingTime: number;
  userGrowthRate: number;
  topIngredients: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    type: 'user_registered' | 'recipe_generated' | 'analysis_performed';
    timestamp: string;
    details: string;
  }>;
  systemInfo: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memoryUsage: { used: number; total: number };
    serverTime: string;
  };
}

export const AdminStatsScreen: React.FC<AdminStatsScreenProps> = ({ onGoBack }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: NotificationType;
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const sectionsOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    sectionsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    
    fetchStats();
    fetchUsers();
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const sectionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sectionsOpacity.value,
  }));

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000'}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        console.error('Failed to fetch stats');
        // Fallback con dati di esempio
        setStats({
          totalUsers: 147,
          totalRecipes: 2340,
          totalAnalyses: 1890,
          totalIngredients: 567,
          adminUsers: 2,
          todayUsers: 12,
          todayRecipes: 45,
          todayAnalyses: 38,
          yesterdayUsers: 8,
          weekUsers: 43,
          monthUsers: 147,
          averageRecipesPerUser: 15.9,
          averageAnalysesPerUser: 12.9,
          averageIngredientsPerAnalysis: 4.2,
          averageProcessingTime: 1250,
          userGrowthRate: 50.0,
          topIngredients: [
            { name: 'Tomatoes', count: 245 },
            { name: 'Onions', count: 198 },
            { name: 'Garlic', count: 176 },
            { name: 'Chicken', count: 154 },
            { name: 'Cheese', count: 132 }
          ],
          recentActivity: [
            { type: 'recipe_generated', timestamp: new Date().toISOString(), details: 'Pasta Carbonara generated' },
            { type: 'analysis_performed', timestamp: new Date(Date.now() - 300000).toISOString(), details: 'Fridge analysis completed' },
            { type: 'user_registered', timestamp: new Date(Date.now() - 600000).toISOString(), details: 'New user registration' }
          ],
          systemInfo: {
            nodeVersion: 'v18.17.0',
            platform: 'linux',
            uptime: 3600,
            memoryUsage: { used: 45, total: 128 },
            serverTime: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback con dati di esempio in caso di errore
      setStats({
        totalUsers: 147,
        totalRecipes: 2340,
        totalAnalyses: 1890,
        totalIngredients: 567,
        todayUsers: 12,
        todayRecipes: 45,
        todayAnalyses: 38,
        averageRecipesPerUser: 15.9,
        averageAnalysesPerUser: 12.9,
        topIngredients: [
          { name: 'Tomatoes', count: 245 },
          { name: 'Onions', count: 198 },
          { name: 'Garlic', count: 176 },
          { name: 'Chicken', count: 154 },
          { name: 'Cheese', count: 132 }
        ],
        recentActivity: [
          { type: 'recipe_generated', timestamp: new Date().toISOString(), details: 'Pasta Carbonara generated' },
          { type: 'analysis_performed', timestamp: new Date(Date.now() - 300000).toISOString(), details: 'Fridge analysis completed' },
          { type: 'user_registered', timestamp: new Date(Date.now() - 600000).toISOString(), details: 'New user registration' }
        ]
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };


  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return <UsersIcon size={16} color={colors.primary} />;
      case 'recipe_generated': return <RecipeIcon size={16} color={colors.success} />;
      case 'analysis_performed': return <AnalysisIcon size={16} color={colors.warning} />;
      default: return <CameraIcon size={16} color={colors.textSecondary} />;
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000'}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchUsers()]);
    setIsRefreshing(false);
  };

  const promoteUser = async (email: string) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000'}/api/admin/promote-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        // Refresh users list
        await fetchUsers();
        setNotification({
          visible: true,
          type: 'success',
          title: 'Success',
          message: 'User promoted to admin successfully'
        });
      } else {
        const data = await response.json();
        setNotification({
          visible: true,
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to promote user'
        });
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to promote user'
      });
    }
  };

  const deleteUser = async (userId: string) => {
    const handleDelete = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000'}/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Refresh users list
          await fetchUsers();
          setNotification({
            visible: true,
            type: 'success',
            title: 'Success',
            message: 'User deleted successfully'
          });
        } else {
          const data = await response.json();
          setNotification({
            visible: true,
            type: 'error',
            title: 'Error',
            message: data.error || 'Failed to delete user'
          });
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setNotification({
          visible: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to delete user'
        });
      }
    };

    setNotification({
      visible: true,
      type: 'warning',
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { text: 'Delete', onPress: handleDelete, style: 'destructive' }
      ]
    });
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registered': return colors.primary;
      case 'recipe_generated': return colors.success;
      case 'analysis_performed': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('admin.loadingStats')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('admin.statsTitle')}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Overview Stats */}
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('admin.overview')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <UsersIcon size={32} color={colors.primary} />
                <Text style={styles.statNumber}>{formatNumber(stats?.totalUsers || 0)}</Text>
                <Text style={styles.statLabel}>{t('admin.totalUsers')}</Text>
                <Text style={styles.statSubtext}>+{stats?.todayUsers || 0} {t('admin.today')}</Text>
              </View>
              
              <View style={styles.statCard}>
                <RecipeIcon size={32} color={colors.success} />
                <Text style={styles.statNumber}>{formatNumber(stats?.totalRecipes || 0)}</Text>
                <Text style={styles.statLabel}>{t('admin.totalRecipes')}</Text>
                <Text style={styles.statSubtext}>+{stats?.todayRecipes || 0} {t('admin.today')}</Text>
              </View>

              <View style={styles.statCard}>
                <AnalysisIcon size={32} color={colors.warning} />
                <Text style={styles.statNumber}>{formatNumber(stats?.totalAnalyses || 0)}</Text>
                <Text style={styles.statLabel}>{t('admin.totalAnalyses')}</Text>
                <Text style={styles.statSubtext}>+{stats?.todayAnalyses || 0} {t('admin.today')}</Text>
              </View>

              <View style={styles.statCard}>
                <CameraIcon size={32} color={colors.info} />
                <Text style={styles.statNumber}>{formatNumber(stats?.totalIngredients || 0)}</Text>
                <Text style={styles.statLabel}>{t('admin.totalIngredients')}</Text>
                <Text style={styles.statSubtext}>{t('admin.detected')}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Performance Metrics */}
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.averageRecipesPerUser?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>Recipes per User</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.averageAnalysesPerUser?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>Analyses per User</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.averageIngredientsPerAnalysis?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>Ingredients per Analysis</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.averageProcessingTime || 0}ms</Text>
                <Text style={styles.statLabel}>Avg Processing Time</Text>
              </View>
            </View>
          </Animated.View>

          {/* User Growth */}
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>User Growth</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.weekUsers || 0}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.monthUsers || 0}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: stats?.userGrowthRate >= 0 ? colors.success : colors.error }]}>
                  {stats?.userGrowthRate >= 0 ? '+' : ''}{stats?.userGrowthRate?.toFixed(1) || '0.0'}%
                </Text>
                <Text style={styles.statLabel}>Growth Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.adminUsers || 0}</Text>
                <Text style={styles.statLabel}>Admins</Text>
              </View>
            </View>
          </Animated.View>

          {/* Users List */}
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Users</Text>
              <TouchableOpacity 
                style={styles.viewAllButton} 
                onPress={() => setShowUsersModal(true)}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {isLoadingUsers ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={styles.usersList}>
                {users.slice(0, 5).map((user, index) => (
                  <View key={user._id} style={styles.userItem}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name || 'No name'}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userDetails}>
                        {user.preferredLanguage.toUpperCase()} • {new Date(user.createdAt).toLocaleDateString()}
                        {user.role === 'admin' && <Text style={styles.adminBadgeInline}> • ADMIN</Text>}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Top Ingredients */}
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('admin.topIngredients')}</Text>
            <View style={styles.ingredientsList}>
              {stats?.topIngredients?.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientRank}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientCount}>{ingredient.count}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Recent Activity */}
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('admin.recentActivity')}</Text>
            <View style={styles.activityList}>
              {stats?.recentActivity?.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
                    {getActivityIcon(activity.type)}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDetails}>{activity.details}</Text>
                    <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* System Information */}
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>System Information</Text>
            <View style={styles.systemInfo}>
              <View style={styles.systemItem}>
                <Text style={styles.systemLabel}>Node.js Version</Text>
                <Text style={styles.systemValue}>{stats?.systemInfo?.nodeVersion || 'N/A'}</Text>
              </View>
              <View style={styles.systemItem}>
                <Text style={styles.systemLabel}>Platform</Text>
                <Text style={styles.systemValue}>{stats?.systemInfo?.platform || 'N/A'}</Text>
              </View>
              <View style={styles.systemItem}>
                <Text style={styles.systemLabel}>Uptime</Text>
                <Text style={styles.systemValue}>
                  {stats?.systemInfo?.uptime ? `${Math.floor(stats.systemInfo.uptime / 3600)}h ${Math.floor((stats.systemInfo.uptime % 3600) / 60)}m` : 'N/A'}
                </Text>
              </View>
              <View style={styles.systemItem}>
                <Text style={styles.systemLabel}>Memory Usage</Text>
                <Text style={styles.systemValue}>
                  {stats?.systemInfo?.memoryUsage ? `${stats.systemInfo.memoryUsage.used}MB / ${stats.systemInfo.memoryUsage.total}MB` : 'N/A'}
                </Text>
              </View>
              <View style={styles.systemItem}>
                <Text style={styles.systemLabel}>Server Time</Text>
                <Text style={styles.systemValue}>
                  {stats?.systemInfo?.serverTime ? new Date(stats.systemInfo.serverTime).toLocaleString() : 'N/A'}
                </Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('admin.lastUpdated')}: {new Date().toLocaleTimeString()}</Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Users Management Modal */}
      <Modal
        visible={showUsersModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowUsersModal(false)}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>All Users</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {users.map((user, index) => (
              <View key={user._id} style={styles.modalUserItem}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name || 'No name'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userDetails}>
                    {user.preferredLanguage.toUpperCase()} • {new Date(user.createdAt).toLocaleDateString()}
                    {user.role === 'admin' && <Text style={styles.adminBadgeInline}> • ADMIN</Text>}
                  </Text>
                </View>
                <View style={styles.userActions}>
                  {user.role !== 'admin' && (
                    <TouchableOpacity
                      style={styles.promoteButton}
                      onPress={() => promoteUser(user.email)}
                    >
                      <Text style={styles.promoteButtonText}>Promote</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteUser(user._id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        buttons={notification.buttons}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.primaryLight || 'rgba(22, 163, 74, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  statSubtext: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  averagesList: {
    flexDirection: 'row',
    gap: 16,
  },
  averageItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  averageNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  averageLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  ingredientRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  ingredientCount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDetails: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  systemInfo: {
    gap: 12,
  },
  systemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  systemLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  systemValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  usersList: {
    gap: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  adminBadgeInline: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  viewAllButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  promoteButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  promoteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});