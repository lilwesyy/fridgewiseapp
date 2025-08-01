import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  TextInput,
  Switch,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/apiService';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NotificationModal, NotificationType } from './NotificationModal';

interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  joinedAt?: string;
  isEmailVerified: boolean;
  isAdmin: boolean;
  totalRecipes: number;
  totalAnalyses: number;
  lastLoginAt?: string;
  role?: string;
  preferredLanguage?: string;
  dietaryRestrictions?: string[];
}

interface UserManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserManagementModal({ visible, onClose }: UserManagementModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showAdminsOnly, setShowAdminsOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
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
  const styles = getStyles(colors, insets);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fetchUsers();
      // Reset animations when modal opens
      headerOpacity.value = 0;
      contentOpacity.value = 0;

      // Entrance animations
      headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) });
      contentOpacity.value = withDelay(200, withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
    }
  }, [visible]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  useEffect(() => {
    filterUsers();
  }, [users, searchText, showAdminsOnly, showVerifiedOnly]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/admin/users');
      if (response.success) {
        console.log('Users data:', response.data.users);
        setUsers(response.data.users || []);
      } else {
        setNotification({
          visible: true,
          type: 'error',
          title: t('common.error'),
          message: t('admin.errorLoadingUsers', 'Impossibile caricare gli utenti'),
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('admin.errorLoadingUsers', 'Errore durante il caricamento degli utenti'),
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchText) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (showAdminsOnly) {
      filtered = filtered.filter(user => user.isAdmin);
    }

    if (showVerifiedOnly) {
      filtered = filtered.filter(user => user.isEmailVerified);
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const toggleUserAdmin = async (userId: string, currentAdminStatus: boolean) => {
    try {
      const response = await apiService.request(`/api/admin/users/${userId}/admin`, {
        method: 'PATCH',
        body: JSON.stringify({
          isAdmin: !currentAdminStatus
        })
      });

      if (response.success) {
        setUsers(users.map(user =>
          user._id === userId ? { ...user, isAdmin: !currentAdminStatus } : user
        ));
        setNotification({
          visible: true,
          type: 'success',
          title: t('common.success'),
          message: t('admin.adminStatusUpdated', `Utente ${!currentAdminStatus ? 'promosso ad' : 'rimosso da'} admin con successo`),
        });
      } else {
        setNotification({
          visible: true,
          type: 'error',
          title: t('common.error'),
          message: t('admin.errorUpdatingAdmin', 'Impossibile modificare i privilegi admin'),
        });
      }
    } catch (error) {
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('admin.errorUpdatingAdmin', 'Errore durante la modifica dei privilegi admin'),
      });
    }
  };

  const toggleUserVerification = async (userId: string, currentVerificationStatus: boolean) => {
    try {
      const response = await apiService.request(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          isEmailVerified: !currentVerificationStatus
        })
      });

      if (response.success) {
        setUsers(users.map(user =>
          user._id === userId ? { ...user, isEmailVerified: !currentVerificationStatus } : user
        ));
        setNotification({
          visible: true,
          type: 'success',
          title: t('common.success'),
          message: t('admin.verificationStatusUpdated', `Utente ${!currentVerificationStatus ? 'verificato' : 'non verificato'} con successo`),
        });
      } else {
        setNotification({
          visible: true,
          type: 'error',
          title: t('common.error'),
          message: t('admin.errorUpdatingVerification', 'Impossibile modificare lo stato di verifica'),
        });
      }
    } catch (error) {
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('admin.errorUpdatingVerification', 'Errore durante la modifica dello stato di verifica'),
      });
    }
  };

  const deleteUser = async (userId: string) => {
    setNotification({
      visible: true,
      type: 'warning',
      title: t('admin.confirmDeletion', 'Conferma eliminazione'),
      message: t('admin.confirmDeletionMessage', 'Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.'),
      buttons: [
        {
          text: t('common.cancel', 'Annulla'),
          style: 'cancel',
          onPress: () => setNotification(prev => ({ ...prev, visible: false }))
        },
        {
          text: t('common.delete', 'Elimina'),
          style: 'destructive',
          onPress: async () => {
            setNotification(prev => ({ ...prev, visible: false }));
            try {
              const response = await apiService.delete(`/api/admin/users/${userId}`);
              if (response.success) {
                setUsers(users.filter(user => user._id !== userId));
                setNotification({
                  visible: true,
                  type: 'success',
                  title: t('common.success'),
                  message: t('admin.userDeleted', 'Utente eliminato con successo'),
                });
              } else {
                setNotification({
                  visible: true,
                  type: 'error',
                  title: t('common.error'),
                  message: t('admin.errorDeletingUser', 'Impossibile eliminare l\'utente'),
                });
              }
            } catch (error) {
              setNotification({
                visible: true,
                type: 'error',
                title: t('common.error'),
                message: t('admin.errorDeletingUser', 'Errore durante l\'eliminazione dell\'utente'),
              });
            }
          }
        }
      ]
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderUserItem = (user: User) => (
    <View key={user._id} style={styles.userItem}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userRow}>
          <View style={styles.nameWithStatus}>
            <Text style={styles.userName}>{user.name}</Text>
            {user.isAdmin && <View style={styles.adminDot} />}
          </View>
          <View style={styles.statusBadges}>
            {user.isEmailVerified && <Ionicons name="checkmark-circle" size={14} color={colors.success} />}
          </View>
        </View>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.userStats}>
          <Text style={styles.userStat}>{user.totalRecipes || 0} ricette</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.userStat}>{user.totalAnalyses || 0} analisi</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, user.isAdmin ? styles.adminActive : styles.adminInactive]}
          onPress={() => toggleUserAdmin(user._id, user.isAdmin)}
        >
          <Ionicons name="person" size={16} color={user.isAdmin ? "#FFFFFF" : colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, user.isEmailVerified ? styles.verifyActive : styles.verifyInactive]}
          onPress={() => toggleUserVerification(user._id, user.isEmailVerified)}
        >
          <Ionicons name="checkmark" size={16} color={user.isEmailVerified ? "#FFFFFF" : colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteUser(user._id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <TouchableOpacity activeOpacity={0.7} style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('admin.userManagement')}</Text>
          <View style={styles.headerRight} />
        </Animated.View>

        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.filtersContainer}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('admin.searchUsers')}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterItem}>
                  <Text style={styles.filterLabel}>Solo Admin</Text>
                  <Switch
                    value={showAdminsOnly}
                    onValueChange={setShowAdminsOnly}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.filterItem}>
                  <Text style={styles.filterLabel}>Solo Verificati</Text>
                  <Switch
                    value={showVerifiedOnly}
                    onValueChange={setShowVerifiedOnly}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <Text style={styles.resultsCount}>
                {filteredUsers.length} utenti trovati
              </Text>
            </View>

            {loading && !users.length ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Caricamento utenti...</Text>
              </View>
            ) : filteredUsers.length > 0 ? (
              <View style={styles.usersList}>
                {filteredUsers.map(renderUserItem)}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nessun utente trovato</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
        buttons={notification.buttons}
      />
    </Modal>
  );
}

const getStyles = (colors: any, insets: { bottom: number }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  filtersContainer: {
    marginBottom: 25,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  resultsCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  usersList: {
    paddingHorizontal: 0,
  },
  userItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameWithStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStat: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  userActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminActive: {
    backgroundColor: colors.primary,
  },
  adminInactive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifyActive: {
    backgroundColor: colors.success,
  },
  verifyInactive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});