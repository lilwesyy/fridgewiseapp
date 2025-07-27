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
import Svg, { Path } from 'react-native-svg';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ visible, onClose }) => {
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
          <Text style={styles.title}>{t('privacy.title')}</Text>
          <View style={styles.headerRight} />
        </Animated.View>

        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
              <Text style={styles.lastUpdated}>
                {t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}
              </Text>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('privacy.dataCollection.title')}</Text>
                <Text style={styles.sectionText}>{t('privacy.dataCollection.content')}</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• {t('privacy.dataCollection.account')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataCollection.ingredients')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataCollection.recipes')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataCollection.preferences')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataCollection.usage')}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('privacy.dataUse.title')}</Text>
                <Text style={styles.sectionText}>{t('privacy.dataUse.content')}</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• {t('privacy.dataUse.personalization')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataUse.aiAnalysis')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataUse.improvement')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataUse.support')}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('privacy.dataSharing.title')}</Text>
                <Text style={styles.sectionText}>{t('privacy.dataSharing.content')}</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• {t('privacy.dataSharing.ai')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataSharing.usda')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.dataSharing.noSale')}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('privacy.dataSecurity.title')}</Text>
                <Text style={styles.sectionText}>{t('privacy.dataSecurity.content')}</Text>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('privacy.userRights.title')}</Text>
                <Text style={styles.sectionText}>{t('privacy.userRights.content')}</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• {t('privacy.userRights.access')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.userRights.modify')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.userRights.delete')}</Text>
                  <Text style={styles.bulletItem}>• {t('privacy.userRights.portability')}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('privacy.cookies.title')}</Text>
                <Text style={styles.sectionText}>{t('privacy.cookies.content')}</Text>
              </Animated.View>

              <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
                <Text style={styles.sectionTitle}>{t('privacy.contact.title')}</Text>
                <Text style={styles.sectionText}>{t('privacy.contact.content')}</Text>
                <Text style={styles.contactInfo}>Email: info@fridgewiseai.com</Text>
              </Animated.View>

              <Animated.View style={[styles.disclaimerBox, sectionsAnimatedStyle]}>
                <Text style={styles.disclaimerTitle}>{t('privacy.disclaimer.title')}</Text>
                <Text style={styles.disclaimerText}>{t('privacy.disclaimer.content')}</Text>
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
  disclaimerBox: {
    backgroundColor: colors.primaryLight || 'rgba(22, 163, 74, 0.05)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.success,
    lineHeight: 20,
  },
});