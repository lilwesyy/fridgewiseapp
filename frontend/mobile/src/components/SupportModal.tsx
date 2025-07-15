import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  SafeAreaView,
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
import Svg, { Path } from 'react-native-svg';

// Send Icon Component
const SendIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = 'white' 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
      fill={color}
    />
  </Svg>
);

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: NotificationType;
    title: string;
    message: string;
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

  const supportEmail = 'info@fridgewiseai.com';

  useEffect(() => {
    if (visible) {
      // Reset animations when modal opens
      headerOpacity.value = 0;
      contentOpacity.value = 0;
      sectionsOpacity.value = 0;
      
      // Entrance animations
      headerOpacity.value = withTiming(1, { duration: 600 });
      contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
      sectionsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    }
  }, [visible]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const sectionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sectionsOpacity.value,
  }));

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('support.fillAllFields')
      });
      return;
    }

    setIsLoading(true);

    const emailSubject = encodeURIComponent(`[FridgeWise Support] ${subject}`);
    const emailBody = encodeURIComponent(
      `Hello FridgeWise Support Team,

${message}

---
User Information:
- Email: ${user?.email || 'N/A'}
- Name: ${user?.name || 'N/A'}
- App Version: FridgeWise AI v2.0.0
- Platform: ${Platform.OS} ${Platform.Version}`
    );

    const mailtoUrl = `mailto:${supportEmail}?subject=${emailSubject}&body=${emailBody}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setNotification({
          visible: true,
          type: 'success',
          title: t('support.emailClientOpened'),
          message: t('support.emailClientOpenedMessage')
        });
        setSubject('');
        setMessage('');
        onClose();
      } else {
        // Fallback: show the email address to copy
        setNotification({
          visible: true,
          type: 'warning',
          title: t('support.noEmailClient'),
          message: `${t('support.noEmailClientMessage', { email: supportEmail })}\n\n${supportEmail}`
        });
      }
    } catch (error) {
      console.error('Error opening email client:', error);
      setNotification({
        visible: true,
        type: 'error',
        title: t('common.error'),
        message: t('support.emailError', { email: supportEmail })
      });
    }

    setIsLoading(false);
  };

  const predefinedTopics = [
    t('support.topics.bugReport'),
    t('support.topics.featureRequest'),
    t('support.topics.accountIssue'),
    t('support.topics.technicalSupport'),
    t('support.topics.feedback'),
    t('support.topics.other')
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('support.title')}</Text>
          <TouchableOpacity 
            style={[styles.sendButton, (!subject.trim() || !message.trim() || isLoading) && styles.sendButtonDisabled]} 
            onPress={handleSendEmail}
            disabled={!subject.trim() || !message.trim() || isLoading}
          >
            {isLoading ? (
              <Text style={[styles.sendButtonText, styles.sendButtonTextDisabled]}>
                {t('support.sending')}
              </Text>
            ) : (
              <SendIcon 
                size={20} 
                color={(!subject.trim() || !message.trim()) ? colors.textSecondary : colors.buttonText} 
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.content, contentAnimatedStyle]}>
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('support.contactInfo')}</Text>
            <Text style={styles.sectionText}>{t('support.contactDescription')}</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.emailLabel}>{t('support.emailLabel')}</Text>
              <Text style={styles.emailAddress}>{supportEmail}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('support.quickTopics')}</Text>
            <Text style={styles.sectionText}>{t('support.quickTopicsDescription')}</Text>
            <View style={styles.topicsContainer}>
              {predefinedTopics.map((topic, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.topicButton,
                    subject === topic && styles.topicButtonSelected
                  ]}
                  onPress={() => setSubject(topic)}
                >
                  <Text style={styles.topicButtonText}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('support.composeMessage')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('support.subject')}</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder={t('support.subjectPlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('support.message')}</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder={t('support.messagePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          <Animated.View style={[styles.infoSection, sectionsAnimatedStyle]}>
            <Text style={styles.infoTitle}>{t('support.automaticInfo')}</Text>
            <Text style={styles.infoText}>{t('support.automaticInfoDescription')}</Text>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>• {t('support.infoEmail')}: {user?.email || 'N/A'}</Text>
              <Text style={styles.infoItem}>• {t('support.infoName')}: {user?.name || 'N/A'}</Text>
              <Text style={styles.infoItem}>• {t('support.infoVersion')}: FridgeWise AI v2.0.0</Text>
              <Text style={styles.infoItem}>• {t('support.infoPlatform')}: {Platform.OS} {Platform.Version}</Text>
            </View>
          </Animated.View>
        </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    color: colors.buttonText,
    fontSize: 12,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: colors.textSecondary,
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
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  emailContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  emailLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  emailAddress: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicButton: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topicButtonSelected: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
  },
  topicButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoList: {
    paddingLeft: 8,
  },
  infoItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});