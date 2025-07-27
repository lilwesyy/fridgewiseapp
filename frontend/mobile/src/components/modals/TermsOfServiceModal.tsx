import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const sectionsOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      // Reset animations when modal opens
      headerOpacity.value = 0;
      contentOpacity.value = 0;
      sectionsOpacity.value = 0;
      
      // Entrance animations
      headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) });
      contentOpacity.value = withDelay(200, withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
      sectionsOpacity.value = withDelay(400, withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.bezier(EASING_CURVES.IOS_EASE_OUT.x1, EASING_CURVES.IOS_EASE_OUT.y1, EASING_CURVES.IOS_EASE_OUT.x2, EASING_CURVES.IOS_EASE_OUT.y2) }));
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
          <Text style={styles.title}>{t('terms.title')}</Text>
          <View style={styles.headerRight} />
        </Animated.View>

        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
              <Text style={styles.lastUpdated}>
                {t('terms.lastUpdated')}: {new Date().toLocaleDateString()}
              </Text>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.acceptance.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.acceptance.content')}</Text>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.description.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.description.content')}</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• {t('terms.description.feature1')}</Text>
                  <Text style={styles.bulletItem}>• {t('terms.description.feature2')}</Text>
                  <Text style={styles.bulletItem}>• {t('terms.description.feature3')}</Text>
                  <Text style={styles.bulletItem}>• {t('terms.description.feature4')}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.userAccount.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.userAccount.content')}</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• {t('terms.userAccount.accuracy')}</Text>
                  <Text style={styles.bulletItem}>• {t('terms.userAccount.security')}</Text>
                  <Text style={styles.bulletItem}>• {t('terms.userAccount.responsibility')}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.usage.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.usage.content')}</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• {t('terms.usage.personal')}</Text>
                  <Text style={styles.bulletItem}>• {t('terms.usage.noMisuse')}</Text>
                  <Text style={styles.bulletItem}>• {t('terms.usage.noViolation')}</Text>
                  <Text style={styles.bulletItem}>• {t('terms.usage.noReverse')}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.content.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.content.content')}</Text>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.liability.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.liability.content')}</Text>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.termination.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.termination.content')}</Text>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.changes.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.changes.content')}</Text>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('terms.contact.title')}</Text>
                <Text style={styles.sectionText}>{t('terms.contact.content')}</Text>
                <Text style={styles.contactInfo}>Email: support@fridgewiseai.com</Text>
              </Animated.View>

              <Animated.View style={[styles.medicalDisclaimerBox, sectionsAnimatedStyle]}>
                <Text style={styles.disclaimerTitle}>{t('terms.medicalDisclaimer.title')}</Text>
                <Text style={styles.disclaimerText}>{t('terms.medicalDisclaimer.content')}</Text>
              </Animated.View>

              <Animated.View style={[styles.allergyDisclaimerBox, sectionsAnimatedStyle]}>
                <Text style={styles.disclaimerTitle}>{t('terms.allergyDisclaimer.title')}</Text>
                <Text style={styles.disclaimerText}>{t('terms.allergyDisclaimer.content')}</Text>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
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
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  bulletList: {
    paddingLeft: 10,
  },
  bulletItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 8,
  },
  medicalDisclaimerBox: {
    backgroundColor: colors.errorLight || 'rgba(220, 53, 69, 0.1)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginBottom: 15,
  },
  allergyDisclaimerBox: {
    backgroundColor: colors.warningLight || 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
});