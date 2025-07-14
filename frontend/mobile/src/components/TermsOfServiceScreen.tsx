import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface TermsOfServiceScreenProps {
  onGoBack: () => void;
}

export const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ onGoBack }) => {
  const { t } = useTranslation();
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const sectionsOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    sectionsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('terms.title')}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>{t('terms.lastUpdated')}: {new Date().toLocaleDateString()}</Text>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
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
    color: 'rgb(22, 163, 74)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  bulletList: {
    paddingLeft: 10,
  },
  bulletItem: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: 'rgb(22, 163, 74)',
    fontWeight: '500',
    marginTop: 8,
  },
  medicalDisclaimerBox: {
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
    marginTop: 10,
    marginBottom: 15,
  },
  allergyDisclaimerBox: {
    backgroundColor: '#FFF0E6',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721C24',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#721C24',
    lineHeight: 20,
  },
});