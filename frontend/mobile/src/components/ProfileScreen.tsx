import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface ProfileScreenProps {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    dietaryRestrictions: user?.dietaryRestrictions || [],
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerTranslateY = useSharedValue(30);
  
  const sectionsOpacity = useSharedValue(0);
  const sectionsTranslateY = useSharedValue(40);
  
  const restrictionsOpacity = useSharedValue(0);
  const restrictionsScale = useSharedValue(0.9);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    headerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    
    // Sections animation with delay
    sectionsOpacity.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    sectionsTranslateY.value = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    
    // Restrictions animation with more delay
    restrictionsOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    restrictionsScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 100 }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      { scale: headerScale.value },
      { translateY: headerTranslateY.value }
    ],
  }));

  const sectionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sectionsOpacity.value,
    transform: [{ translateY: sectionsTranslateY.value }],
  }));

  const restrictionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: restrictionsOpacity.value,
    transform: [{ scale: restrictionsScale.value }],
  }));

  const availableDietaryRestrictions = [
    'vegetarian',
    'vegan',
    'gluten-free',
    'dairy-free',
    'nut-free',
    'soy-free',
    'egg-free'
  ];

  const handleSaveProfile = async (customData?: any) => {
    try {
      setIsUpdating(true);
      const dataToSave = customData || {
        name: profileForm.name,
        preferredLanguage: profileForm.preferredLanguage as 'en' | 'it',
        dietaryRestrictions: profileForm.dietaryRestrictions,
      };
      
      console.log('Saving profile data:', dataToSave);
      await updateProfile(dataToSave);
      
      // Update language if changed
      if (dataToSave.preferredLanguage !== i18n.language) {
        i18n.changeLanguage(dataToSave.preferredLanguage);
      }
      
      Alert.alert(t('common.success'), t('profile.updateSuccess'));
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      preferredLanguage: user?.preferredLanguage || 'en',
      dietaryRestrictions: user?.dietaryRestrictions || [],
    });
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setProfileForm(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.logout'), 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            onLogout();
          }
        }
      ]
    );
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.name || user?.email}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.joinDate}>
          {t('profile.memberSince')} {formatJoinDate(user?.createdAt)}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('auth.name')}</Text>
          <TextInput
            style={styles.input}
            value={profileForm.name}
            onChangeText={(text) => {
              setProfileForm({ ...profileForm, name: text });
              // Clear existing timeout
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }
              // Auto-save after a short delay
              saveTimeoutRef.current = setTimeout(() => {
                if (text !== user?.name && text.trim() !== '') {
                  handleSaveProfile();
                }
              }, 2000);
            }}
            placeholder={t('auth.name')}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={profileForm.email}
            editable={false}
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.helpText}>{t('profile.emailNotEditable')}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profile.preferredLanguage')}</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                profileForm.preferredLanguage === 'en' && styles.languageButtonActive
              ]}
              onPress={() => {
                const newForm = { ...profileForm, preferredLanguage: 'en' as 'en' | 'it' };
                setProfileForm(newForm);
                handleSaveProfile({
                  name: newForm.name,
                  preferredLanguage: newForm.preferredLanguage,
                  dietaryRestrictions: newForm.dietaryRestrictions,
                });
              }}
            >
              <Text style={[
                styles.languageButtonText,
                profileForm.preferredLanguage === 'en' && styles.languageButtonTextActive
              ]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                profileForm.preferredLanguage === 'it' && styles.languageButtonActive
              ]}
              onPress={() => {
                const newForm = { ...profileForm, preferredLanguage: 'it' as 'en' | 'it' };
                setProfileForm(newForm);
                handleSaveProfile({
                  name: newForm.name,
                  preferredLanguage: newForm.preferredLanguage,
                  dietaryRestrictions: newForm.dietaryRestrictions,
                });
              }}
            >
              <Text style={[
                styles.languageButtonText,
                profileForm.preferredLanguage === 'it' && styles.languageButtonTextActive
              ]}>
                Italiano
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profile.dietaryRestrictions')}</Text>
          <Animated.View style={[styles.restrictionsContainer, restrictionsAnimatedStyle]}>
            {availableDietaryRestrictions.map((restriction) => (
              <View key={restriction} style={styles.restrictionItem}>
                <Text style={styles.restrictionText}>
                  {t(`profile.dietary.${restriction.replace('-', '')}`)}
                </Text>
                <Switch
                  value={profileForm.dietaryRestrictions.includes(restriction)}
                  onValueChange={() => {
                    const newRestrictions = profileForm.dietaryRestrictions.includes(restriction)
                      ? profileForm.dietaryRestrictions.filter(r => r !== restriction)
                      : [...profileForm.dietaryRestrictions, restriction];
                    
                    const newForm = { ...profileForm, dietaryRestrictions: newRestrictions };
                    setProfileForm(newForm);
                    
                    setTimeout(() => {
                      handleSaveProfile({
                        name: newForm.name,
                        preferredLanguage: newForm.preferredLanguage,
                        dietaryRestrictions: newRestrictions,
                      });
                    }, 100);
                  }}
                  trackColor={{ false: '#E5E7EB', true: 'rgba(22, 163, 74, 0.3)' }}
                  thumbColor={profileForm.dietaryRestrictions.includes(restriction) ? 'rgb(22, 163, 74)' : '#F3F4F6'}
                />
              </View>
            ))}
          </Animated.View>
        </View>

        {isUpdating && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="rgb(22, 163, 74)" />
            <Text style={styles.savingText}>{t('profile.saving')}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
        <Text style={styles.sectionTitle}>{t('profile.appSettings')}</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>{t('profile.notifications')}</Text>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>{t('profile.privacy')}</Text>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>{t('profile.help')}</Text>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.footer, sectionsAnimatedStyle]}>
        <Text style={styles.footerText}>FridgeWise AI v1.0.0</Text>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgb(22, 163, 74)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
    color: '#ADB5BD',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  editButton: {
    backgroundColor: 'rgb(22, 163, 74)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  languageButtonActive: {
    borderColor: 'rgb(22, 163, 74)',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  languageButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: 'rgb(22, 163, 74)',
    fontWeight: '600',
  },
  restrictionsContainer: {
    gap: 12,
  },
  restrictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  restrictionText: {
    fontSize: 16,
    color: '#374151',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: 'rgb(22, 163, 74)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
  },
  settingValue: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 8,
    marginTop: 16,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'rgb(22, 163, 74)',
    fontWeight: '500',
  },
});